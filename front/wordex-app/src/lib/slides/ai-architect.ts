import { ai } from '../api';

export interface SlideContent {
  title: string;
  content: string;
  speakerNotes?: string;
  visualElements?: {
    type: 'image' | 'chart' | 'bulletPoints';
    data: any;
  };
}

export interface PresentationStructure {
  title: string;
  subtitle?: string;
  slides: SlideContent[];
  theme: 'professional' | 'creative' | 'minimal' | 'corporate';
  estimatedDuration: number; // minutes
}

class DocumentAnalyzer {
  constructor(private workspaceId: string) {}

  async getRelevantDocuments(topic: string) {
    // In a real implementation we would call the search endpoint
    // documents.search(this.workspaceId, topic)
    return [];
  }
}

export class AIPresentationArchitect {
  private documentAnalyzer: DocumentAnalyzer;

  constructor(workspaceId: string) {
    this.documentAnalyzer = new DocumentAnalyzer(workspaceId);
  }

  async generatePresentationStructure(
    topic: string, 
    audience: string = 'general',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<PresentationStructure> {
    const workspaceDocs = await this.documentAnalyzer.getRelevantDocuments(topic);
    const insights = await this.extractKeyInsights(workspaceDocs, topic);
    
    const structure = await this.createStructureWithAI({
      topic,
      audience,
      length,
      insights,
      workspaceContext: workspaceDocs
    });

    return structure;
  }

  private async extractDocumentContent(docId: string) {
      return "";
  }
  
  private async analyzeContentForKeyPoints(content: string, topic: string) {
      return {};
  }

  private async extractKeyInsights(documents: any[], topic: string): Promise<any[]> {
    const insightsPromises = documents.map(async (doc) => {
      const content = await this.extractDocumentContent(doc.id);
      return await this.analyzeContentForKeyPoints(content, topic);
    });

    return Promise.all(insightsPromises);
  }

  private async callAI(prompt: string) {
      const res = await ai.chat([{ role: "user", content: prompt }], "designer");
      return { content: res.response || "{}" };
  }

  private async createStructureWithAI(context: any): Promise<PresentationStructure> {
    const prompt = `
      Créer une présentation sur "${context.topic}" pour un public ${context.audience}.
      Longueur: ${context.length}
      
      Contexte des documents existants:
      ${JSON.stringify(context.workspaceContext.slice(0, 3), null, 2)}
      
      Insights clés identifiés:
      ${JSON.stringify(context.insights, null, 2)}
      
      Réponds avec une structure JSON contenant:
      - title: titre principal
      - subtitle: sous-titre (optionnel)
      - slides: tableau avec title d'une ligne, content, et speakerNotes
      - theme: theme approprié parmi (professional, creative, minimal, corporate)
      - estimatedDuration: durée estimée en minutes
    `;

    try {
        const response = await this.callAI(prompt);
        let pureJson = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(pureJson);
    } catch(err) {
        console.error("AI Structure Generation Failed:", err);
        return {
            title: context.topic,
            slides: [],
            theme: "professional",
            estimatedDuration: 5
        };
    }
  }

  async generateSlideContent(slideOutline: any, context: any): Promise<SlideContent> {
    const prompt = `
      Développer le contenu pour cette slide:
      Titre: ${slideOutline.title}
      
      Contexte global:
      ${JSON.stringify(context, null, 2)}
      
      Réponds directement et uniquement avec un JSON pur:
      {
          "title": "${slideOutline.title}",
          "content": "Contenu principal en texte riche ou markdown",
          "speakerNotes": "Explications détaillées pour le présentateur"
      }
    `;

    try {
        const response = await this.callAI(prompt);
        let pureJson = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(pureJson);
    } catch(err) {
        return {
            title: slideOutline.title,
            content: "N/A"
        };
    }
  }
}
