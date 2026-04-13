"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";

interface VoiceAssistantProps {
  onVoiceCommand?: (command: string) => void;
  onVoiceMessage?: (message: string) => void;
  className?: string;
}

export function VoiceAssistant({ onVoiceCommand, onVoiceMessage, className = "" }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("Listening...");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        // Send to chat or terminal based on command
        if (onVoiceMessage) {
          onVoiceMessage(finalTranscript);
        }
      } else if (interimTranscript) {
        setTranscript(interimTranscript + "...");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setTranscript("Error: " + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript("");
    };

    return recognition;
  }, [onVoiceMessage]);

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setTranscript("");
    } else {
      // Start listening
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setTranscript("Speech recognition not supported in this browser");
      }
    }
  };

  // Text-to-speech function
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !voiceEnabled) return;
    
    const synth = window.speechSynthesis;
    if (!synth) {
      console.error("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to use a good English voice
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) ||
                          voices.find(v => v.name.includes("Samantha")) ||
                          voices.find(v => v.lang === "en-US");
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  }, [voiceEnabled]);

  // Stop speaking
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle voice output
  const toggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Status Badge */}
      {transcript && (
        <Badge 
          variant="outline" 
          className={`text-xs px-2 py-1 max-w-[200px] truncate ${
            isListening 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse" 
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {isListening ? "🎤 " : ""}{transcript}
        </Badge>
      )}

      {/* Voice Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Mic Button - Main control */}
        <Button
          onClick={toggleListening}
          size="icon"
          className={`relative w-14 h-14 rounded-full ${
            isListening 
              ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50" 
              : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/30"
          }`}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          
          {/* Pulsing ring when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
          )}
        </Button>

        {/* Speaker Toggle */}
        <Button
          onClick={toggleVoice}
          size="icon"
          variant="outline"
          className={`w-10 h-10 rounded-full border-slate-700 ${
            voiceEnabled 
              ? "bg-slate-800 text-emerald-400 hover:bg-slate-700" 
              : "bg-slate-800 text-slate-500 hover:bg-slate-700"
          }`}
          title={voiceEnabled ? "Voice output ON" : "Voice output OFF"}
        >
          {voiceEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Instructions */}
      <p className="text-[10px] text-slate-500 text-center">
        {isListening 
          ? "Listening... Speak now!" 
          : "Click mic to speak"
        }
      </p>
    </div>
  );
}

// Hook for text-to-speech
export function useVoiceOutput() {
  const speak = useCallback((text: string, voiceEnabled: boolean = true) => {
    if (typeof window === "undefined" || !voiceEnabled) return;
    
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) ||
                          voices.find(v => v.name.includes("Samantha")) ||
                          voices.find(v => v.lang === "en-US");
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synth.speak(utterance);
  }, []);

  return { speak };
}
