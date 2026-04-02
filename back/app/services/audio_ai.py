import subprocess
import requests
import os
import aiofiles
from typing import Dict, Any, Optional
from fastapi import UploadFile
import json

class AudioAIService:
    """
    Advanced Audio AI Orchestrator for Wordex.
    Integrates Whisper (Transcription) and Ollama (Local LLM) for secure, multilingual processing.
    """
    def __init__(self):
        # Configuration for local models
        self.whisper_model_path = os.getenv("WHISPER_MODEL_PATH", "ai/whisper/models/ggml-medium.bin")
        self.whisper_bin_path = os.getenv("WHISPER_BIN_PATH", "ai/whisper/main")
        self.ollama_endpoint = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434/api/generate")
        self.temp_dir = "tmp/audio"
        os.makedirs(self.temp_dir, exist_ok=True)

    async def transcribe_audio(self, audio_path: str) -> str:
        """
        Transcribe audio using local whisper.cpp binary.
        Falls back to a warning if binary is not found.
        """
        if not os.path.exists(self.whisper_bin_path):
            return "[SYSTEM] Local Whisper binary not found. This is a placeholder for development. (Simulated Transcription: 'The architect designs the infinite canvas with precision and copper accents.')"

        try:
            # Command for whisper.cpp: process audio and output JSON
            cmd = [
                self.whisper_bin_path,
                "-m", self.whisper_model_path,
                "-f", audio_path,
                "-oj"
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                try:
                    data = json.loads(result.stdout)
                    return " ".join([segment.get("text", "") for segment in data.get("transcription", [])])
                except:
                    return result.stdout.strip()
            return f"Error transcribing: {result.stderr}"
        except Exception as e:
            return f"Whisper Execution Error: {str(e)}"

    async def process_with_llm(self, transcript: str, task: str = "summarize") -> str:
        """
        Process the transcript using local Ollama instance.
        """
        prompt = f"### TASK: {task.upper()}\n### INPUT TRANSCRIPT:\n{transcript}\n\n### OUTPUT:"
        
        try:
            response = requests.post(
                self.ollama_endpoint, 
                json={
                    "model": "mistral",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.4
                    }
                },
                timeout=30
            )
            if response.status_code == 200:
                return response.json().get("response", "No response from LLM")
            return f"Ollama Error (Status {response.status_code}): {response.text}"
        except Exception as e:
            return f"LLM Connectivity Issue: {str(e)}"

    async def pipeline(self, file: UploadFile, task: str = "summarize") -> Dict[str, Any]:
        """
        Full Pipeline: Audio File → Saved Locally → Transcribed → LLM Processed → Cleanup
        """
        temp_file_path = os.path.join(self.temp_dir, f"recording_{file.filename}")
        
        # Save uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        # Transcribe
        transcript = await self.transcribe_audio(temp_file_path)
        
        # Process if transcript is meaningful
        if transcript and not transcript.startswith("Error"):
            ai_result = await self.process_with_llm(transcript, task)
        else:
            ai_result = "N/A (Transcription Failed)"

        # Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        return {
            "transcript": transcript,
            "analysis": ai_result,
            "engine": "Wordex-Aether-Audio-v1",
            "task": task
        }
