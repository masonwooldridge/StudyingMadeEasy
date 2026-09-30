from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.course import Course
from models.document import Document
from models.document_chunk import DocumentChunk
from models.user import User
from schemas.tutor import TutorRequest, TutorResponse, TutorSource
from services.embedding_service import generate_embedding
from services.llm_service import generate_tutor_answer

router = APIRouter(
    prefix="/courses/{course_id}/tutor",
    tags=["tutor"],
)

MIN_SIMILARITY = 0.35
MAX_CONTEXT_CHUNKS = 5


@router.post(
    "",
    response_model=TutorResponse,
)
def ask_tutor(
    course_id: int,
    data: TutorRequest,
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

    query_embedding = generate_embedding(data.question)

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
        .limit(data.limit)
    ).all()

    relevant_results = []

    for chunk, filename, distance_value in results:
        similarity = 1.0 - float(distance_value)

        if similarity >= MIN_SIMILARITY:
            relevant_results.append(
                (chunk, filename, similarity)
            )

    relevant_results = relevant_results[:MAX_CONTEXT_CHUNKS]

    if not relevant_results:
        return TutorResponse(
            answer=(
                "I couldn't find enough relevant information in your "
                "uploaded course materials to answer that question."
            ),
            sources=[],
        )

    context_parts = []
    sources = []

    for chunk, filename, similarity in relevant_results:
        page_label = (
            f"Page {chunk.page_number}"
            if chunk.page_number is not None
            else "Unknown page"
        )

        context_parts.append(
            f"[Source: {filename}, {page_label}]\n"
            f"{chunk.content}"
        )

        sources.append(
            TutorSource(
                document_id=chunk.document_id,
                filename=filename,
                page_number=chunk.page_number,
                content=chunk.content,
                similarity=similarity,
            )
        )

    context = "\n\n---\n\n".join(context_parts)

    history = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in data.history
    ]

    answer = generate_tutor_answer(
        question=data.question,
        context=context,
        history=history,
    )

    return TutorResponse(
        answer=answer,
        sources=sources,
    )