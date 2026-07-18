import asyncio
from typing import Dict

from fastapi import WebSocket

from models import DeviceState

devices: Dict[str, DeviceState] = {}
devices_registry_lock = asyncio.Lock()
active_websockets: Dict[WebSocket, str] = {}
_last_person_time = 0.0

system_events = []

def add_event(message: str) -> None:
    import time
    event_id = str(time.time())
    system_events.append({
        "id": event_id,
        "timestamp": int(time.time() * 1000),
        "message": message
    })
    if len(system_events) > 50:
        system_events.pop(0)


def get_last_person_time() -> float:
    return _last_person_time


def set_last_person_time(t: float) -> None:
    global _last_person_time
    _last_person_time = t


async def get_device(device_id: str) -> DeviceState:
    async with devices_registry_lock:
        if device_id not in devices:
            devices[device_id] = DeviceState()
        return devices[device_id]
