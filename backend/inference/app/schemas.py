from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field

Score = Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]
Digest = Annotated[str, Field(pattern="^[a-f0-9]{64}$")]


class ClassScore(BaseModel):
    class_id: Annotated[int, Field(ge=0, le=4)]
    class_name: Literal["No DR", "Mild", "Moderate", "Severe", "Proliferative"]
    score: Score


class ModelProvenance(BaseModel):
    name: Literal["mobilenet_v2"]
    version: Literal["v0.1.1"]
    sha256: Digest
    library_version: str
    image_size: Literal[224]
    use_ben_graham: bool


class ImageProvenance(BaseModel):
    width: Annotated[int, Field(gt=0)]
    height: Annotated[int, Field(gt=0)]
    sha256: Digest


class ScreeningResult(BaseModel):
    prediction_id: str
    class_id: Annotated[int, Field(ge=0, le=4)]
    class_name: Literal["No DR", "Mild", "Moderate", "Severe", "Proliferative"]
    score: Score
    scores: Annotated[list[ClassScore], Field(min_length=5, max_length=5)]
    model: ModelProvenance
    image: ImageProvenance
    latency_ms: Annotated[float, Field(ge=0, allow_inf_nan=False)]
    created_at: datetime
    scope: Literal["research-screening"]
    limitations: list[str]
