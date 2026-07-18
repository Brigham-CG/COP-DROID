#ifndef CONFIG_H
#define CONFIG_H

#define WIFI_SSID "Abaddon Team"
#define WIFI_PASS "okidokie789"
#define SERVER_HOST "192.168.0.101"
#define SERVER_PORT 8000
#define DEVICE_ID "robot_ultrasonic"

#define TRIG_PIN 5
#define ECHO_PIN 18
#define SERVO_PIN 13
#define LASER_PIN 14

#define IN1 25
#define IN2 26
#define IN3 32
#define IN4 27

// --- Umbrales de navegación ---
#define SAFE_DISTANCE_CM   30.0f
#define BACKUP_MS          350
#define TURN_90_MS         650
#define TURN_180_MS        1300

// --- Servo ---
#define SERVO_CENTER_ANGLE  90
#define SERVO_LEFT_ANGLE    30
#define SERVO_RIGHT_ANGLE   150
#define SERVO_SETTLE_MS     250

// --- Sensor ---
#define SCAN_SAMPLES        3
#define HYSTERESIS_CM       10.0f

#endif
