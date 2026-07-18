import time
import asyncio
import urllib.request
import subprocess
import os
import urllib.parse
from pathlib import Path


import io
import json
from PIL import Image
import google.generativeai as genai


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import STALE_REMOVE_SECONDS, LASER_TIMEOUT, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GOOGLE_API_KEY
from state import devices, devices_registry_lock, active_websockets, get_last_person_time, add_event, add_gemini_analysis
from routes import ws, stream, api

app = FastAPI(title="COP-DROID", version="0.1.0")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

GEMINI_PROMPT = """
Analiza la persona en la imagen para un sistema de seguridad. 
Devuelve un objeto JSON con los siguientes campos:
- etnia_aparente
- genero_y_edad_aproximada
- sombrero (indica si lleva y qué tipo)
- ropa_superior (color y tipo de prenda)
- accesorios_visibles (mochila, lentes, mascarilla, etc.)
- rasgos_distintivos (barba, tatuajes, cicatrices)

Sé objetivo y forense. Responde ÚNICAMENTE con el JSON.
"""

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
        if not siren_path.exists():
            print(f"Siren error: {siren_path} not found!")
            add_event("❌ Error: archivo siren.mp3 no encontrado")
            return

        try:
            _player = subprocess.Popen(
                ["mpg123", "-q", str(siren_path)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
            add_event("🚨 Sirena activada localmente")
        except Exception as e:
            print(f"Siren error: {e}")
            add_event(f"❌ Error activando sirena: {e}")

    background_tasks = set()

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

                    async def analyze_and_alert():
                        frame_to_analyze = None
                        for st in devices.values():
                            if st.frame:
                                frame_to_analyze = st.frame
                                break
                        
                        analisis_text = ""
                        if frame_to_analyze and GOOGLE_API_KEY:
                            try:
                                img = Image.open(io.BytesIO(frame_to_analyze))
                                response = await asyncio.to_thread(
                                    gemini_model.generate_content,
                                    [GEMINI_PROMPT, img],
                                    generation_config={"response_mime_type": "application/json"}
                                )
                                data = json.loads(response.text)
                                add_gemini_analysis(data)
                                formatted_json = json.dumps(data, indent=2, ensure_ascii=False)
                                analisis_text = f"\n\n📝 Análisis Forense:\n```json\n{formatted_json}\n```"
                                add_event(f"🧠 Análisis Gemini completado")
                            except Exception as e:
                                print(f"Gemini error: {e}")
                                add_event(f"❌ Error en Gemini: {e}")

                        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
                            return
                        try:
                            message = f"🚨 CENTRAL DE ALERTAS COP-DROID 🚨\nEstado: INTRUSO DETECTADO\nAcción: Protocolo de disuasión activado (Láser y Sirena).\nPor favor, revise las cámaras de inmediato.{analisis_text}"
                            encoded_message = urllib.parse.quote(message)
                            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage?chat_id={TELEGRAM_CHAT_ID}&text={encoded_message}&parse_mode=Markdown"
                            await asyncio.to_thread(urllib.request.urlopen, url, timeout=5)
                            add_event("📲 Alerta enviada a la central de Telegram")
                        except Exception as e:
                            print(f"Telegram error: {e}")
                            add_event(f"❌ Error enviando Telegram: {e}")
                            
                    task = asyncio.create_task(analyze_and_alert())
                    background_tasks.add(task)
                    task.add_done_callback(background_tasks.discard)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
