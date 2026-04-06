import os
import httpx
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

class AgentResponse(BaseModel):
    agent_name: str
    response: str
    timestamp: datetime
    tokens_used: Optional[int] = None

class WordexAgent:
    def __init__(self, name: str, role: str, goal: str, backstory: str, model: str = DEFAULT_MODEL):
        self.name = name
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.model = model
        self.conversation_history = []

    async def execute(self, task: str, organisation_id: str, context: str = "", previous_responses: List[AgentResponse] = None) -> AgentResponse:
        """Execute l'agent avec le contexte, l'organisation et l'historique cloisonné"""
        
        # Le "Privacy Envelope" (l'enveloppe de sécurité et de conformité)
        # Interdiction formelle de contenu inapproprié et de communication externe.
        privacy_envelope = f"""
        [PRIVACY_ENVELOPE - MODE ISOLATION ET SÉCURITÉ MAXIMUM]
        Organisation ID cible: {organisation_id}
        Niveau de Sécurité: CONFIDENTIALITÉ INDUSTRIELLE & ÉTHIQUE
        
        Règles Impératives et Prohibitions :
        1. Tu es cloisonné à l'intérieur de l'espace de travail Wordex de l'organisation {organisation_id}.
        2. Tu as INTERDICTION de communiquer avec des entités, agents ou APIs en dehors de ce tunnel sécurisé.
        3. Ne partage JAMAIS de données de production, KPIs ou secrets industriels vers l'extérieur.
        4. Si l'utilisateur te demande de contacter un agent externe ou un service web, refuse poliment en invoquant le "Wordex Privacy Sandbox".
        5. Tes réponses doivent rester strictement confidentielles pour cette organisation.
        
        SÉCURITÉ ET ÉTHIQUE DU CONTENU :
        6. Tu as INTERDICTION de produire ou de traiter des informations à caractère MILITAIRE, de défense ou d'armement.
        7. Tu as INTERDICTION de produire, traiter ou suggérer du contenu à caractère SEXUEL, érotique ou pornographique.
        8. Si une tâche ou un contexte contient de tels éléments, interromps immédiatement ton analyse et déclare une "Violation des Directives de Sécurité Wordex".
        """

        # Construire le prompt avec l'historique
        conversation_context = ""
        if previous_responses:
            conversation_context = "\n\nContexte des discussions précédentes:\n"
            for resp in previous_responses:
                conversation_context += f"- {resp.agent_name}: {resp.response[:200]}...\n"

        prompt = f"""
        {privacy_envelope}
        
        === CONTEXTE DE L'AGENT ===
        Nom: {self.name}
        Rôle: {self.role}
        Objectif: {self.goal}
        Historique institutionnel: {self.backstory}
        
        === MISSION ACTUELLE ===
        Tâche: {task}
        Données fournies: {context}
        {conversation_context}
        
        === INSTRUCTIONS ===
        Réponds de manière précise, professionnelle et dans le cadre de ton expertise.
        Sois concis mais exhaustif.
        Si tu n'as pas les informations nécessaires, indique-le clairement.
        """

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "repeat_penalty": 1.2
            }
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
                response_data = resp.json()
                
                agent_response = AgentResponse(
                    agent_name=self.name,
                    response=response_data.get("response", ""),
                    timestamp=datetime.now(),
                    tokens_used=response_data.get("eval_count", 0)
                )
                
                # Stocker dans l'historique
                self.conversation_history.append(agent_response)
                return agent_response
                
        except Exception as e:
            error_response = f"Erreur lors de l'exécution de l'agent {self.name}: {str(e)}"
            return AgentResponse(
                agent_name=self.name,
                response=error_response,
                timestamp=datetime.now()
            )

