"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface VoiceTabProps {
  className?: string;
}

export function VoiceTab({ className = "" }: VoiceTabProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [conversation, setConversation] = useState<{role: "user" | "ai", text: string}[]>([]);
  const recognitionRef = useRef<any>(null);

  // Text to speech
  const speak = useCallback(async (text: string) => {
    if (typeof window === "undefined") return;
    
    // Try ElevenLabs first
    try {
      const elevenKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
      if (elevenKey && voiceEnabled) {
        const voiceResponse = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text,
            voice_id: "CwhRBWXzGAHq8TQ4Fs17", // Roger - free voice
          }),
        });

        if (voiceResponse.ok) {
          const data = await voiceResponse.json();
          if (data.audio) {
            // Play ElevenLabs audio
            const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            audio.play();
            return;
          }
        }
      }
    } catch (e) {
      console.log("ElevenLabs failed, using browser TTS");
    }

    // Fallback to browser TTS
    if (!voiceEnabled) return;
    
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[*_`#]/g, '')
      .substring(0, 500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.1;
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
  }, [voiceEnabled]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Use Chrome.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("Listening...");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        handleVoiceInput(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, []);

  // Handle voice input
  const handleVoiceInput = async (input: string) => {
    setIsProcessing(true);
    setConversation(prev => [...prev, { role: "user", text: input }]);

    try {
      // Call Fireworks AI
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are King Hermes AI. Give short 1-2 sentence responses with fire emojis." },
            { role: "user", content: input }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || "I didn't understand";
        
        setResponse(aiText);
        setConversation(prev => [...prev, { role: "ai", text: aiText }]);
        
        // SPEAK THE RESPONSE!
        await speak(aiText);
      }
    } catch (error) {
      const errorMsg = "Sorry, I encountered an error.";
      setResponse(errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
      setTranscript("");
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setTranscript("");
    } else {
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    }
  };

  return (
    <Card className={`bg-slate-900/50 border-slate-800 overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500">
              <AvatarFallback className="text-white"><Sparkles className="w-4 h-4" /></AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-200">Voice Assistant</span>
            <Badge variant="outline" className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
              AI Voice
            </Badge>
          </div>
        </div>
        <Button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          size="icon"
          variant="ghost"
          className={`w-8 h-8 ${voiceEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        {/* Big Mic Button */}
        <div className="relative">
          <Button
            onClick={toggleListening}
            className={`w-32 h-32 rounded-full ${
              isListening 
                ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-2xl shadow-red-500/50" 
                : "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:via-pink-400 hover:to-rose-400 shadow-2xl shadow-purple-500/30"
            }`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </Button>
          
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
              <span className="absolute -inset-4 rounded-full border-2 border-red-300/50 animate-pulse" />
            </>
          )}
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          {isListening ? (
            <>
              <p className="text-xl font-semibold text-red-400 animate-pulse">Listening...</p>
              {transcript && transcript !== "Listening..." && (
                <p className="text-sm text-slate-400">"{transcript}"</p>
              )}
            </>
          ) : isProcessing ? (
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <p className="text-slate-400">Tap the mic and speak</p>
          )}
        </div>

        {/* Last Response */}
        {response && !isListening && !isProcessing && (
          <div className="bg-slate-800/50 rounded-xl p-4 max-w-md border border-slate-700">
            <p className="text-sm text-slate-500 mb-1">AI Response:</p>
            <p className="text-lg text-slate-200">{response}</p>
          </div>
        )}

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="w-full max-w-md space-y-2 max-h-48 overflow-y-auto">
            {conversation.slice(-4).map((item, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${item.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className={`w-6 h-6 ${item.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}>
                  <AvatarFallback className="text-xs text-white">
                    {item.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`px-3 py-1.5 rounded-lg text-sm ${
                  item.role === "user" 
                    ? "bg-cyan-600 text-white" 
                    : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <p className="text-xs text-slate-500 text-center">
          {voiceEnabled 
            ? "🔊 Voice responses ON - AI will speak back to you" 
            : "🔇 Voice responses OFF - Text only"}
        </p>
      </div>
    </Card>
  );
}
