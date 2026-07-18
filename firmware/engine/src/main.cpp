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

void setMotorSpeed(int speedA, int speedB) {
  ledcWrite(1, speedA);
  ledcWrite(2, speedB);
}

void stopAll() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  setMotorSpeed(0, 0);
}

void initMotors() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  ledcSetup(1, 5000, 8);
  ledcAttachPin(ENA_PIN, 1);
  ledcSetup(2, 5000, 8);
  ledcAttachPin(ENB_PIN, 2);
  ledcWrite(1, 0);
  ledcWrite(2, 0);
  stopAll();
}

void moveForward() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  setMotorSpeed(DEFAULT_SPEED, DEFAULT_SPEED);
}

void moveBackward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  setMotorSpeed(DEFAULT_SPEED, DEFAULT_SPEED);
}

void turnLeft() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  setMotorSpeed(DEFAULT_SPEED, DEFAULT_SPEED);
}

void turnRight() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  setMotorSpeed(DEFAULT_SPEED, DEFAULT_SPEED);
}

void initLaser() {
  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, LOW);
}

// ── Navigation State Machine ──
enum State { EXPLORE, EVALUATE, BACKUP, TURN, RECOVER };
State state = EXPLORE;

int bestAngle = 90;
int stuckCount = 0;
int wiggleAngle = 90;
int wiggleDir = 1;
unsigned long lastWiggle = 0;

float readFiltered() {
  float sum = 0; int n = 0;
  for (int i = 0; i < 3; i++) {
    float d = readDistance();
    if (d >= 0 && d < 400) { sum += d; n++; }
    delay(3);
  }
  return n ? sum / n : -1;
}

int scanBestAngle() {
  int best = 90;
  float bestDist = 0;
  const int angles[] = {60, 70, 80, 90, 100, 110, 120};
  for (int i = 0; i < 7; i++) {
    int a = angles[i];
    setServoAngle(a);
    delay(120);
    float d0 = readDistance();
    delay(40);
    float d1 = readDistance();
    float d = (d0 > 0 && d1 > 0) ? (d0 + d1) / 2 : (d0 > 0 ? d0 : d1);
    if (d < 0) d = 100;
    if (d > bestDist) { bestDist = d; best = a; }
  }
  setServoAngle(90);
  if (bestDist < 12) {
    best = (random(2) == 0) ? 60 : 120;
  }
  return best;
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
  float dist = readFiltered();

  switch (state) {
    case EXPLORE:
      if (millis() - lastWiggle > 30) {
        wiggleAngle += wiggleDir;
        if (wiggleAngle >= 110 || wiggleAngle <= 70) wiggleDir *= -1;
        setServoAngle(wiggleAngle);
        lastWiggle = millis();
      }
      if (dist > 0 && dist < 20) {
        stopAll();
        state = (dist < 12) ? BACKUP : EVALUATE;
        Serial.print("Obstacle ");
        Serial.print(dist);
        Serial.println(" cm  → scanning");
      } else {
        moveForward();
      }
      break;

    case EVALUATE: {
      Serial.println("Scanning...");
      bestAngle = scanBestAngle();
      if (stuckCount > 2) {
        bestAngle += random(-30, 30);
        bestAngle = constrain(bestAngle, 60, 120);
      }
      state = BACKUP;
      break;
    }

    case BACKUP:
      Serial.print("Backing up  → aim ");
      Serial.println(bestAngle);
      moveBackward();
      delay(400);
      stopAll();
      setServoAngle(bestAngle);
      delay(250);
      dist = readFiltered();
      if (dist < 0 || dist > 20) state = TURN;
      else state = EVALUATE;
      break;

    case TURN: {
      int diff = bestAngle - 90;
      Serial.print("Turning  diff=");
      Serial.println(diff);
      if (abs(diff) < 10) {
        stuckCount = 0;
        state = EXPLORE;
        break;
      }
      if (diff > 0) turnRight();
      else turnLeft();
      delay(map(abs(diff), 0, 60, 80, 500));
      stopAll();
      setServoAngle(90);
      delay(200);
      stuckCount = 0;
      state = EXPLORE;
      break;
    }

    case RECOVER:
      Serial.println("Recovering...");
      stopAll();
      delay(200);
      moveBackward();
      delay(600);
      stopAll();
      if (random(2) == 0) turnLeft(); else turnRight();
      delay(700);
      stopAll();
      setServoAngle(90);
      delay(300);
      stuckCount = 0;
      state = EVALUATE;
      break;
  }

  delay(30);
}
