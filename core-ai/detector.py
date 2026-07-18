import cv2
import numpy as np
from ultralytics import YOLO

from config import YOLO_MODEL

model = YOLO(YOLO_MODEL)


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
        if int(box.cls[0]) == 0:
            person_detected = True
            break

    return buffer.tobytes(), len(results[0].boxes), person_detected