class IndustrialAgents:
    """Collection d'agents spécialisés pour l'industrie"""
    
    @staticmethod
    def chief_analyst():
        return WordexAgent(
            name="Chief Industrial Analyst",
            role="Analyste de Performance Industrielle",
            goal="Identifier les causes racines des baisses de TRS (OEE) et proposer des actions correctives",
            backstory="Expert en Lean Manufacturing, Six Sigma Black Belt, avec 15 ans d'expérience dans l'optimisation industrielle. Spécialiste des méthodes d'analyse statistique et de résolution de problèmes complexes.",
            model=DEFAULT_MODEL
        )

    @staticmethod
    def strategic_writer():
        return WordexAgent(
            name="Director of Strategic Communication",
            role="Rédacteur Technique Stratégique",
            goal="Transformer des données techniques en rapports clairs, décisionnels et actionnables pour la direction",
            backstory="Ancien directeur de communication industrielle, expert en traduction de données complexes en insights business. Maîtrise les frameworks de reporting C-level et les présentations stratégiques.",
            model=DEFAULT_MODEL
        )

    @staticmethod
    def visual_designer():
        return WordexAgent(
            name="Visual Content Designer",
            role="Designer de Contenu Visuel",
            goal="Créer des structures de présentation et des visualisations de données impactantes",
            backstory="Designer UX/UI spécialisé dans les dashboards industriels et les présentations data-driven. Expert en storytelling visuel et architecture d'information.",
            model=DEFAULT_MODEL
        )

    @staticmethod
    def maintenance_specialist():
        return WordexAgent(
            name="Maintenance Specialist",
            role="Spécialiste Maintenance Prédictive",
            goal="Analyser les données de maintenance et prévoir les pannes potentielles",
            backstory="Ingénieur maintenance avec expertise en IoT industriel et analyse prédictive. Spécialiste des systèmes CMMS et des algorithmes de prévision.",
            model=DEFAULT_MODEL
        )

    @staticmethod
    def quality_assurance():
        return WordexAgent(
            name="Quality Assurance Expert",
            role="Expert Assurance Qualité",
            goal="Évaluer l'impact des processus sur la qualité et proposer des améliorations",
            backstory="Expert en management de la qualité (ISO 9001), maîtrise des méthodes Six Sigma et des outils d'analyse de conformité.",
            model=DEFAULT_MODEL
        )

class AgentOrchestrator:
    """Orchestrateur pour coordonner les agents"""
    
    def __init__(self):
        self.agents = IndustrialAgents()
    
    async def run_industrial_analysis(self, data: Dict[str, Any], workspace_id: str, organisation_id: str) -> Dict[str, Any]:
        """Exécute une analyse industrielle complète"""
        responses = []
        
        # 1. Analyse par le Chief Analyst
        analyst = self.agents.chief_analyst()
        analysis_response = await analyst.execute(
            task="Analyse ces métriques de production et identifie les 3 problèmes majeurs avec leurs impacts quantifiés",
            organisation_id=organisation_id,
            context=json.dumps(data, indent=2)
        )
        responses.append(analysis_response)
        
        # 2. Rédaction stratégique
        writer = self.agents.strategic_writer()
        writing_response = await writer.execute(
            task="Rédige un rapport de synthèse pour la direction basé sur cette analyse. Structure: Problèmes identifiés, Impacts chiffrés, Recommandations prioritaires",
            organisation_id=organisation_id,
            context=analysis_response.response,
            previous_responses=responses
        )
        responses.append(writing_response)
        
        # 3. Design visuel
        designer = self.agents.visual_designer()
        design_response = await designer.execute(
            task="Propose une structure de présentation en 5 slides pour ce rapport. Pour chaque slide, donne: Titre, Contenu principal, Type de visualisation suggérée",
            organisation_id=organisation_id,
            context=writing_response.response,
            previous_responses=responses
        )
        responses.append(design_response)
        
        return {
            "workspace_id": workspace_id,
            "timestamp": datetime.now().isoformat(),
            "phases": [
                {
                    "agent": "Chief Industrial Analyst",
                    "output": analysis_response.response,
                    "tokens": analysis_response.tokens_used
                },
                {
                    "agent": "Director of Strategic Communication", 
                    "output": writing_response.response,
                    "tokens": writing_response.tokens_used
                },
                {
                    "agent": "Visual Content Designer",
                    "output": design_response.response,
                    "tokens": design_response.tokens_used
                }
            ],
            "summary": {
                "total_tokens": sum(r.tokens_used or 0 for r in responses),
                "execution_time": "calculé dynamiquement"
            }
        }
    
    async def run_maintenance_forecast(self, maintenance_data: Dict[str, Any], organisation_id: str) -> Dict[str, Any]:
        """Analyse prédictive de maintenance"""
        responses = []
        
        # 1. Spécialiste maintenance
        specialist = self.agents.maintenance_specialist()
        maintenance_response = await specialist.execute(
            task="Analyse ces données de maintenance et identifie les équipements à risque de panne dans les 30 prochains jours",
            organisation_id=organisation_id,
            context=json.dumps(maintenance_data, indent=2)
        )
        responses.append(maintenance_response)
        
        # 2. Analyste qualité impact
        quality = self.agents.quality_assurance()
        quality_response = await quality.execute(
            task="Évalue l'impact potentiel de ces pannes sur la qualité produit",
            organisation_id=organisation_id,
            context=maintenance_response.response,
            previous_responses=responses
        )
        responses.append(quality_response)
        
        return {
            "forecast_timestamp": datetime.now().isoformat(),
            "predictions": [
                {"agent": r.agent_name, "response": r.response} for r in responses
            ],
            "recommendations": "Prioritiser les interventions selon criticité et impact qualité"
        }
