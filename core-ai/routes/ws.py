import time
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..state import devices, active_websockets, get_device, set_last_person_time
from ..detector import run_inference

router = APIRouter()


@router.websocket("/ws/{device_id}")
async def ws_endpoint(websocket: WebSocket, device_id: str):
    await websocket.accept()
    print(f"[+] Dispositivo conectado: {device_id}")
    active_websockets[websocket] = device_id

    is_camera = "laser" not in device_id.lower()

    if is_camera:
        state = await get_device(device_id)
        state.last_seen = time.time()

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                print(f"[-] Dispositivo se desconectó voluntariamente: {device_id}")
                break

            now = time.time()
            if is_camera:
                if state._last_frame_time and "bytes" in message:
                    delta = now - state._last_frame_time
                    if delta > 0:
                        state.fps = round(1 / delta, 1)

                if "bytes" in message:
                    state._last_frame_time = now
                state.last_seen = now

            if "bytes" in message:
                data = message["bytes"]
                processed, detections, person_detected = await asyncio.to_thread(
                    run_inference, data
                )

                if person_detected:
                    set_last_person_time(time.time())

                if processed is not None and is_camera:
                    async with state.lock:
                        state.frame = processed
                        state.detections = detections

                await websocket.send_text("ok")
            else:
                continue

    except WebSocketDisconnect:
        print(f"[-] Dispositivo desconectado: {device_id}")
    except Exception as e:
        print(f"[!] Error en dispositivo {device_id}: {e}")
    finally:
        active_websockets.pop(websocket, None)
