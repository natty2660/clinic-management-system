// Production Deployment & Service Installation Blueprints for SPEED Clinic Management System

export const WINDOWS_NSSM_INSTALLER_BAT = `@echo off
:: ==============================================================================
:: SPEED CLINIC MANAGEMENT SYSTEM (SPEED CIS) - WINDOWS SERVICE INSTALLER
:: Installs the FastAPI Backend as a resilient Windows System Service using NSSM
:: ==============================================================================

echo -------------------------------------------------------------
echo  Installing SPEED CIS Server as a Windows Service...
echo -------------------------------------------------------------

set SERVICE_NAME=SpeedClinicServer
set NSSM_EXE=%~dp0tools\\nssm.exe
set PYTHON_EXE=%~dp0venv\\Scripts\\python.exe
set APP_DIR=%~dp0server

:: Check Administrator Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This installer must be run as Administrator!
    pause
    exit /b 1
)

:: 1. Stop existing service if running
%NSSM_EXE% stop %SERVICE_NAME% >nul 2>&1
%NSSM_EXE% remove %SERVICE_NAME% confirm >nul 2>&1

:: 2. Install new service
echo [1/4] Registering service with NSSM...
%NSSM_EXE% install %SERVICE_NAME% "%PYTHON_EXE%" "-m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"
%NSSM_EXE% set %SERVICE_NAME% AppDirectory "%APP_DIR%"
%NSSM_EXE% set %SERVICE_NAME% Description "SPEED Clinic Information System - High Concurrency Local Server"

:: 3. Configure Failure Recovery & Auto-restart
echo [2/4] Configuring automatic crash recovery...
%NSSM_EXE% set %SERVICE_NAME% AppRestartDelay 2000
%NSSM_EXE% set %SERVICE_NAME% Start SERVICE_AUTO_START

:: 4. Configure stdout/stderr log redirection
echo [3/4] Setting up centralized audit log files...
if not exist "%~dp0logs" mkdir "%~dp0logs"
%NSSM_EXE% set %SERVICE_NAME% AppStdout "%~dp0logs\\speed_server_stdout.log"
%NSSM_EXE% set %SERVICE_NAME% AppStderr "%~dp0logs\\speed_server_stderr.log"

:: 5. Open Windows Firewall Port 8000 & 8443
echo [4/4] Opening Windows Firewall rules for Clinic LAN...
netsh advfirewall firewall add rule name="SPEED CIS Local Server (Port 8000)" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="SPEED CIS Secure TLS (Port 8443)" dir=in action=allow protocol=TCP localport=8443

:: Start the service
echo Starting service %SERVICE_NAME%...
%NSSM_EXE% start %SERVICE_NAME%

echo.
echo =============================================================
echo  SUCCESS: SPEED CIS Server is now running as a Windows Service!
echo  Endpoint: http://127.0.0.1:8000 (LAN access enabled)
echo =============================================================
pause
`;

export const LINUX_SYSTEMD_SERVICE = `[Unit]
Description=SPEED Clinic Information System (SPEED CIS) Daemon
After=network.target

[Service]
Type=simple
User=speedadmin
WorkingDirectory=/opt/speed-cis/backend
ExecStart=/opt/speed-cis/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=3
LimitNOFILE=65535
StandardOutput=append:/var/log/speed-cis/server_out.log
StandardError=append:/var/log/speed-cis/server_err.log

[Install]
WantedBy=multi-user.target
`;

export const LAN_TLS_SETUP_BAT = `@echo off
:: ==============================================================================
:: SPEED CLINIC INFORMATION SYSTEM - LOCAL LAN TLS (HTTPS/WSS) SETUP
:: Generates a trusted root CA for clinic workstations using mkcert
:: ==============================================================================

echo Generating local LAN trusted SSL/TLS certificates for SPEED CIS...

:: Install mkcert CA
mkcert -install

:: Generate cert for Localhost and Clinic Server LAN IP (e.g. 192.168.1.120)
mkcert -cert-file speed_cert.pem -key-file speed_key.pem localhost 127.0.0.1 192.168.1.120 speed-server.local

echo.
echo Generated speed_cert.pem and speed_key.pem.
echo Use in FastAPI uvicorn start:
echo uvicorn main:app --ssl-keyfile=speed_key.pem --ssl-certfile=speed_cert.pem --host 0.0.0.0 --port 8443
`;

export const TESTING_CHECKLIST_CONCURRENCY = `## SPEED CIS Multi-Desktop Concurrency & Reliability Verification Checklist

### 1. Concurrency & Optimistic Locking Test Matrix
- [x] **Two Cashiers Taking Payment for Same Consultation**:
  - Cashier A (Workstation 1) and Cashier B (Workstation 2) both open Visit #101 simultaneously.
  - Cashier A clicks "Confirm Cash Payment" (ETB 350.00). State advances, version increments from v1 -> v2.
  - Cashier B clicks "Confirm Cash Payment".
  - System intercepts with **409 Concurrency Conflict**: "Payment was already completed by Cashier A at 10:14 AM." Prevents duplicate revenue collection.
- [x] **Simultaneous Doctor Diagnosis & Lab Order**:
  - Doctor at Workstation 3 opens Consultation and writes SOAP notes while Lab Tech at Workstation 5 updates Hematology results.
  - Granular entity versioning ensures lab orders and consultation notes don't overwrite each other.
- [x] **Pharmacy Stock Race Condition (Last Pack of Amoxicillin)**:
  - Batch AMX-2025Z has 1 pack remaining in dispensary.
  - Doctor 1 prescribes 1 pack; Doctor 2 prescribes 1 pack.
  - Pharmacy Counter 1 dispenses pack (stock decrements 1 -> 0, version increments).
  - Pharmacy Counter 2 tries to dispense: System flags **Insufficient Stock (0 remaining)** with immediate alert sound.

### 2. Network Disconnect & Offline Buffer Test
- [x] Unplug LAN ethernet cable / click "Disconnect LAN" simulator.
- [x] Cashier registers 2 walk-in patients and issues entry cards in offline mode.
- [x] Transactions are queued in encrypted local storage with SHA-256 HMAC checksums.
- [x] Header displays prominent **Offline Buffer (2 transactions queued)** warning badge.
- [x] Reconnect LAN cable: Background sync detects network return, replays batch sequentially, resolves queue without operator intervention.

### 3. Thermal Printer Offline Fallback Test
- [x] Power off network thermal printer or disconnect IP 192.168.1.201.
- [x] Cashier clicks "Print Receipt".
- [x] Driver attempts connection with 3-second timeout.
- [x] On failure: Gracefully notifies operator with "Printer Offline", queues job to local spooler, and keeps UI snappy without freezing.
- [x] Turn printer back on: Spooler automatically dispatches buffered jobs.
`;
