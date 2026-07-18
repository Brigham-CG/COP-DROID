#include <Arduino.h>
#include "Config.h"
#include "Camera.h"
#include "Network.h"

uint32_t lastFrameTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  if (!initCamera()) {
    Serial.println("Fallo crítico en la cámara. Deteniendo.");
    while (true) delay(100);
  }

  initNetwork();
}

void loop() {
  loopNetwork();

  if (!isNetworkReady()) {
    return;
  }

  uint32_t now = millis();
  if (now - lastFrameTime < FRAME_INTERVAL_MS) {
    return;
  }
  lastFrameTime = now;

  camera_fb_t* fb = captureFrame();
  if (!fb) {
    Serial.println("Error al capturar frame");
    return;
  }

  sendBinaryData(fb->buf, fb->len);
  releaseFrame(fb);
}