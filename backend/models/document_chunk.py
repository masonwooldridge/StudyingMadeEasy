from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        index=True,
    )

    content: Mapped[str] = mapped_column(Text)

    page_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    chunk_index: Mapped[int] = mapped_column(Integer)

    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(384),
        nullable=True,
    )

    document: Mapped["Document"] = relationship(
        back_populates="chunks",
    )