from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CourseCreate(BaseModel):
    name: str
    description: str | None = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    user_id: int
    created_at: datetime