from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.course import Course
from models.document import Document
from models.document_chunk import DocumentChunk
from models.user import User
from schemas.search import SearchRequest, SearchResult
from services.embedding_service import generate_embedding

router = APIRouter(
    prefix="/courses/{course_id}/search",
    tags=["search"],
)


@router.post(
    "",
    response_model=list[SearchResult],
)
def search_course_materials(
    course_id: int,
    search_data: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.scalar(
        select(Course).where(
            Course.id == course_id,
            Course.user_id == current_user.id,
        )
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    query_embedding = generate_embedding(search_data.query)

    distance = DocumentChunk.embedding.cosine_distance(query_embedding)

    results = db.execute(
        select(
            DocumentChunk,
            Document.filename,
            distance.label("distance"),
        )
        .join(
            Document,
            DocumentChunk.document_id == Document.id,
        )
        .where(
            Document.course_id == course_id,
            DocumentChunk.embedding.is_not(None),
        )
        .order_by(distance)
        .limit(search_data.limit)
    ).all()

    return [
        SearchResult(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            filename=filename,
            page_number=chunk.page_number,
            content=chunk.content,
            similarity=max(0.0, 1.0 - float(distance_value)),
        )
        for chunk, filename, distance_value in results
    ]