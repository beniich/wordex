from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from app.services.audio_ai import AudioAIService
from app.auth import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/audio", tags=["Audio Intelligence"])

@router.post("/process", status_code=status.HTTP_200_OK)
async def process_audio_command(
    audio_file: UploadFile = File(...),
    action: str = Form("summarize"),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Process an audio recording: Transcribe with Whisper (local) and Analyze with Ollama (local).
    Requires authenticated user and secure access to the atelier.
    """
    if not audio_file.filename or not audio_file.filename.endswith(('.wav', '.mp3', '.m4a')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audio format. Use .wav, .mp3, or .m4a."
        )

    service = AudioAIService()
    try:
        result = await service.pipeline(audio_file, action)
        return {
            "success": True,
            "data": result,
            "user": current_user.get("username")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio AI Pipeline Failure: {str(e)}"
        )
