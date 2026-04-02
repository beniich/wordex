import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string, nSlides: number) => Promise<void>;
  isGenerating: boolean;
}

export const SlideGeneratorModal: React.FC<SlideGeneratorModalProps> = ({ isOpen, onClose, onGenerate, isGenerating }) => {
  const [topic, setTopic] = useState('');
  const [slideCount, setSlideCount] = useState(8);
  const [theme, setTheme] = useState('sable');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#1E1511]/95 text-[#f4ece3] w-full max-w-lg rounded-2xl border border-[#c17a3a]/30 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#c17a3a]/20">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="text-2xl">🪄</span> AI Designer
            </h2>
            <button
              title="Fermer"
              aria-label="Fermer"
              onClick={onClose}
              className="text-outline hover:text-[#f4ece3] transition-colors p-2"
              disabled={isGenerating}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <p className="text-sm text-outline">
              Décrivez ce que vous souhaitez présenter. L&apos;agent designer s&apos;occupe de structurer le pitch deck complet, d&apos;écrire le contenu et de choisir les meilleures mises en page.
            </p>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[#c17a3a]">
                Sujet de la présentation
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Une analyse stratégique du marché de la robotique industrielle en 2026..."
                className="w-full bg-black/40 border border-[#857467]/30 rounded-xl p-4 text-[#f4ece3] placeholder-[#857467] focus:outline-none focus:border-[#c17a3a] focus:ring-1 focus:ring-[#c17a3a] resize-none h-28"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[#c17a3a]">
                  Nombre de slides
                </label>
                <span className="text-sm font-bold bg-[#c17a3a]/20 px-2 py-1 rounded text-[#c17a3a]">
                  {slideCount}
                </span>
              </div>
              <input
                type="range"
                title="Nombre de slides"
                aria-label="Nombre de slides"
                min="3"
                max="20"
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-[#c17a3a] bg-[#857467]/30 h-1.5 rounded-lg appearance-none cursor-pointer"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[#c17a3a]">
                Thème Visuel
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['sable', 'cuivre', 'minimal', 'industrial'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border
                      ${theme === t 
                        ? 'bg-[#c17a3a] border-[#c17a3a] text-white shadow-lg shadow-[#c17a3a]/20 scale-105' 
                        : 'bg-black/20 border-[#c17a3a]/20 text-outline hover:border-[#c17a3a]/50'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-black/30 border-t border-[#c17a3a]/20 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#f4ece3] hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                await onGenerate(topic, slideCount);
                if (!isGenerating) onClose();
              }}
              disabled={isGenerating || !topic.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#c17a3a] hover:bg-[#a6652d] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                 <>
                   <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Génération en cours...
                 </>
              ) : (
                 <>
                   Générer le Pitch Deck
                 </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
