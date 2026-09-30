import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not set")

client = OpenAI(api_key=OPENAI_API_KEY)


def generate_tutor_answer(
    question: str,
    context: str,
    history: list[dict],
) -> str:
    conversation = []

    for message in history[-10:]:
        conversation.append(
            {
                "role": message["role"],
                "content": message["content"],
            }
        )

    conversation.append(
        {
            "role": "user",
            "content": (
                f"COURSE MATERIAL:\n\n{context}\n\n"
                f"CURRENT QUESTION:\n{question}"
            ),
        }
    )

    response = client.responses.create(
        model="gpt-5-mini",
        instructions=(
            "You are an AI tutor helping a student understand their course. "
            "Use the provided course material as the factual source for your answer. "
            "Use the conversation history to understand follow-up questions. "
            "If the uploaded material does not contain enough information to answer "
            "the question, clearly say that. Do not invent information from the course. "
            "Explain ideas clearly and teach rather than simply giving short answers."
        ),
        input=conversation,
    )

    return response.output_text