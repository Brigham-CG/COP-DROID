#include "Network.h"
#include "Config.h"
#include <WiFi.h>
#include <WebSocketsClient.h>

static WebSocketsClient webSocket;
static bool wsConnected = false;

static void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Desconectado del servidor");
      break;

    case WStype_CONNECTED:
      wsConnected = true;
      Serial.printf("[WS] Conectado a %s\n", (const char*)payload);
      break;

    case WStype_TEXT:
      // Ack opcional del servidor
      break;

    case WStype_ERROR:
      Serial.println("[WS] Error de conexión");
      break;

    default:
      break;
  }
}

void initNetwork() {
  // ── Conexión Wi-Fi ────────────────────────────────────────────────
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("Conectando a %s ", WIFI_SSID);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("----------------------------");
  Serial.println(" ESP32-CAM conectado");
  Serial.printf(" Red      : %s\n", WIFI_SSID);
  Serial.printf(" IP local : %s\n", WiFi.localIP().toString().c_str());
  Serial.printf(" ID       : %s\n", DEVICE_ID);
  Serial.println("----------------------------");

  // ── Conexión WebSocket ──────────────────────────────────────────────
  String wsPath = String("/ws/") + DEVICE_ID;
  webSocket.begin(SERVER_HOST, SERVER_PORT, wsPath);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(15000, 3000, 2);
}

void loopNetwork() {
  webSocket.loop();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado, reconectando...");
    WiFi.reconnect();
    delay(1000);
  }
}

bool isNetworkReady() {
  return (WiFi.status() == WL_CONNECTED) && wsConnected;
}

void sendBinaryData(const uint8_t* payload, size_t length) {
  if (isNetworkReady()) {
    webSocket.sendBIN(payload, length);
  }
}
