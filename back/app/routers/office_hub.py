from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.auth import get_current_user_id
from app.services.office_ai_service import AIAgent

router = APIRouter()
ai_agent = AIAgent()

@router.post("/diagnose-financials/{project_id}/{doc_id}")
async def generate_financial_diagnostic(
    project_id: str,
    doc_id: str,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Exécute le diagnostic financier ISO/SOC2 et génère le fichier PPT.
    Cette route utilise le moteur Headless LibreOffice.
    """
    try:
        # Appelle l'AIAgent de AI Office Hub (maintenance du contexte ISO 27001)
        # Note: on utilise user_id comme metadata pour l'audit le cas échéant.
        result = ai_agent.generate_financial_diagnostic(project_id, doc_id)
        
        if result.get("status") == "Error":
            raise HTTPException(status_code=500, detail=result.get("message"))
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostic error: {str(e)}")
