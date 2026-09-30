from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    limit: int = 5


class SearchResult(BaseModel):
    chunk_id: int
    document_id: int
    filename: str
    page_number: int | None
    content: str
    similarity: float