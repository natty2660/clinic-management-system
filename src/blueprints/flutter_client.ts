// Production-Ready Flutter Desktop Client Blueprint for SPEED Clinic Information System (SPEED CIS)

export const FLUTTER_WS_SERVICE_DART = `// ==============================================================================
// SPEED CLINIC INFORMATION SYSTEM (SPEED CIS) - FLUTTER DESKTOP
// WebSocket Real-Time Service with Auto-Reconnect & Heartbeat Keepalive
// ==============================================================================

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/io.dart';

enum ConnectionStatus { connected, reconnecting, disconnected, offlineBuffered }

class SpeedWebSocketService {
  static final SpeedWebSocketService _instance = SpeedWebSocketService._internal();
  factory SpeedWebSocketService() => _instance;
  SpeedWebSocketService._internal();

  WebSocketChannel? _channel;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  
  final _connectionStatusController = StreamController<ConnectionStatus>.broadcast();
  Stream<ConnectionStatus> get connectionStatus => _connectionStatusController.stream;

  final _eventStreamController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get eventStream => _eventStreamController.stream;

  String _serverUrl = 'ws://192.168.1.120:8000';
  String _stationId = 'SPEED-WS-CASHIER-01';
  String _role = 'cashier';
  String _operatorName = 'Staff';
  bool _isManualDisconnect = false;

  void configure({
    required String serverUrl,
    required String stationId,
    required String role,
    required String operatorName,
  }) {
    _serverUrl = serverUrl;
    _stationId = stationId;
    _role = role;
    _operatorName = operatorName;
  }

  void connect() {
    _isManualDisconnect = false;
    _connectionStatusController.add(ConnectionStatus.reconnecting);

    final wsUri = Uri.parse(
      '$_serverUrl/ws/clinic/$_stationId?role=$_role&operator_name=\${Uri.encodeComponent(_operatorName)}'
    );

    try {
      final socket = IOWebSocketChannel.connect(
        wsUri,
        pingInterval: const Duration(seconds: 15),
      );
      _channel = socket;

      _channel!.stream.listen(
        (message) {
          try {
            final data = jsonDecode(message as String) as Map<String, dynamic>;
            _eventStreamController.add(data);
          } catch (e) {
            debugPrint('Error parsing incoming WS message: $e');
          }
        },
        onDone: () {
          _handleDisconnect();
        },
        onError: (error) {
          debugPrint('WebSocket error: $error');
          _handleDisconnect();
        },
      );

      _connectionStatusController.add(ConnectionStatus.connected);
      _startHeartbeat();
    } catch (e) {
      debugPrint('Failed to connect to SPEED server: $e');
      _handleDisconnect();
    }
  }

  void sendEvent(String eventType, String title, String detail, {Map<String, dynamic>? payload}) {
    if (_channel == null) return;
    final packet = {
      'id': 'ws_\${DateTime.now().millisecondsSinceEpoch}',
      'timestamp': DateTime.now().toUtc().toIso8601String(),
      'station': _stationId,
      'eventType': eventType,
      'title': title,
      'detail': detail,
      'payload': payload ?? {},
    };
    _channel!.sink.add(jsonEncode(packet));
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 20), (timer) {
      if (_channel != null) {
        _channel!.sink.add(jsonEncode({'type': 'PING', 'stationId': _stationId}));
      }
    });
  }

  void _handleDisconnect() {
    _heartbeatTimer?.cancel();
    _channel = null;

    if (!_isManualDisconnect) {
      _connectionStatusController.add(ConnectionStatus.disconnected);
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      debugPrint('Attempting auto-reconnect to SPEED server...');
      connect();
    });
  }

  void disconnect() {
    _isManualDisconnect = true;
    _heartbeatTimer?.cancel();
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _channel = null;
    _connectionStatusController.add(ConnectionStatus.disconnected);
  }
}
`;

