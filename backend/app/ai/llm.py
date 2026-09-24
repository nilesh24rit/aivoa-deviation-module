"""Groq LLM factory (LangChain wrappers)."""

from functools import lru_cache

from langchain_groq import ChatGroq

from ..config import settings


@lru_cache(maxsize=4)
def get_llm(temperature: float = 0.1) -> ChatGroq:
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env and restart the server."
        )
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=temperature,
    )


@lru_cache(maxsize=2)
def get_vision_llm() -> ChatGroq:
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env and restart the server."
        )
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_vision_model,
        temperature=0.0,
    )
