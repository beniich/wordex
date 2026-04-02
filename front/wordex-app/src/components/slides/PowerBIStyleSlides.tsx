import { usePresentationEngine, Slide } from '@/hooks/usePresentationEngine';
import { SlideGeneratorModal } from './SlideGeneratorModal';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

// Basic icons
const EditIcon = () => <span>✏️</span>;
const PlayIcon = () => <span>▶️</span>;
const GridViewIcon = () => <span>🔲</span>;
const SparklesIcon = () => <span>✨</span>;
const TrashIcon = () => <span>🗑️</span>;

export function PowerBIStyleSlides({ presentationId }: { presentationId: string }) {
  const { presentation, updatePresentation, generateFromAI, exportPPTX, saveStatus, isGenerating } = usePresentationEngine(presentationId);
  const [viewMode, setViewMode] = useState<'edit' | 'present' | 'overview'>('edit');
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!presentation) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = presentation.slides.findIndex(s => s.id === active.id);
      const newIndex = presentation.slides.findIndex(s => s.id === over.id);
      const newSlides = arrayMove(presentation.slides, oldIndex, newIndex);
      updatePresentation({ ...presentation, slides: newSlides });
      setSelectedSlide(newIndex);
    }
  };
  
  // Navigation entre les slides
  const navigateSlides = (direction: 'prev' | 'next' | 'specific', index?: number) => {
    if (!presentation) return;
    
    let newIndex = selectedSlide;
    
    if (direction === 'prev') {
      newIndex = Math.max(0, selectedSlide - 1);
    } else if (direction === 'next') {
      newIndex = Math.min(presentation.slides.length - 1, selectedSlide + 1);
    } else if (direction === 'specific' && index !== undefined) {
      newIndex = Math.max(0, Math.min(presentation.slides.length - 1, index));
    }
    
    setSelectedSlide(newIndex);
  };

  // Ajouter un nouveau slide
  const addNewSlide = (layout: Slide['layout'] = 'titleAndContent') => {
    if (!presentation) return;
    
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      title: 'Nouveau Slide',
      content: '',
      layout,
      visualType: 'text'
    };
    
    const updatedPresentation = {
      ...presentation,
      slides: [...presentation.slides, newSlide],
      currentIndex: presentation.slides.length
    };
    
    updatePresentation(updatedPresentation);
    setSelectedSlide(presentation.slides.length);
  };

  const updateCurrentSlide = <K extends keyof Slide>(field: K, value: Slide[K]) => {
      if (!presentation) return;
      const updatedSlides = [...presentation.slides];
      updatedSlides[selectedSlide] = {
          ...updatedSlides[selectedSlide],
          [field]: value
      };
      updatePresentation({
          ...presentation,
          slides: updatedSlides
      });
  };

  const deleteCurrentSlide = () => {
    if (!presentation || presentation.slides.length <= 1) return;
    const updatedSlides = [...presentation.slides];
    updatedSlides.splice(selectedSlide, 1);
    
    updatePresentation({
        ...presentation,
        slides: updatedSlides
    });
    
    setSelectedSlide(Math.max(0, selectedSlide - 1));
  };


  if (!presentation) {
    return (
      <div className="slides-loading sable-theme flex items-center justify-center p-8 h-full min-h-screen">
        <div className="w-8 h-8 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 font-semibold text-gray-700">Chargement de la présentation...</p>
      </div>
    );
  }

  const currentSlide = presentation.slides[selectedSlide];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setViewMode('present');
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setViewMode('edit');
    }
  };

  return (
    <div className="powerbi-style-slides sable-theme flex flex-col h-screen overflow-hidden text-gray-800">
      {/* Barre d'outils */}
      <div className="slides-toolbar cuivre-gradient flex items-center justify-between p-3 px-6 shadow-md z-10">
        <div className="toolbar-section flex items-center gap-2">
            <span className="font-bold text-lg mr-4 tracking-tight">{presentation.title || "Présentation"}</span>
          <button 
            className={`tool-btn ${viewMode === 'edit' ? 'active-mode' : ''}`} 
            onClick={() => setViewMode('edit')}
            title="Mode Édition"
          >
            <EditIcon />
            <span className="hidden sm:inline">Éditer</span>
          </button>
          <button 
            className={`tool-btn ${viewMode === 'present' ? 'active-mode' : ''}`} 
            onClick={toggleFullscreen}
            title="Mode Présentation"
          >
            <PlayIcon />
            <span className="hidden sm:inline">Présenter</span>
          </button>
          <button 
            className={`tool-btn ${viewMode === 'overview' ? 'active-mode' : ''}`} 
            onClick={() => setViewMode('overview')}
            title="Mode Aperçu"
          >
            <GridViewIcon />
            <span className="hidden sm:inline">Aperçu</span>
          </button>
        </div>
        
        <div className="toolbar-section self-center text-[10px] font-bold uppercase tracking-widest opacity-70">
            {saveStatus === 'saving' ? 'Enregistrement...' : saveStatus === 'saved' ? 'Sychronisé' : 'Modifié'}
        </div>

        <div className="toolbar-section flex items-center gap-3">
          <button 
            className="tool-btn bg-white/10 hover:bg-white/20 border-white/20" 
            onClick={exportPPTX}
            title="Exporter en PPTX"
          >
            <span className="text-sm">📥 PPTX</span>
          </button>
          
          <button 
            className="tool-btn accent shadow-amber-900/40" 
            onClick={() => setShowGeneratorModal(true)}
            title="Options IA"
          >
            <SparklesIcon />
            <span className="font-bold">AI Designer</span>
          </button>
        </div>
      </div>

      <SlideGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        onGenerate={generateFromAI}
        isGenerating={isGenerating}
      />

      <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar Editor */}
          {viewMode === 'edit' && (
              <div className="w-72 bg-[#FCF9F5] border-r border-[#DCC6A0] flex flex-col overflow-hidden shadow-inner">
                  <div className="p-4 flex justify-between items-center border-b border-[#DCC6A0] bg-white/50">
                      <span className="font-bold text-[10px] text-[#A67B5B] uppercase tracking-[0.2em]">Structure Deck</span>
                      <button 
                        onClick={() => addNewSlide()} 
                        className="w-8 h-8 rounded-full bg-[#A67B5B]/10 flex items-center justify-center text-[#A67B5B] hover:bg-[#A67B5B] hover:text-white transition-all transform active:scale-95" 
                        title="Ajouter Slide"
                      >
                        <span className="text-xl leading-none">+</span>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext 
                          items={presentation.slides.map(s => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {presentation.slides.map((slide: Slide, index: number) => (
                            <SortableSlideItem 
                              key={slide.id}
                              slide={slide}
                              index={index}
                              isSelected={selectedSlide === index}
                              onSelect={() => navigateSlides('specific', index)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                  </div>
              </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 bg-[#F5F1E6] p-8 flex flex-col items-center justify-center overflow-y-auto relative">
               {viewMode === 'edit' && currentSlide && (
                   <div className="w-full max-w-4xl aspect-video bg-white shadow-2xl rounded-xl border border-[#DCC6A0] flex flex-col relative overflow-hidden group">
                       <input 
                           value={currentSlide.title} 
                           onChange={(e) => updateCurrentSlide('title', e.target.value)}
                           className="text-4xl font-bold p-8 outline-none w-full bg-transparent text-[#2D2D2D] placeholder-gray-300"
                           placeholder="Titre de la diapositive"
                           title="Titre de la diapositive"
                       />
                       <textarea 
                           value={currentSlide.content} 
                           onChange={(e) => updateCurrentSlide('content', e.target.value)}
                           className="flex-1 px-8 pb-8 outline-none w-full bg-transparent resize-none text-lg text-gray-700 placeholder-gray-300"
                           placeholder="Contenu principal..."
                           title="Contenu de la diapositive"
                       />
                       <button onClick={deleteCurrentSlide} className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer la diapositive">
                           <TrashIcon />
                       </button>
                   </div>
               )}

               {viewMode === 'edit' && currentSlide && (
                   <div className="w-full max-w-4xl mt-6 p-4 bg-white/50 backdrop-blur rounded-lg border border-[#DCC6A0]">
                       <label className="text-sm font-bold text-[#A67B5B] mb-2 block uppercase tracking-wider">Notes pour le Présentateur</label>
                       <textarea 
                           value={currentSlide.speakerNotes || ''} 
                           onChange={(e) => updateCurrentSlide('speakerNotes', e.target.value)}
                           className="w-full bg-white border border-[#DCC6A0] rounded p-2 text-sm outline-none focus:ring-2 ring-[#A67B5B]"
                           placeholder="Ajoutez vos notes ici..."
                           rows={3}
                           title="Notes"
                       />
                   </div>
               )}

               {viewMode === 'overview' && (
                   <div className="w-full h-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
                       {presentation.slides.map((slide: Slide, index: number) => (
                           <div key={slide.id} onClick={() => { setViewMode('edit'); navigateSlides('specific', index); }} className="aspect-video bg-white rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-105 transition-all border border-[#DCC6A0] p-4 flex flex-col">
                               <div className="font-bold text-sm mb-2 truncate">{slide.title}</div>
                               <div className="text-xs text-gray-500 overflow-hidden text-ellipsis line-clamp-4">{slide.content}</div>
                           </div>
                       ))}
                   </div>
               )}

               {viewMode === 'present' && currentSlide && (
                   <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-16 z-50">
                       <button className="absolute top-4 right-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setViewMode('edit')}>✕ Quitter</button>
                       <h1 className="text-6xl font-bold mb-12 text-[#2D2D2D] text-center">{currentSlide.title}</h1>
                       <div className="text-3xl text-gray-700 max-w-5xl text-center leading-relaxed whitespace-pre-wrap">{currentSlide.content}</div>
                       
                       <div className="absolute bottom-8 flex gap-4">
                           <button onClick={() => navigateSlides('prev')} disabled={selectedSlide === 0} className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 text-xl font-bold" title="Précédent">←</button>
                           <button onClick={() => navigateSlides('next')} disabled={selectedSlide === presentation.slides.length - 1} className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50 text-xl font-bold" title="Suivant">→</button>
                       </div>
                   </div>
               )}
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sable-theme {
          background: linear-gradient(135deg, #F5F1E6 0%, #E8E2D0 100%);
          color: #2D2D2D;
          font-family: 'Inter', sans-serif;
        }
        
        .cuivre-gradient {
          background: linear-gradient(90deg, #A67B5B 0%, #894d0d 100%);
          color: white;
        }
        
        .tool-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }
        
        .tool-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .tool-btn.active-mode {
            background: rgba(255, 255, 255, 0.3);
            border-color: white;
            font-weight: bold;
        }
        
        .tool-btn.accent {
          background: linear-gradient(45deg, #A67B5B, #dbb077);
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 0 10px rgba(166, 123, 91, 0.5);
          font-weight: 600;
        }

        .tool-btn.accent:hover {
             filter: brightness(1.1);
        }

        .animate-pulse-slow {
            animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DCC6A0;
          border-radius: 10px;
        }
      ` }} />
    </div>
  );
}

function SortableSlideItem({ slide, index, isSelected, onSelect }: { 
  slide: Slide; 
  index: number; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id });

  return (
    <div 
      ref={setNodeRef}
      className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer select-none sortable-slide
        ${isSelected 
          ? 'border-[#A67B5B] bg-white shadow-lg ring-1 ring-[#A67B5B]/20' 
          : 'border-transparent bg-black/5 hover:bg-black/8'
        } ${isDragging ? 'dragging' : ''}`}
      onClick={onSelect}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .sortable-slide {
          transform: ${CSS.Transform.toString(transform)};
          transition: ${transition};
          z-index: ${isDragging ? 20 : 1};
        }
        .dragging {
          opacity: 0.5;
        }
      ` }} />
      <div className="flex items-start gap-3">
        <div 
          className="mt-1 text-[10px] font-bold text-[#A67B5B]/40 group-hover:text-[#A67B5B] transition-colors cursor-grab active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-tighter">Slide {index + 1}</div>
          <div className="font-bold text-xs truncate text-gray-700">{slide.title || "Sans titre"}</div>
          <div className="text-[9px] text-gray-400 truncate mt-0.5 opacity-60">
            {slide.content?.substring(0, 40)}...
          </div>
        </div>
      </div>
      
      {isSelected && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#A67B5B] rounded-r-full"
        />
      )}
    </div>
  );
}