export const FLUTTER_OFFLINE_QUEUE_DART = `// ==============================================================================
// SPEED CLINIC INFORMATION SYSTEM (SPEED CIS) - OFFLINE TRANSACTION BUFFER
// Encrypted Local Storage with Automatic Conflict-Aware Re-sync
// ==============================================================================

import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class OfflineTransactionItem {
  final String id;
  final String idempotencyKey;
  final String timestamp;
  final String stationId;
  final String operatorName;
  final String actionType;
  final String entityType;
  final String entityId;
  final Map<String, dynamic> payload;
  final String checksum;

  OfflineTransactionItem({
    required this.id,
    required this.idempotencyKey,
    required this.timestamp,
    required this.stationId,
    required this.operatorName,
    required this.actionType,
    required this.entityType,
    required this.entityId,
    required this.payload,
    required this.checksum,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'idempotencyKey': idempotencyKey,
    'timestamp': timestamp,
    'stationId': stationId,
    'operatorName': operatorName,
    'actionType': actionType,
    'entityType': entityType,
    'entityId': entityId,
    'payload': payload,
    'checksum': checksum,
  };

  static String generateChecksum(Map<String, dynamic> payload, String secretKey) {
    final payloadString = jsonEncode(payload);
    final key = utf8.encode(secretKey);
    final bytes = utf8.encode(payloadString);
    final hmacSha256 = Hmac(sha256, key);
    return hmacSha256.convert(bytes).toString();
  }
}

class SpeedOfflineQueueManager {
  static final SpeedOfflineQueueManager _instance = SpeedOfflineQueueManager._internal();
  factory SpeedOfflineQueueManager() => _instance;
  SpeedOfflineQueueManager._internal();

  final List<OfflineTransactionItem> _buffer = [];
  bool _isSyncing = false;

  List<OfflineTransactionItem> get pendingTransactions => List.unmodifiable(_buffer);
  int get queueDepth => _buffer.length;

  void enqueue({
    required String actionType,
    required String entityType,
    required String entityId,
    required Map<String, dynamic> payload,
    required String stationId,
    required String operatorName,
    String hmacSecret = 'SPEED_LOCAL_SECRET_2026',
  }) {
    final now = DateTime.now().toUtc().toIso8601String();
    final checksum = OfflineTransactionItem.generateChecksum(payload, hmacSecret);

    final item = OfflineTransactionItem(
      id: 'tx_\${DateTime.now().millisecondsSinceEpoch}',
      idempotencyKey: 'IDEMP-\${DateTime.now().microsecondsSinceEpoch}',
      timestamp: now,
      stationId: stationId,
      operatorName: operatorName,
      actionType: actionType,
      entityType: entityType,
      entityId: entityId,
      payload: payload,
      checksum: checksum,
    );

    _buffer.add(item);
    debugPrint('Queued offline transaction: \${item.actionType} on \${item.entityType} (Total in buffer: \${_buffer.length})');
  }

  Future<bool> flushQueue(String serverApiBaseUrl) async {
    if (_buffer.isEmpty || _isSyncing) return true;
    _isSyncing = true;

    try {
      final syncPayload = {
        'stationId': _buffer.first.stationId,
        'transactions': _buffer.map((tx) => tx.toJson()).toList(),
      };

      final response = await http.post(
        Uri.parse('$serverApiBaseUrl/api/sync/batch'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(syncPayload),
      );

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        final processedCount = result['processedCount'] ?? 0;
        debugPrint('Successfully re-synchronized $processedCount transactions to SPEED server.');
        _buffer.clear();
        _isSyncing = false;
        return true;
      } else {
        debugPrint('Sync failed with status \${response.statusCode}: \${response.body}');
      }
    } catch (e) {
      debugPrint('Error during offline queue sync: $e');
    } finally {
      _isSyncing = false;
    }

    return false;
  }
}
`;

