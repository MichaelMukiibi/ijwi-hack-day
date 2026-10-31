import hashlib
from importlib.metadata import version

from .settings import MODEL_SHA256, Settings


class FastDRSEngine:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.predictor = None

    def load(self):
        if hashlib.sha256(self.settings.model_path.read_bytes()).hexdigest() != MODEL_SHA256:
            raise RuntimeError("Checkpoint checksum mismatch")
        import torch
        from fastdrs.inference import Predictor

        torch.set_num_threads(1)
        self.library_version = version("fastdrs")
        self.predictor = Predictor.from_checkpoint(
            checkpoint_path=self.settings.model_path,
            architecture="mobilenet_v2",
            num_classes=5,
            device="cpu",
            img_size=224,
            use_ben_graham=self.settings.use_ben_graham,
        )

    def predict(self, image):
        return self.predictor.predict(image)
