import time
import asyncio
import urllib.request
import subprocess
import os
from pathlib import Path


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import STALE_REMOVE_SECONDS, LASER_TIMEOUT, TELEGRAM_URL
from .state import devices, devices_registry_lock, active_websockets, get_last_person_time
from .routes import ws, stream, api

app = FastAPI(title="COP-DROID", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws.router)
app.include_router(stream.router)
app.include_router(api.router)


@app.on_event("startup")
async def start_background_tasks():
    async def cleanup_loop():
        while True:
            await asyncio.sleep(30)
            now = time.time()
            async with devices_registry_lock:
                stale = [
                    dev_id
                    for dev_id, st in devices.items()
                    if (now - st.last_seen) > STALE_REMOVE_SECONDS
                ]
                for dev_id in stale:
                    devices.pop(dev_id, None)
                    print(f"[x] Device purged by inactivity: {dev_id}")

    _player = None

    def play_alarm():
        nonlocal _player
        if _player is not None and _player.poll() is None:
            # Ya hay una alarma sonando
            return
            
        siren_path = Path(__file__).parent / "media" / "siren.mp3"
        try:
            _player = subprocess.Popen(
                ["mpg123", "-q", str(siren_path)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
        except Exception as e:
            print(f"Siren error: {e}")

    async def laser_manager_task():
        laser_is_on = False
        while True:
            await asyncio.sleep(0.5)
            now = time.time()
            last_time = get_last_person_time()
            should_be_on = (now - last_time) < LASER_TIMEOUT

            if last_time > 0:
                if should_be_on and not laser_is_on:
                    laser_is_on = True

                    play_alarm()

                    def send_telegram():
                        if not TELEGRAM_URL:
                            return
                        try:
                            urllib.request.urlopen(TELEGRAM_URL, timeout=5)
                        except Exception as e:
                            print(f"Telegram error: {e}")
                    asyncio.create_task(asyncio.to_thread(send_telegram))

                    connected = list(active_websockets.values())
                    has_other = len(connected) > 1
                    if has_other:
                        print(
                            f"[*] Person detected: turning laser ON for 5 seconds. "
                            f"Connected devices: {connected}"
                        )
                    else:
                        print(
                            f"[*] Person detected (but laser ESP32 does not seem connected). "
                            f"Only: {connected}"
                        )
                    for ws in list(active_websockets.keys()):
                        try:
                            await ws.send_text("LASER_ON")
                        except Exception:
                            pass
                elif not should_be_on and laser_is_on:
                    laser_is_on = False
                    connected = list(active_websockets.values())
                    has_other = len(connected) > 1
                    if has_other:
                        print(
                            f"[*] 5 seconds without detection: turning laser OFF "
                            f"on devices: {connected}"
                        )
                    for ws in list(active_websockets.keys()):
                        try:
                            await ws.send_text("LASER_OFF")
                        except Exception:
                            pass

    asyncio.create_task(cleanup_loop())
    asyncio.create_task(laser_manager_task())
