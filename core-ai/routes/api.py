import os
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from config import LASER_TIMEOUT
from state import devices, devices_registry_lock, active_websockets, get_last_person_time, system_events

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/devices")
async def list_devices():
    async with devices_registry_lock:
        cameras = {
            dev_id: {
                "online": st.online,
                "fps": st.fps,
                "detections": st.detections,
                "last_seen_seconds_ago": round(time.time() - st.last_seen, 1),
            }
            for dev_id, st in devices.items()
        }

    laser_clients = [
        did for did in active_websockets.values() if "laser" in did.lower()
    ]
    last_time = get_last_person_time()
    laser_is_on = (time.time() - last_time) < LASER_TIMEOUT and last_time > 0

    return JSONResponse({
        "cameras": cameras,
        "laser": {
            "connected": len(laser_clients) > 0,
            "clients": laser_clients,
            "is_on": laser_is_on,
        },
        "events": system_events,
    })


@router.get("/")
async def index():
    return JSONResponse({
        "name": "COP-DROID API",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "devices": "/devices",
            "video_stream": "/video/{device_id}",
            "websocket": "/ws/{device_id}",
        },
    })
