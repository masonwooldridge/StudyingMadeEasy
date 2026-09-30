from pydantic import BaseModel


class TutorMessage(BaseModel):
    role: str
    content: str


class TutorRequest(BaseModel):
    question: str
    history: list[TutorMessage] = []
    limit: int = 8


class TutorSource(BaseModel):
    document_id: int
    filename: str
    page_number: int | None
    content: str
    similarity: float


class TutorResponse(BaseModel):
    answer: str
    sources: list[TutorSource]