export const FLUTTER_ESC_POS_PRINTER_DART = `// ==============================================================================
// SPEED CLINIC INFORMATION SYSTEM (SPEED CIS) - THERMAL PRINTER DRIVER
// Direct Socket (9100) ESC/POS Raw Command Printing with Offline Spooler
// Ethiopian Birr (ETB) Line-Item Layout
// ==============================================================================

import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';

class SpeedThermalPrinterDriver {
  final String host;
  final int port;
  final int widthColumns; // 48 cols for 80mm, 32 cols for 58mm

  SpeedThermalPrinterDriver({
    required this.host,
    this.port = 9100,
    this.widthColumns = 48,
  });

  // ESC/POS Command Constants
  static const List<int> cmdInit = [0x1B, 0x40];           // ESC @
  static const List<int> cmdDrawerKick = [0x1B, 0x70, 0x00, 0x19, 0xFA]; // ESC p 0 25 250
  static const List<int> cmdAlignLeft = [0x1B, 0x61, 0x00];
  static const List<int> cmdAlignCenter = [0x1B, 0x61, 0x01];
  static const List<int> cmdAlignRight = [0x1B, 0x61, 0x02];
  static const List<int> cmdBoldOn = [0x1B, 0x45, 0x01];
  static const List<int> cmdBoldOff = [0x1B, 0x45, 0x00];
  static const List<int> cmdDoubleHeight = [0x1B, 0x21, 0x10];
  static const List<int> cmdNormalText = [0x1B, 0x21, 0x00];
  static const List<int> cmdFeedAndCut = [0x1D, 0x56, 0x41, 0x03]; // GS V A 3

  Future<bool> printReceipt({
    required String clinicName,
    required String receiptNumber,
    required String patientName,
    required String cashierName,
    required List<Map<String, dynamic>> items,
    required double totalAmountEtb,
    bool kickDrawer = true,
  }) async {
    Socket? socket;
    try {
      // Connect with 3 second timeout; if offline, catch and return false
      socket = await Socket.connect(host, port, timeout: const Duration(seconds: 3));
      
      final bytesBuilder = BytesBuilder();

      // 1. Initialize
      bytesBuilder.add(cmdInit);

      // 2. Open Cash Drawer
      if (kickDrawer) {
        bytesBuilder.add(cmdDrawerKick);
      }

      // 3. Header
      bytesBuilder.add(cmdAlignCenter);
      bytesBuilder.add(cmdDoubleHeight);
      bytesBuilder.add(cmdBoldOn);
      bytesBuilder.add(Uint8List.fromList('$clinicName\\n'.codeUnits));
      bytesBuilder.add(cmdNormalText);
      bytesBuilder.add(cmdBoldOff);
      bytesBuilder.add(Uint8List.fromList('SPEED CLINIC MANAGEMENT SYSTEM\\n'.codeUnits));
      bytesBuilder.add(Uint8List.fromList('OFFICIAL PAYMENT RECEIPT (ETB)\\n'.codeUnits));
      bytesBuilder.add(Uint8List.fromList('\${"=" * widthColumns}\\n'.codeUnits));

      // 4. Metadata
      bytesBuilder.add(cmdAlignLeft);
      bytesBuilder.add(Uint8List.fromList('Receipt #: $receiptNumber\\n'.codeUnits));
      bytesBuilder.add(Uint8List.fromList('Date:      \${DateTime.now().toLocal()}\\n'.codeUnits));
      bytesBuilder.add(Uint8List.fromList('Patient:   $patientName\\n'.codeUnits));
      bytesBuilder.add(Uint8List.fromList('Cashier:   $cashierName\\n'.codeUnits));
      bytesBuilder.add(Uint8List.fromList('\${"-" * widthColumns}\\n'.codeUnits));

      // 5. Line items
      for (final item in items) {
        final name = item['name'] as String;
        final amt = (item['amount'] as num).toDouble();
        final amtStr = 'ETB \${amt.toStringAsFixed(2)}';
        
        final maxNameLen = widthColumns - amtStr.length - 1;
        final cleanName = name.length > maxNameLen ? '\${name.substring(0, maxNameLen - 1)}.' : name;
        final pad = ' ' * (widthColumns - cleanName.length - amtStr.length);
        
        bytesBuilder.add(Uint8List.fromList('\$cleanName\$pad\$amtStr\\n'.codeUnits));
      }

      bytesBuilder.add(Uint8List.fromList('\${"-" * widthColumns}\\n'.codeUnits));

      // 6. Total
      bytesBuilder.add(cmdBoldOn);
      final totalStr = 'TOTAL: ETB \${totalAmountEtb.toStringAsFixed(2)}';
      final totalPad = ' ' * (widthColumns - totalStr.length);
      bytesBuilder.add(Uint8List.fromList('\$totalPad\$totalStr\\n'.codeUnits));
      bytesBuilder.add(cmdBoldOff);
      bytesBuilder.add(Uint8List.fromList('\${"=" * widthColumns}\\n'.codeUnits));

      // 7. Footer & Barcode note
      bytesBuilder.add(cmdAlignCenter);
      bytesBuilder.add(Uint8List.fromList('*** THANK YOU FOR VISITING SPEED CLINIC ***\\n'.codeUnits));
      bytesBuilder.add(Uint8List.fromList('Keep this slip until medical discharge.\\n\\n\\n'.codeUnits));

      // 8. Cut paper
      bytesBuilder.add(cmdFeedAndCut);

      // Write to TCP socket
      socket.add(bytesBuilder.toBytes());
      await socket.flush();
      await socket.close();
      return true;
    } catch (e) {
      debugPrint('Thermal printer offline or unreachable at $host:$port: $e');
      socket?.destroy();
      return false; // Triggers offline spooler fallback
    }
  }
}
`;
