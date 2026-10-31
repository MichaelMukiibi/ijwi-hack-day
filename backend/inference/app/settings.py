import os
from dataclasses import dataclass
from pathlib import Path

MODEL_SHA256 = "8e522e9090449d12de94aaaab947e9e747be43952a520b6a1942e94870eb8cec"
MODEL_URL = (
    "https://github.com/MichaelMukiibi/fastdrs-models/releases/download/v0.1.1/mobilenet_v2.pth"
)
CLASS_NAMES = ("No DR", "Mild", "Moderate", "Severe", "Proliferative")


@dataclass(frozen=True)
class Settings:
    token: str
    model_path: Path
    max_bytes: int = 5 * 1024 * 1024
    max_pixels: int = 20_000_000
    use_ben_graham: bool = False

    @classmethod
    def from_env(cls):
        return cls(
            token=os.getenv("FASTDRS_API_TOKEN", ""),
            model_path=Path(os.getenv("FASTDRS_MODEL_PATH", "models/mobilenet_v2.pth")),
            use_ben_graham=os.getenv("FASTDRS_USE_BEN_GRAHAM", "false").lower() == "true",
        )
