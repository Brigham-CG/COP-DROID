#include <Arduino.h>
#include "Config.h"
#include "MotorController.h"
#include "ServoController.h"
#include "DistanceSensor.h"
#include "ObstacleAvoidance.h"
#include "WifiControl.h"
#include "WebSocketControl.h"

TaskHandle_t NetworkTask;
MotorController motors;
ServoController servo;
DistanceSensor sensor;
ObstacleAvoidance avoidance(motors, servo, sensor);

void networkTaskCode(void * parameter) {
  for (;;) {
    loopWifi();
    loopWebSocket();
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

void initLaser() {
  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  sensor.init();
  servo.init();
  motors.init();
  avoidance.init();
  initLaser();
  initWifi();
  initWebSocket();

  xTaskCreatePinnedToCore(
      networkTaskCode,
      "NetworkTask",
      10000,
      NULL,
      1,
      &NetworkTask,
      0);

  Serial.println("System ready");
}

void loop() {
  avoidance.update();
}
