"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";

interface VoiceAssistantProps {
  onTranscript?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export function VoiceAssistant({ 
  onTranscript, 
  onSpeechStart, 
  onSpeechEnd 
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      onSpeechStart?.();
    };

    recognition.onend = () => {
      setIsListening(false);
      onSpeechEnd?.();
    };

    recognition.onresult = (event) => {
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
        onTranscript?.(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    return recognition;
  }, [onTranscript, onSpeechStart, onSpeechEnd]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      const recognition = initRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    }
  };

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    
    const synth = window.speechSynthesis;
    if (!synth) {
      setError("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isListening 
              ? "bg-red-500/20 animate-pulse" 
              : "bg-slate-800"
          }`}>
            {isListening ? (
              <Mic className="w-4 h-4 text-red-400" />
            ) : (
              <MicOff className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-200">Voice Control</h4>
            <p className="text-xs text-slate-500">
              {isListening ? "Listening..." : "Click mic to speak"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleListening}
            className={`${
              isListening 
                ? "bg-red-500/10 border-red-500/50 text-red-400" 
                : "border-slate-700 hover:border-emerald-500/50"
            }`}
          >
            {isListening ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={isSpeaking ? stopSpeaking : () => speak("Voice assistant ready")}
            className="border-slate-700 hover:border-purple-500/50"
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {transcript && (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-500 mb-1">Last transcript:</p>
          <p className="text-sm text-slate-300">{transcript}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">
          Try: "Run status command"
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">
          Try: "Deploy to Vercel"
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">
          Try: "Show environment"
        </Badge>
      </div>

      <p className="text-[10px] text-slate-600 mt-3 text-center">
        Powered by Web Speech API • ElevenLabs integration available
      </p>
    </Card>
  );
}
