#include <Arduino.h>
#include <WebSocketsClient.h>
#include "Config.h"
#include "WebSocketControl.h"

static WebSocketsClient webSocket;
static bool wsConnected = false;
static uint32_t lastLaserOnTime = 0;
static bool laserIsOn = false;

static void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Desconectado");
      break;
    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("[WS] Conectado al servidor");
      break;
    case WStype_TEXT: {
      String msg = (char*)payload;
      if (msg == "LASER_ON") {
        digitalWrite(LASER_PIN, HIGH);
        laserIsOn = true;
        lastLaserOnTime = millis();
        Serial.println("Laser ON via WS");
      } else if (msg == "LASER_OFF") {
        digitalWrite(LASER_PIN, LOW);
        laserIsOn = false;
        Serial.println("Laser OFF via WS (Apagado por inactividad)");
      }
      break;
    }
    default:
      break;
  }
}

void initWebSocket() {
  String wsPath = String("/ws/") + DEVICE_ID;
  webSocket.begin(SERVER_HOST, SERVER_PORT, wsPath);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(15000, 3000, 2);
}

void loopWebSocket() {
  webSocket.loop();
  
  static uint32_t lastKeepAlive = 0;
  if (wsConnected && (millis() - lastKeepAlive >= 3000)) {
    webSocket.sendTXT("keepalive");
    lastKeepAlive = millis();
  }
}
