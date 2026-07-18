import os
from dotenv import load_dotenv

load_dotenv()

STALE_OFFLINE_SECONDS = 5
STALE_REMOVE_SECONDS = 300
LASER_TIMEOUT = 5.0
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
