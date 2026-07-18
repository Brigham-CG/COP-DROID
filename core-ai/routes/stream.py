import asyncio

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..state import get_device

router = APIRouter()


async def generate_stream(device_id: str):
    state = await get_device(device_id)
    while True:
        async with state.lock:
            frame = state.frame

        if frame:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )

        await asyncio.sleep(0.03)


@router.get("/video/{device_id}")
async def video_feed(device_id: str):
    return StreamingResponse(
        generate_stream(device_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
