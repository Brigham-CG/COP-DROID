#pragma once
#include "esp_camera.h"

bool initCamera();
camera_fb_t* captureFrame();
void releaseFrame(camera_fb_t* fb);
