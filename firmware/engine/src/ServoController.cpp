#include <Arduino.h>
#include "ServoController.h"
#include "Config.h"

void ServoController::init() {
    ledcSetup(0, 50, 16);
    ledcAttachPin(SERVO_PIN, 0);
    center();
}

void ServoController::setAngle(int deg) {
    if (deg < 0) deg = 0;
    if (deg > 180) deg = 180;
    int duty = map(deg, 0, 180, 1638, 8192);
    ledcWrite(0, duty);
    currentAngle = deg;
}

int ServoController::getAngle() const {
    return currentAngle;
}

void ServoController::center() {
    setAngle(SERVO_CENTER_ANGLE);
}
