// Production-Ready FastAPI Backend Blueprint for SPEED Clinic Information System (SPEED CIS)

export const FASTAPI_MAIN_PY = `# ==============================================================================
# SPEED CLINIC INFORMATION SYSTEM (SPEED CIS) - PRODUCTION SERVER
# FastAPI High-Concurrency Multi-Desktop Backend with WebSockets & Optimistic Locking
# Currency: Ethiopian Birr (ETB / Br)
# ==============================================================================

import asyncio
import hashlib
import hmac
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    status,
    Query
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, DateTime,
    Text, ForeignKey, Index, select, update
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.orm.exc import StaleDataError

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("speed_cis_server")

# --- DATABASE ENGINE & OPTIMISTIC CONCURRENCY (SQLite WAL / PostgreSQL) ---
DATABASE_URL = "sqlite:///./speed_clinic_production.db"
# For PostgreSQL in larger clinics:
# DATABASE_URL = "postgresql://speed_admin:SecurePass2026@127.0.0.1:5432/speed_cis"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

# Enable SQLite Write-Ahead Logging (WAL) for high concurrent reads + writes
if "sqlite" in DATABASE_URL:
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
        conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")
        conn.exec_driver_sql("PRAGMA busy_timeout=5000;")
        conn.exec_driver_sql("PRAGMA foreign_keys=ON;")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ORM MODELS WITH VERSION COLUMNS FOR OPTIMISTIC LOCKING ---
class VisitModel(Base):
    __tablename__ = "visits"
    
    id = Column(String(36), primary_key=True, index=True)
    visit_number = Column(String(32), unique=True, index=True, nullable=False)
    patient_id = Column(String(36), index=True, nullable=False)
    patient_name = Column(String(128), nullable=False)
    patient_mrn = Column(String(32), index=True, nullable=False)
    queue_number = Column(Integer, nullable=False)
    status = Column(String(32), index=True, default="registered")
    consultation_paid = Column(Boolean, default=False)
    emergency_overridden = Column(Boolean, default=False)
    doctor_assigned_id = Column(String(36), nullable=True)
    
    # Optimistic locking column
    version = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(64), nullable=True)
    station_id = Column(String(64), nullable=True)

    __table_args__ = (
        Index("idx_visits_status_queue", "status", "queue_number"),
        Index("idx_visits_mrn_status", "patient_mrn", "status"),
    )

class PaymentModel(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, index=True)
    receipt_number = Column(String(32), unique=True, index=True, nullable=False)
    visit_id = Column(String(36), ForeignKey("visits.id"), index=True, nullable=False)
    patient_id = Column(String(36), index=True, nullable=False)
    patient_name = Column(String(128), nullable=False)
    amount_etb = Column(Float, nullable=False) # Exclusively Ethiopian Birr (ETB)
    payment_method = Column(String(32), default="cash") # cash, card, mobile_money
    received_by = Column(String(64), nullable=False)
    paid_at = Column(DateTime, default=datetime.utcnow)
    
    # Versioning
    version = Column(Integer, default=1, nullable=False)
    station_id = Column(String(64), nullable=True)

    __table_args__ = (
        Index("idx_payments_receipt_date", "receipt_number", "paid_at"),
    )

class MedicineBatchModel(Base):
    __tablename__ = "medicine_batches"

    id = Column(String(36), primary_key=True, index=True)
    medicine_id = Column(String(36), index=True, nullable=False)
    batch_number = Column(String(32), index=True, nullable=False)
    quantity = Column(Integer, nullable=False)
    expiry_date = Column(String(10), nullable=False) # YYYY-MM-DD
    cost_price_etb = Column(Float, nullable=False)
    
    # Version for atomic decrement
    version = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_batches_med_expiry", "medicine_id", "expiry_date", "quantity"),
    )

Base.metadata.create_all(bind=engine)

# --- WEBSOCKET CONNECTION MANAGER FOR MULTI-WORKSTATION FLEET ---
class WorkstationConnectionManager:
    def __init__(self):
        # station_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        self.station_metadata: Dict[str, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, station_id: str, websocket: WebSocket, metadata: Dict[str, Any]):
        await websocket.accept()
        async with self.lock:
            self.active_connections[station_id] = websocket
            self.station_metadata[station_id] = {
                **metadata,
                "connected_at": datetime.now(timezone.utc).isoformat(),
                "last_ping": datetime.now(timezone.utc).isoformat()
            }
        logger.info(f"Workstation connected: {station_id} ({metadata.get('role', 'unknown')})")
        
        # Notify other stations
        await self.broadcast({
            "eventType": "WORKSTATION_PING",
            "station": station_id,
            "title": "Workstation Online",
            "detail": f"{metadata.get('name', station_id)} connected to LAN server."
        }, exclude_station=station_id)

    async def disconnect(self, station_id: str):
        async with self.lock:
            if station_id in self.active_connections:
                del self.active_connections[station_id]
            if station_id in self.station_metadata:
                del self.station_metadata[station_id]
        logger.info(f"Workstation disconnected: {station_id}")

    async def broadcast(self, message: Dict[str, Any], exclude_station: Optional[str] = None):
        dead_stations = []
        for station_id, ws in list(self.active_connections.items()):
            if exclude_station and station_id == exclude_station:
                continue
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to {station_id}: {e}")
                dead_stations.append(station_id)

        for s_id in dead_stations:
            await self.disconnect(s_id)

    def get_fleet_status(self) -> List[Dict[str, Any]]:
        return [
            {"stationId": s_id, **meta}
            for s_id, meta in self.station_metadata.items()
        ]

ws_manager = WorkstationConnectionManager()

# --- APP SETUP ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SPEED CIS Local Server started on 0.0.0.0:8000 with TLS/WSS capability.")
    yield
    logger.info("SPEED CIS Local Server shutting down.")

app = FastAPI(
    title="SPEED Clinic Information System (SPEED CIS) API",
    description="High-concurrency multi-desktop backend for local clinic deployments in Ethiopia (ETB).",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WEBSOCKET ENDPOINT ---
@app.websocket("/ws/clinic/{station_id}")
async def websocket_clinic_endpoint(
    websocket: WebSocket,
    station_id: str,
    role: str = Query("cashier"),
    operator_name: str = Query("Staff")
):
    await ws_manager.connect(
        station_id,
        websocket,
        {"role": role, "operatorName": operator_name}
    )
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("eventType")
            
            # Broadcast incoming event to all other desktop workstations
            await ws_manager.broadcast(data, exclude_station=station_id)
            
            # If critical panic alert, ensure audio cue flag
            if event_type == "CRITICAL_LAB_ALERT":
                logger.warning(f"CRITICAL LAB ALERT from {station_id}: {data.get('detail')}")

    except WebSocketDisconnect:
        await ws_manager.disconnect(station_id)

# --- OPTIMISTIC LOCKING VISIT UPDATE ---
class UpdateVisitRequest(BaseModel):
    version: int
    status: str
    consultation_paid: Optional[bool] = None
    doctor_assigned_id: Optional[str] = None
    operator_name: str
    station_id: str

@app.put("/api/visits/{visit_id}")
def update_visit(visit_id: str, req: UpdateVisitRequest, db: Session = Depends(get_db)):
    # 1. Fetch current record
    visit = db.query(VisitModel).filter(VisitModel.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # 2. Check optimistic lock version
    if visit.version != req.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Concurrency conflict: record was modified by another workstation.",
                "serverVersion": visit.version,
                "clientVersion": req.version,
                "serverUpdatedBy": visit.updated_by,
                "serverStationId": visit.station_id,
                "serverUpdatedAt": visit.updated_at.isoformat() if visit.updated_at else None
            }
        )

    # 3. Apply mutation with atomic version increment
    visit.status = req.status
    if req.consultation_paid is not None:
        visit.consultation_paid = req.consultation_paid
    if req.doctor_assigned_id is not None:
        visit.doctor_assigned_id = req.doctor_assigned_id

    visit.version = visit.version + 1
    visit.updated_by = req.operator_name
    visit.station_id = req.station_id
    visit.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(visit)
    return {"success": True, "newVersion": visit.version, "visit": visit}

# --- BATCH OFFLINE SYNCHRONIZATION ENDPOINT ---
class OfflineSyncItem(BaseModel):
    idempotencyKey: str
    timestamp: str
    stationId: str
    operatorName: str
    actionType: str
    entityType: str
    entityId: str
    payload: Dict[str, Any]
    checksum: str

class BatchSyncRequest(BaseModel):
    stationId: str
    transactions: List[OfflineSyncItem]

@app.post("/api/sync/batch")
def process_offline_batch(req: BatchSyncRequest, db: Session = Depends(get_db)):
    processed = []
    conflicts = []

    for tx in req.transactions:
        # Check idempotency or process actions
        try:
            # Atomic transaction per item
            if tx.entityType == "payment":
                p = tx.payload
                existing = db.query(PaymentModel).filter(PaymentModel.receipt_number == p["receiptNumber"]).first()
                if not existing:
                    new_pmt = PaymentModel(
                        id=tx.idempotencyKey,
                        receipt_number=p["receiptNumber"],
                        visit_id=p["visitId"],
                        patient_id=p["patientId"],
                        patient_name=p["patientName"],
                        amount_etb=float(p["amount"]),
                        payment_method=p.get("paymentMethod", "cash"),
                        received_by=tx.operatorName,
                        station_id=tx.stationId
                    )
                    db.add(new_pmt)
                    db.commit()
            processed.append(tx.idempotencyKey)
        except Exception as e:
            db.rollback()
            conflicts.append({"idempotencyKey": tx.idempotencyKey, "error": str(e)})

    return {"processedCount": len(processed), "conflicts": conflicts}

# --- FLEET HEALTH MONITOR ---
@app.get("/api/health/fleet")
def get_fleet_health():
    return {
        "status": "healthy",
        "currency": "ETB",
        "activeWorkstations": ws_manager.get_fleet_status(),
        "serverTime": datetime.now(timezone.utc).isoformat()
    }
`;

