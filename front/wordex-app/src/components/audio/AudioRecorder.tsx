"use client";

import { useState, useRef } from "react";
import { useAudioAI } from "@/hooks/use-audio-ai";
import { Mic, StopCircle, Zap, Activity, Info, Trash2 } from "lucide-react";

/**
 * AudioRecorder - A high-fidelity component for capturing and analyzing voice protocols.
 * Integrates directly with the Wordex Whisper + Ollama pipeline.
 */
export function AudioRecorder() {
  const { processAudio, isProcessing, result } = useAudioAI();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudio(audioBlob, 'summarize');
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone Access Error:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-4xl border border-outline-variant/10 p-8 shadow-sm space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}>
               <Mic size={20} />
            </div>
            <div>
               <h3 className="text-sm font-black text-foreground tracking-tight uppercase">Voice Protocol</h3>
               <p className="text-[10px] font-black text-outline uppercase tracking-widest opacity-60">Aether Audio Intelligence</p>
            </div>
         </div>
         {isRecording && (
            <span className="text-xl font-black font-mono text-red-500 tabular-nums">
               {formatTime(duration)}
            </span>
         )}
      </div>

      <div className="flex flex-col items-center justify-center py-12 bg-surface-container-low rounded-3xl relative overflow-hidden group">
         {isRecording ? (
            <div className="flex items-center gap-1 h-24">
               {[40, 65, 30, 85, 50, 75, 45, 60].map((h, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-red-400 rounded-full animate-pulse" 
                    style={{ 
                      height: `${h}%`,
                      animationDelay: `${i * 0.15}s`
                    }} 
                  />
               ))}
            </div>
         ) : (
            <div className="text-center space-y-4">
               <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm border border-outline-variant/5">
                  <Activity size={24} className="text-outline-variant" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-40">Ready for capture</p>
            </div>
         )}
      </div>

      <div className="flex gap-4">
         {!isRecording ? (
            <button 
              onClick={startRecording}
              disabled={isProcessing}
              className="flex-1 py-5 bg-inverse-surface text-surface rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:shadow-2xl hover:brightness-125 transition-all disabled:opacity-50"
            >
               <Mic size={16} /> Start Protocol
            </button>
         ) : (
            <button 
              onClick={stopRecording}
              className="flex-1 py-5 bg-red-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:shadow-2xl hover:brightness-110 transition-all"
            >
               <StopCircle size={16} /> Stop & Analyze
            </button>
         )}
      </div>

      {isProcessing && (
         <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-3xl border border-primary/10 animate-pulse">
            <Zap size={18} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Aether is processing transcription and local LLM summary...</span>
         </div>
      )}

      {result && (
         <div className="space-y-6 animate-fade-in-up">
            <div className="p-8 bg-surface-container-high rounded-4xl border border-outline-variant/10 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Transcript</span>
                  <div className="flex gap-2">
                     <button title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-outline-variant hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                  </div>
               </div>
               <p className="text-xs leading-relaxed text-on-surface-variant font-medium italic">&quot;{result.transcript}&quot;</p>
            </div>

            <div className="p-8 bg-inverse-surface text-surface rounded-4xl shadow-2xl space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={48} />
               </div>
               <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Aether Intelligence Synthesis</span>
               </div>
               <p className="text-sm font-bold leading-relaxed">{result.analysis}</p>
            </div>
         </div>
      )}
    </div>
  );
}
