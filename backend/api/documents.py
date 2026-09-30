import shutil
import uuid
from pathlib import Path
from services.embedding_service import generate_embedding
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.course import Course
from models.document import Document
from models.user import User
from schemas.document import DocumentResponse

from models.document_chunk import DocumentChunk
from services.document_processor import extract_pdf_pages, chunk_text

router = APIRouter(
    prefix="/courses/{course_id}/documents",
    tags=["documents"],
)

UPLOAD_DIR = Path("uploads")


def get_user_course(
    course_id: int,
    current_user: User,
    db: Session,
) -> Course:
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

    return course


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    course_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_user_course(course_id, current_user, db)

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    original_filename = Path(file.filename or "document.pdf").name

    course_directory = UPLOAD_DIR / str(course_id)
    course_directory.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid.uuid4()}.pdf"
    file_path = course_directory / stored_filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file",
        )
    finally:
        file.file.close()

    document = Document(
        filename=original_filename,
        file_path=str(file_path),
        course_id=course_id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    pages = extract_pdf_pages(document.file_path)

    chunk_index = 0

    for page in pages:
        page_chunks = chunk_text(page["text"])

        for chunk in page_chunks:
            embedding = generate_embedding(chunk)
            
            document_chunk = DocumentChunk(
                document_id=document.id,
                content=chunk,
                page_number=page["page_number"],
                chunk_index=chunk_index,
                embedding=embedding,
            )

            db.add(document_chunk)

            chunk_index += 1

    db.commit()

    return document


@router.get(
    "",
    response_model=list[DocumentResponse],
)
def get_documents(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_user_course(course_id, current_user, db)

    documents = db.scalars(
        select(Document)
        .where(Document.course_id == course_id)
        .order_by(Document.created_at.desc())
    ).all()

    return list(documents)