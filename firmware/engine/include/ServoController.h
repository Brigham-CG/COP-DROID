#ifndef SERVO_CONTROLLER_H
#define SERVO_CONTROLLER_H

#include <cstdint>

class ServoController {
public:
    void init();
    void setAngle(int deg);
    int getAngle() const;
    void center();
private:
    int currentAngle = 90;
};

#endif
