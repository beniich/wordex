import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { slides } from '@/lib/api';

export interface Slide {
  id: string;
  title: string;
  content: string;
  speakerNotes?: string;
  visualType?: 'chart' | 'image' | 'bulletPoints' | 'text';
  visualData?: unknown;
  layout: 'titleOnly' | 'titleAndContent' | 'twoColumn' | 'sectionHeader';
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: 'sable' | 'cuivre' | 'minimal' | 'corporate';
  currentIndex: number;
}

export function usePresentationEngine(presentationId: string) {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  useEffect(() => {
    if (presentationId) loadPresentation(presentationId);
  }, [presentationId]);

  const loadPresentation = async (id: string) => {
    try {
      const data = await slides.get(id);
      
      if (!data || !data.slides) {
         setPresentation({
            id: id,
            title: (data as { title?: string })?.title || "Nouvelle Présentation",
            slides: [{
                id: crypto.randomUUID(),
                title: "Introduction",
                content: "Bienvenue dans votre nouvelle présentation.",
                layout: 'titleAndContent'
            }],
            theme: (data as { theme?: string })?.theme as any || 'sable',
            currentIndex: 0
         });
      } else {
         setPresentation({ ...data, id } as unknown as Presentation);
      }
    } catch (err) {
       console.error('Failed to load presentation:', err);
       setError("Impossible de charger la présentation. Vérifiez votre connexion.");
       setPresentation(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (presData: Presentation) => {
      setIsSaving(true);
      setSaveStatus('saving');
      
      try {
        await slides.update(presentationId, presData as unknown as Record<string, unknown>);
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('unsaved');
        console.error('Save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [presentationId]
  );

  const updatePresentation = (newPres: Presentation) => {
      setPresentation(newPres);
      setSaveStatus('unsaved');
      debouncedSave(newPres);
  };

  const generateFromAI = async (topic: string, nSlides = 8) => {
    setIsGenerating(true);
    try {
      const result = await slides.generateFromAI(presentationId, { topic, n_slides: nSlides });
      if (result.presentation) {
        setPresentation({ ...result.presentation, id: presentationId, currentIndex: 0 } as unknown as Presentation);
      }
    } catch (err) {
      console.error("Generate failed:", err);
      // throw err here if you want UI to catch
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPPTX = async () => {
    try {
      const blob = await slides.exportPPTX(presentationId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${presentation?.title || "Presentation"}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return {
      presentation,
      updatePresentation,
      generateFromAI,
      exportPPTX,
      saveStatus,
      isSaving,
      isGenerating,
      error
  };
}
