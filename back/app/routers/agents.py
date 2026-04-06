from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import json
from ..agents import AgentOrchestrator, WordexAgent, IndustrialAgents
from ..auth import get_current_org_id

router = APIRouter(prefix="/api/agents", tags=["agents"], dependencies=[Depends(get_current_org_id)])

class AgentTaskRequest(BaseModel):
    task: str
    context: str = ""
    agent_type: str = "analyst"  # analyst, writer, designer, maintenance, quality
    model: Optional[str] = None

class MultiAgentRequest(BaseModel):
    workspace_id: str
    data: Dict[str, Any]
    analysis_type: str = "industrial"  # industrial, maintenance, quality

class SingleAgentRequest(BaseModel):
    agent_name: str
    task: str
    context: str = ""

# Instance globale de l'orchestrateur
orchestrator = AgentOrchestrator()

@router.post("/execute/single")
async def execute_single_agent(request: SingleAgentRequest, org_id: str = Depends(get_current_org_id)):
    """Exécute un agent spécifique dans l'enveloppe de confidentialité de l'organisation"""
    try:
        # Mapping des agents
        agent_mapping = {
            "analyst": IndustrialAgents.chief_analyst(),
            "writer": IndustrialAgents.strategic_writer(),
            "designer": IndustrialAgents.visual_designer(),
            "maintenance": IndustrialAgents.maintenance_specialist(),
            "quality": IndustrialAgents.quality_assurance()
        }
        
        if request.agent_name not in agent_mapping:
            raise HTTPException(status_code=400, detail=f"Agent {request.agent_name} non trouvé")
        
        agent = agent_mapping[request.agent_name]
        response = await agent.execute(request.task, org_id, request.context)
        
        return {
            "success": True,
            "agent": request.agent_name,
            "organisation_id": org_id,
            "response": response.response,
            "timestamp": response.timestamp.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'exécution: {str(e)}")

@router.post("/orchestrate/industrial-insight")
async def orchestrate_industrial_analysis(request: MultiAgentRequest, org_id: str = Depends(get_current_org_id)):
    """Orchestre une analyse industrielle complète et cloisonnée"""
    try:
        result = await orchestrator.run_industrial_analysis(
            request.data, 
            request.workspace_id,
            org_id
        )
        
        return {
            "success": True,
            "organisation_id": org_id,
            "analysis_type": "industrial_insight",
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'orchestration: {str(e)}")

@router.post("/orchestrate/maintenance-forecast")
async def orchestrate_maintenance_forecast(request: MultiAgentRequest, org_id: str = Depends(get_current_org_id)):
    """Orchestre une analyse prédictive de maintenance cloisonnée"""
    try:
        result = await orchestrator.run_maintenance_forecast(request.data, org_id)
        
        return {
            "success": True,
            "organisation_id": org_id,
            "analysis_type": "maintenance_forecast",
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'orchestration: {str(e)}")

@router.get("/list-agents")
async def list_available_agents():
    """Liste les agents disponibles dans le catalogue Wordex"""
    return {
        "agents": [
            {
                "id": "analyst",
                "name": "Chief Industrial Analyst",
                "role": "Analyste de Performance Industrielle",
                "specialty": "Analyse TRS/OEE, identification de problèmes"
            },
            {
                "id": "writer",
                "name": "Director of Strategic Communication",
                "role": "Rédacteur Technique Stratégique", 
                "specialty": "Transformation données → rapports décisionnels"
            },
            {
                "id": "designer",
                "name": "Visual Content Designer",
                "role": "Designer de Contenu Visuel",
                "specialty": "Création de présentations et visualisations"
            },
            {
                "id": "maintenance",
                "name": "Maintenance Specialist",
                "role": "Spécialiste Maintenance Prédictive",
                "specialty": "Analyse prédictive et prévention"
            },
            {
                "id": "quality",
                "name": "Quality Assurance Expert",
                "role": "Expert Assurance Qualité",
                "specialty": "Impact qualité et conformité"
            }
        ]
    }

@router.post("/chat")
async def chat_with_agent(payload: Dict[str, Any], org_id: str = Depends(get_current_org_id)):
    """Chat interactif sécurisé avec un agent (Isolation par organisation)"""
    agent_name = payload.get("agent_name")
    message = payload.get("message")
    context = payload.get("context", "")
    
    try:
        agent_mapping = {
            "analyst": IndustrialAgents.chief_analyst(),
            "writer": IndustrialAgents.strategic_writer(),
            "designer": IndustrialAgents.visual_designer(),
            "maintenance": IndustrialAgents.maintenance_specialist(),
            "quality": IndustrialAgents.quality_assurance()
        }
        
        if agent_name not in agent_mapping:
            raise HTTPException(status_code=400, detail=f"Agent {agent_name} non trouvé")
        
        agent = agent_mapping[agent_name]
        response = await agent.execute(message, org_id, context)
        
        return {
            "agent": agent_name,
            "organisation_id": org_id,
            "response": response.response,
            "timestamp": response.timestamp.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de chat: {str(e)}")
