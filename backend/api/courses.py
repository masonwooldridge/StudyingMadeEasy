from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.course import Course
from models.user import User
from schemas.course import CourseCreate, CourseResponse

router = APIRouter(
    prefix="/courses",
    tags=["courses"],
)


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = Course(
        name=course_data.name,
        description=course_data.description,
        user_id=current_user.id,
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course


@router.get(
    "",
    response_model=list[CourseResponse],
)
def get_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    courses = db.scalars(
        select(Course)
        .where(Course.user_id == current_user.id)
        .order_by(Course.created_at.desc())
    ).all()

    return list(courses)

@router.get(
    "/{course_id}",
    response_model=CourseResponse,
)
def get_course(
    course_id: int,
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

    return course