#ifndef DISTANCE_SENSOR_H
#define DISTANCE_SENSOR_H

#include <cstdint>

class DistanceSensor {
public:
    void init();
    float read();
    float readFiltered();
    bool lastReadingValid() const;
private:
    bool lastValid = false;
};

#endif
