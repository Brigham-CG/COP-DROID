#include <Arduino.h>
#include "Config.h"
#include "WifiControl.h"
#include "WebSocketControl.h"

TaskHandle_t NetworkTask;

void networkTaskCode(void * parameter) {
  for (;;) {
    loopWifi();
    loopWebSocket();
    vTaskDelay(10 / portTICK_PERIOD_MS); // Pequeña pausa para el Watchdog
  }
}

void initSensor() {
  pinMode(ECHO_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);
}

float readDistance() {
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long t = micros();
  while (digitalRead(ECHO_PIN) == LOW && micros() - t < 30000);
  t = micros();
  while (digitalRead(ECHO_PIN) == HIGH && micros() - t < 30000);
  unsigned long duration = micros() - t;

  if (duration == 0) return -1;
  return duration * 0.0343 / 2;
}

void initServo() {
  ledcSetup(0, 50, 16);
  ledcAttachPin(SERVO_PIN, 0);
  ledcWrite(0, map(0, 0, 180, 1638, 8192));
}

void setServoAngle(int angle) {
  int duty = map(angle, 0, 180, 1638, 8192);
  ledcWrite(0, duty);
}

void sweepServo(int fromAngle, int toAngle, int speedDelay) {
  int step = (fromAngle < toAngle) ? 1 : -1;
  for (int angle = fromAngle; angle != toAngle + step; angle += step) {
    setServoAngle(angle);
    delay(speedDelay);
  }
}

void stopAll() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

void initMotors() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  stopAll();
}

void moveForward() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void moveBackward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

void turnLeft() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

void turnRight() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void initLaser() {
  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, LOW);
}



void setup() {
  Serial.begin(115200);
  delay(1000);
  initSensor();
  initServo();
  initMotors();
  initLaser();
  initWifi();
  initWebSocket();

  // Crear la tarea de red anclada al Core 0 (el Core 1 lo usa el loop principal)
  xTaskCreatePinnedToCore(
      networkTaskCode, /* Función de la tarea */
      "NetworkTask",   /* Nombre de la tarea */
      10000,           /* Tamaño de la pila (Stack size) */
      NULL,            /* Parámetros para la función */
      1,               /* Prioridad de la tarea */
      &NetworkTask,    /* Puntero a la tarea (Task handle) */
      0);              /* Núcleo (Core 0) */

  Serial.println("System ready");
}

void loop() {
  float dist = readDistance();

  if (dist < 0) {
    Serial.println("No echo detected - stopping");
    stopAll();
  } else {
    Serial.print("Distance: ");
    Serial.print(dist);
    Serial.println(" cm");

    if (dist > 20) {
      Serial.println("Moving forward");
      moveForward();
    } else {
        Serial.println("Obstacle! Stopping, scanning, turning...");
      stopAll();
      sweepServo(90, 180, 15);
      sweepServo(180, 90, 15);
      delay(500);
      turnRight();
      delay(800);
      stopAll();
      sweepServo(90, 0, 15);
      sweepServo(0, 90, 15);
    }
  }

  delay(50);
}
