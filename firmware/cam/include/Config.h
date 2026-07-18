#pragma once
#include <Arduino.h>

// ================= CONFIGURACIÓN =================
const char* const WIFI_SSID     = "Abaddon Team";
const char* const WIFI_PASS     = "okidokie789";

const char* const SERVER_HOST = "192.168.0.101";
const uint16_t SERVER_PORT = 8000;
const char* const DEVICE_ID = "esp32_cam_01";

const uint32_t FRAME_INTERVAL_MS = 50; // ~20 FPS teóricos
// =================================================

// ── Pines de la cámara (AI Thinker) ──
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
