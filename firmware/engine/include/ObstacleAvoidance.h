#ifndef OBSTACLE_AVOIDANCE_H
#define OBSTACLE_AVOIDANCE_H

#include <cstdint>
#include "MotorController.h"
#include "ServoController.h"
#include "DistanceSensor.h"

enum class RobotState : uint8_t {
    FORWARD,
    BACKWARD,
    SCAN_LEFT,
    SCAN_RIGHT,
    DECIDE,
    TURN_LEFT,
    TURN_RIGHT
};

enum class TurnDirection : uint8_t {
    LEFT,
    RIGHT
};

class ObstacleAvoidance {
public:
    ObstacleAvoidance(MotorController& motors, ServoController& servo, DistanceSensor& sensor);
    void init();
    void update();
    RobotState getState() const;

private:
    void onForward();
    void onBackward();
    void onScanLeft();
    void onScanRight();
    void onDecide();
    void onTurnLeft();
    void onTurnRight();

    MotorController& motors;
    ServoController& servo;
    DistanceSensor& sensor;

    RobotState state;
    TurnDirection lastTurn;
    uint32_t timerStart;
    uint32_t turnDuration;

    float leftDistance;
    float rightDistance;
};

#endif
