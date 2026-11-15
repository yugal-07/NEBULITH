from fastapi import APIRouter
from .health import router as health_router
from .documents import router as documents_router
from .rag import router as rag_router
from .extraction import router as extraction_router
from .locations import router as locations_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(health_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(rag_router)
api_v1_router.include_router(extraction_router)
api_v1_router.include_router(locations_router)
