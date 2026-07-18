import time
import asyncio
from dataclasses import dataclass, field

from . import config


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
        return (time.time() - self.last_seen) < config.STALE_OFFLINE_SECONDS
