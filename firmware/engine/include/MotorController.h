#ifndef MOTOR_CONTROLLER_H
#define MOTOR_CONTROLLER_H

class MotorController {
public:
    void init();
    void forward();
    void backward();
    void turnLeft();
    void turnRight();
    void stop();
};

#endif
