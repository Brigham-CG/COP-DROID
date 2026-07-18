import os
import time
import asyncio
from dataclasses import dataclass, field
from typing import Dict

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse, HTMLResponse, JSONResponse
from ultralytics import YOLO
import numpy as np
import cv2

load_dotenv()

app = FastAPI(title="COP-DROID", version="0.1.0")

# ── Modelo YOLO ────────────────────────────────────────────────────────────
model_name = os.getenv("YOLO_MODEL", "yolov8n.pt")
model = YOLO(model_name)

# ── Configuración ────────────────────────────────────────────────────────
STALE_OFFLINE_SECONDS = 5     # sin frames por N seg -> se marca "offline" en el dashboard
STALE_REMOVE_SECONDS  = 300   # sin frames por N seg -> se elimina del registro


# ── Estado por dispositivo ──────────────────────────────────────────────
@dataclass
class DeviceState:
    frame: bytes = b""
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    last_seen: float = 0.0
    detections: int = 0
    fps: float = 0.0
    _last_frame_time: float = 0.0

    @property
    def online(self) -> bool:
        return (time.time() - self.last_seen) < STALE_OFFLINE_SECONDS


devices: Dict[str, DeviceState] = {}
devices_registry_lock = asyncio.Lock()  # protege inserciones/borrados del dict

# --- Variables globales para el control del láser ---
active_websockets: Dict[WebSocket, str] = {}
last_person_time = 0.0


async def get_device(device_id: str) -> DeviceState:
    async with devices_registry_lock:
        if device_id not in devices:
            devices[device_id] = DeviceState()
        return devices[device_id]


# ── Inferencia YOLO (bloqueante, se ejecuta en threadpool) ────────────────
def run_inference(jpeg_bytes: bytes):
    np_arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        return None, 0, False

    results = model(frame, conf=0.5, verbose=False)
    annotated = results[0].plot()
    _, buffer = cv2.imencode(".jpg", annotated)
    
    person_detected = False
    for box in results[0].boxes:
        if int(box.cls[0]) == 0:  # clase 0 es 'person' en COCO
            person_detected = True
            break
            
    return buffer.tobytes(), len(results[0].boxes), person_detected

@app.get("/")
async def root():
    return {"message": "COP-DROID"}


@app.get("/health")
async def health():
    return {"status": "ok"}

# ── Endpoint WebSocket: cada ESP32-CAM se conecta a /ws/{device_id} ───────
@app.websocket("/ws/{device_id}")
async def ws_endpoint(websocket: WebSocket, device_id: str):
    await websocket.accept()
    print(f"[+] Dispositivo conectado: {device_id}")
    active_websockets[websocket] = device_id
    
    # Identificar si es cámara o láser (basado en el ID)
    is_camera = "laser" not in device_id.lower()
    
    if is_camera:
        state = await get_device(device_id)
        state.last_seen = time.time()  # Inicializar al conectar

    try:
        while True:
            # Usar receive() en lugar de receive_bytes()
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
                # La inferencia es CPU-bound: se corre en threadpool
                processed, detections, person_detected = await asyncio.to_thread(run_inference, data)

                if person_detected:
                    global last_person_time
                    last_person_time = time.time()

                if processed is not None and is_camera:
                    async with state.lock:
                        state.frame = processed
                        state.detections = detections

                # Ack liviano opcional (útil para debugging en el firmware)
                await websocket.send_text("ok")
            else:
                # Si recibimos texto (como el "keepalive"), no hacemos nada
                continue

    except WebSocketDisconnect:
        print(f"[-] Dispositivo desconectado: {device_id}")
    except Exception as e:
        print(f"[!] Error en dispositivo {device_id}: {e}")
    finally:
        active_websockets.pop(websocket, None)
    # Nota: NO se elimina el dispositivo del registro al desconectar.
    # Se mantiene su último frame visible (marcado "offline" en el dashboard)
    # hasta que la tarea de limpieza lo purgue por inactividad prolongada.


# ── Tareas en background ──────────────────────────────────────────────────────
@app.on_event("startup")
async def start_background_tasks():
    async def cleanup_loop():
        while True:
            await asyncio.sleep(30)
            now = time.time()
            async with devices_registry_lock:
                stale = [
                    dev_id for dev_id, st in devices.items()
                    if (now - st.last_seen) > STALE_REMOVE_SECONDS
                ]
                for dev_id in stale:
                    devices.pop(dev_id, None)
                    print(f"[x] Dispositivo purgado por inactividad: {dev_id}")

    async def laser_manager_task():
        global last_person_time
        laser_is_on = False
        while True:
            await asyncio.sleep(0.5)
            now = time.time()
            should_be_on = (now - last_person_time) < 5.0
            
            if last_person_time > 0:
                if should_be_on and not laser_is_on:
                    laser_is_on = True
                    # Identificamos si hay algún cliente conectado además de la cámara principal
                    connected_devices = list(active_websockets.values())
                    has_other_clients = len(connected_devices) > 1
                    
                    if has_other_clients:
                        print(f"[*] Persona detectada: Encendiendo láser por 5 segundos. Dispositivos conectados: {connected_devices}")
                    else:
                        print(f"[*] Persona detectada (pero ESP32 del láser no parece estar conectado). Solo hay: {connected_devices}")
                        
                    for ws in list(active_websockets.keys()):
                        try:
                            await ws.send_text("LASER_ON")
                        except Exception:
                            pass
                elif not should_be_on and laser_is_on:
                    laser_is_on = False
                    connected_devices = list(active_websockets.values())
                    has_other_clients = len(connected_devices) > 1
                    
                    if has_other_clients:
                        print(f"[*] 5 segundos sin detectar personas: Apagando láser en los dispositivos: {connected_devices}")
                        
                    for ws in list(active_websockets.keys()):
                        try:
                            await ws.send_text("LASER_OFF")
                        except Exception:
                            pass

    asyncio.create_task(cleanup_loop())
    asyncio.create_task(laser_manager_task())


# ── Streaming MJPEG por dispositivo ────────────────────────────────────────
async def generate_stream(device_id: str):
    state = await get_device(device_id)
    while True:
        async with state.lock:
            frame = state.frame

        if frame:
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")

        await asyncio.sleep(0.03)  # ~30 checks/seg, evita busy-loop


@app.get("/video/{device_id}")
async def video_feed(device_id: str):
    return StreamingResponse(
        generate_stream(device_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# ── Estado de todos los dispositivos (para el dashboard) ──────────────────
@app.get("/devices")
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
        
    laser_clients = [did for did in active_websockets.values() if "laser" in did.lower()]
    laser_is_on = (time.time() - last_person_time) < 5.0 and last_person_time > 0
    
    return JSONResponse({
        "cameras": cameras,
        "laser": {
            "connected": len(laser_clients) > 0,
            "clients": laser_clients,
            "is_on": laser_is_on
        }
    })


from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")

# ── Dashboard web: grilla dinámica de dispositivos ─────────────────────────
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)