"use client";

import { useState } from "react";

interface AudioResult {
  transcript: string;
  analysis: string;
  engine: string;
  task: string;
}

export function useAudioAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AudioResult | null>(null);

  const processAudio = async (audioBlob: Blob, action: string = "summarize") => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.wav');
      formData.append('action', action);
      
      const response = await fetch('/api/audio/process', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('wordex_access_token')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const data = await response.json();
      setResult(data.data as AudioResult);
      
      return data.data as AudioResult;
    } catch (error) {
      console.error('Audio processing error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processAudio, isProcessing, result };
}
