#include <Arduino.h>
#include "ObstacleAvoidance.h"
#include "Config.h"

ObstacleAvoidance::ObstacleAvoidance(
    MotorController& m, ServoController& s, DistanceSensor& d)
    : motors(m)
    , servo(s)
    , sensor(d)
    , state(RobotState::FORWARD)
    , lastTurn(TurnDirection::RIGHT)
    , timerStart(0)
    , turnDuration(0)
    , leftDistance(0)
    , rightDistance(0) {}

void ObstacleAvoidance::init() {
    servo.center();
    motors.stop();
    delay(SERVO_SETTLE_MS);
    state = RobotState::FORWARD;
}

void ObstacleAvoidance::update() {
    switch (state) {
        case RobotState::FORWARD:    onForward();    break;
        case RobotState::BACKWARD:   onBackward();   break;
        case RobotState::SCAN_LEFT:  onScanLeft();   break;
        case RobotState::SCAN_RIGHT: onScanRight();  break;
        case RobotState::DECIDE:     onDecide();     break;
        case RobotState::TURN_LEFT:  onTurnLeft();   break;
        case RobotState::TURN_RIGHT: onTurnRight();  break;
    }
}

RobotState ObstacleAvoidance::getState() const {
    return state;
}

// ---------------------------------------------------------------
void ObstacleAvoidance::onForward() {
    servo.center();
    motors.forward();

    float dist = sensor.read();

    if (dist < 0 || dist <= SAFE_DISTANCE_CM) {
        motors.stop();
        timerStart = millis();
        state = RobotState::BACKWARD;
    }
}

// ---------------------------------------------------------------
void ObstacleAvoidance::onBackward() {
    motors.backward();

    if (millis() - timerStart >= BACKUP_MS) {
        motors.stop();
        servo.setAngle(SERVO_LEFT_ANGLE);
        timerStart = millis();
        state = RobotState::SCAN_LEFT;
    }
}

// ---------------------------------------------------------------
void ObstacleAvoidance::onScanLeft() {
    if (millis() - timerStart < SERVO_SETTLE_MS) {
        return;
    }

    leftDistance = sensor.readFiltered();
    if (leftDistance < 0) leftDistance = 0;

    servo.setAngle(SERVO_RIGHT_ANGLE);
    timerStart = millis();
    state = RobotState::SCAN_RIGHT;
}

// ---------------------------------------------------------------
void ObstacleAvoidance::onScanRight() {
    if (millis() - timerStart < SERVO_SETTLE_MS) {
        return;
    }

    rightDistance = sensor.readFiltered();
    if (rightDistance < 0) rightDistance = 0;

    servo.center();
    state = RobotState::DECIDE;
}

// ---------------------------------------------------------------
void ObstacleAvoidance::onDecide() {
    bool leftBlocked  = (leftDistance < SAFE_DISTANCE_CM);
    bool rightBlocked = (rightDistance < SAFE_DISTANCE_CM);

    TurnDirection dir;
    uint32_t duration;

    if (leftBlocked && rightBlocked) {
        dir = (lastTurn == TurnDirection::LEFT)
                  ? TurnDirection::RIGHT
                  : TurnDirection::LEFT;
        duration = TURN_180_MS;
    } else if (leftBlocked) {
        dir = TurnDirection::RIGHT;
        duration = TURN_90_MS;
    } else if (rightBlocked) {
        dir = TurnDirection::LEFT;
        duration = TURN_90_MS;
    } else {
        float margin = HYSTERESIS_CM;
        if (leftDistance > rightDistance + margin) {
            dir = TurnDirection::LEFT;
        } else if (rightDistance > leftDistance + margin) {
            dir = TurnDirection::RIGHT;
        } else {
            dir = (lastTurn == TurnDirection::LEFT)
                      ? TurnDirection::RIGHT
                      : TurnDirection::LEFT;
        }
        duration = TURN_90_MS;
    }

    lastTurn = dir;
    turnDuration = duration;
    timerStart = millis();
    state = (dir == TurnDirection::LEFT) ? RobotState::TURN_LEFT
                                         : RobotState::TURN_RIGHT;
}

// ---------------------------------------------------------------
void ObstacleAvoidance::onTurnLeft() {
    motors.turnLeft();

    if (millis() - timerStart >= turnDuration) {
        motors.stop();
        state = RobotState::FORWARD;
    }
}

// ---------------------------------------------------------------
void ObstacleAvoidance::onTurnRight() {
    motors.turnRight();

    if (millis() - timerStart >= turnDuration) {
        motors.stop();
        state = RobotState::FORWARD;
    }
}
