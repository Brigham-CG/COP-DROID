#include <Arduino.h>
#include "DistanceSensor.h"
#include "Config.h"

void DistanceSensor::init() {
    pinMode(ECHO_PIN, INPUT);
    pinMode(TRIG_PIN, OUTPUT);
    digitalWrite(TRIG_PIN, LOW);
}

float DistanceSensor::read() {
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    unsigned long t = micros();
    while (digitalRead(ECHO_PIN) == LOW && micros() - t < 30000);
    t = micros();
    while (digitalRead(ECHO_PIN) == HIGH && micros() - t < 30000);
    unsigned long duration = micros() - t;

    if (duration == 0 || duration >= 30000) {
        lastValid = false;
        return -1.0f;
    }

    lastValid = true;
    return duration * 0.0343f / 2.0f;
}

float DistanceSensor::readFiltered() {
    float samples[SCAN_SAMPLES];

    for (int i = 0; i < SCAN_SAMPLES; i++) {
        samples[i] = read();
        if (samples[i] < 0) {
            delay(5);
            samples[i] = read();
        }
        if (i < SCAN_SAMPLES - 1) {
            delay(10);
        }
    }

    for (int i = 0; i < SCAN_SAMPLES - 1; i++) {
        for (int j = 0; j < SCAN_SAMPLES - 1 - i; j++) {
            if (samples[j] > samples[j + 1]) {
                float tmp = samples[j];
                samples[j] = samples[j + 1];
                samples[j + 1] = tmp;
            }
        }
    }

    float result = samples[SCAN_SAMPLES / 2];
    lastValid = (result >= 0);
    return result;
}

bool DistanceSensor::lastReadingValid() const {
    return lastValid;
}
