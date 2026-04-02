import React, { useState } from 'react';
import { AIPresentationArchitect, PresentationStructure } from '@/lib/slides/ai-architect';

export function AIPresentationGenerator({ workspaceId, onSelect }: { workspaceId: string, onSelect?: (presentation: PresentationStructure) => void }) {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('general');
  const [length, setLength] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPresentation, setGeneratedPresentation] = useState<PresentationStructure | null>(null);

  const generatePresentation = async () => {
    setIsGenerating(true);
    const architect = new AIPresentationArchitect(workspaceId);

    try {
      const structure = await architect.generatePresentationStructure(
        topic, 
        audience, 
        length as 'short' | 'medium' | 'long'
      );
      
      if (!structure || !Array.isArray(structure.slides)) {
        throw new Error("Invalid presentation structure received from AI");
      }
      
      // Générer le contenu de chaque slide
      const slidesWithContent = await Promise.all(
        structure.slides.map(slide => 
          architect.generateSlideContent(slide, { topic, audience })
        )
      );

      const completePresentation = {
        ...structure,
        slides: slidesWithContent,
        createdAt: new Date().toISOString(),
      };

      // In a real flow, this could call /api/slides/ POST mapping to document creation
      // and storing in database. Here we handle it locally. 
      setGeneratedPresentation(completePresentation);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl glassmorphism-board min-w-80">
      <div className="space-y-4">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-800 to-blue-600">Générer avec l&apos;IA ✨</h3>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Sujet:</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-primary"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Stratégie Q4..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Public:</label>
          <select 
            className="w-full px-3 py-2 border rounded-md outline-none"
            value={audience} 
            onChange={(e) => setAudience(e.target.value)}
            title="Public Cible"
          >
            <option value="general">Général</option>
            <option value="executive">Direction (Exec)</option>
            <option value="technical">Technique</option>
            <option value="investors">Investisseurs</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Durée:</label>
          <select 
            className="w-full px-3 py-2 border rounded-md outline-none"
            value={length} 
            onChange={(e) => setLength(e.target.value)}
            title="Durée de la présentation"
          >
            <option value="short">Courte (5-10 slides)</option>
            <option value="medium">Moyenne (10-15 slides)</option>
            <option value="long">Longue (15+ slides)</option>
          </select>
        </div>

        <button 
          onClick={generatePresentation} 
          disabled={isGenerating || !topic.trim()}
          className="w-full py-2.5 mt-2 text-white font-medium bg-linear-to-r from-primary to-blue-600 rounded-md shadow hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {isGenerating ? 'Analyse et Génération...' : 'Créer ma Présentation'}
        </button>
      </div>

      {generatedPresentation && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Aperçu</h4>
          <div className="p-4 bg-gray-50 rounded-md flex flex-col gap-2">
              <span className="font-semibold">{generatedPresentation.title}</span>
              <span className="text-sm text-gray-600">{generatedPresentation.slides?.length || 0} slides genérées</span>
          </div>
          <button 
            onClick={() => onSelect && onSelect(generatedPresentation)}
            className="w-full py-2 mt-4 text-primary font-medium border-2 border-primary rounded-md hover:bg-primary/5 transition-colors"
          >
            Utiliser cette présentation
          </button>
        </div>
      )}
    </div>
  );
}
