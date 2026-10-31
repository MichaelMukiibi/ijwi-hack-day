import hashlib
import os
import urllib.request
from pathlib import Path

from app.settings import MODEL_SHA256, MODEL_URL

path = Path(os.getenv("FASTDRS_MODEL_PATH", "models/mobilenet_v2.pth"))
path.parent.mkdir(parents=True, exist_ok=True)
if not path.exists():
    temporary = path.with_suffix(".download")
    with urllib.request.urlopen(MODEL_URL, timeout=60) as response, temporary.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
    if hashlib.sha256(temporary.read_bytes()).hexdigest() != MODEL_SHA256:
        temporary.unlink()
        raise RuntimeError("Downloaded checkpoint checksum mismatch")
    temporary.replace(path)
if hashlib.sha256(path.read_bytes()).hexdigest() != MODEL_SHA256:
    raise RuntimeError("Checkpoint checksum mismatch")
print(f"Verified {path.name} ({path.stat().st_size} bytes)")
