#pragma once
#include <Arduino.h>

void initNetwork();
void loopNetwork();
bool isNetworkReady();
void sendBinaryData(const uint8_t* payload, size_t length);