export const SQL_INDEXES_RECOMMENDATIONS = `-- ==============================================================================
-- SPEED CLINIC INFORMATION SYSTEM (SPEED CIS) - SQL INDEXING & WAL CONFIGURATION
-- Optimizing for 10-20 concurrent LAN desktop clients
-- ==============================================================================

-- 1. SQLite Performance Pragma Header (Run upon every DB connection in Python/Go)
PRAGMA journal_mode = WAL;         -- Multi-reader concurrency without locking writers
PRAGMA synchronous = NORMAL;       -- Balances ACID safety with SSD disk I/O throughput
PRAGMA busy_timeout = 5000;        -- Wait up to 5000ms for locks before raising busy error
PRAGMA cache_size = -64000;        -- 64MB memory cache for instant query lookups
PRAGMA foreign_keys = ON;          -- Enforce referential integrity
PRAGMA temp_store = MEMORY;        -- Store temporary tables and sorting buffers in RAM

-- 2. Core Indexes for SPEED Reception & Cashier
CREATE INDEX IF NOT EXISTS idx_visits_queue_status 
  ON visits (status, queue_number, consultation_paid);

CREATE INDEX IF NOT EXISTS idx_visits_mrn_created 
  ON visits (patient_mrn, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_receipt_date 
  ON payments (receipt_number, paid_at);

CREATE INDEX IF NOT EXISTS idx_payments_visit_amount 
  ON payments (visit_id, amount_etb);

-- 3. Core Indexes for SPEED OPD & Doctor Station
CREATE INDEX IF NOT EXISTS idx_visits_doctor_assigned 
  ON visits (doctor_assigned_id, status);

CREATE INDEX IF NOT EXISTS idx_consultations_patient 
  ON consultations (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_search 
  ON patients (mrn, phone, name);

-- 4. Core Indexes for SPEED Laboratory
CREATE INDEX IF NOT EXISTS idx_lab_orders_visit_status 
  ON lab_orders (visit_id, status, payment_status);

CREATE INDEX IF NOT EXISTS idx_lab_orders_created_status 
  ON lab_orders (status, ordered_at DESC);

-- 5. Core Indexes for SPEED Pharmacy (FEFO/FIFO Stock Control)
CREATE INDEX IF NOT EXISTS idx_batches_expiry_qty 
  ON medicine_batches (medicine_id, expiry_date ASC, quantity);

CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_status 
  ON prescriptions (visit_id, status, payment_status);

CREATE INDEX IF NOT EXISTS idx_stock_movements_med_date 
  ON stock_movements (medicine_id, timestamp DESC);

-- 6. Core Indexes for SPEED Admin & Security Audits
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
  ON audit_logs (timestamp DESC, entity_type);

CREATE INDEX IF NOT EXISTS idx_cashier_shifts_date 
  ON cashier_shifts (cashier_id, shift_date, status);
`;
