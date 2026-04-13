"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Bot, User, Play, Square } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface VoiceTabProps {
  className?: string;
}

export function VoiceTab({ className = "" }: VoiceTabProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [conversation, setConversation] = useState<{role: "user" | "ai", text: string}[]>([]);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Text to speech - calls API
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    
    setIsSpeaking(true);
    
    try {
      console.log("Fetching voice from API...");
      
      // Get API keys from localStorage
      const savedVars = localStorage.getItem('hermes_env_vars');
      const envVars = savedVars ? JSON.parse(savedVars) : {};
      const elevenLabsKey = envVars.ELEVENLABS_API_KEY || "";
      const voiceId = envVars.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17";
      
      // Call our voice API
      const voiceResponse = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          voice_id: voiceId,
          apiKey: elevenLabsKey,
        }),
      });

      console.log("Voice API response:", voiceResponse.status);

      if (voiceResponse.ok) {
        const data = await voiceResponse.json();
        
        if (data.audio) {
          console.log("Playing ElevenLabs audio...");
          
          // Create and play audio
          const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
          audioRef.current = audio;
          
          audio.onended = () => {
            setIsSpeaking(false);
          };
          
          audio.onerror = () => {
            console.error("Audio playback failed");
            setIsSpeaking(false);
            // Fallback to browser TTS
            speakBrowser(text);
          };
          
          await audio.play();
          return;
        }
      }
      
      // If API fails, use browser TTS
      console.log("API failed, using browser TTS");
      speakBrowser(text);
      
    } catch (e) {
      console.error("Voice error:", e);
      setIsSpeaking(false);
      // Fallback to browser TTS
      speakBrowser(text);
    }
  }, [voiceEnabled]);

  // Browser TTS fallback
  const speakBrowser = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    
    const synth = window.speechSynthesis;
    if (!synth) {
      setError("Speech synthesis not supported");
      setIsSpeaking(false);
      return;
    }

    synth.cancel();

    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[*_`#]/g, '')
      .substring(0, 500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) ||
                          voices.find(v => v.name.includes("Samantha")) ||
                          voices.find(v => v.lang === "en-US");
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synth.speak(utterance);
  };

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Use Chrome.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
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
      setError(`Speech error: ${event.error}`);
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
      console.log("Sending to chat API:", input);
      
      // Call Fireworks AI
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are King Hermes AI. Give short 1-2 sentence responses with fire emojis. Be powerful and commanding." },
            { role: "user", content: input }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      console.log("Chat API response:", response.status);

      if (response.ok) {
        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || "I didn't understand";
        
        console.log("AI response:", aiText);
        
        setResponse(aiText);
        setConversation(prev => [...prev, { role: "ai", text: aiText }]);
        
        // SPEAK THE RESPONSE!
        await speak(aiText);
      } else {
        const errorText = await response.text();
        console.error("Chat API error:", errorText);
        const errMsg = "Sorry, the AI service is not responding.";
        setResponse(errMsg);
        speak(errMsg);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMsg = "Sorry, I encountered an error connecting to the AI.";
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

  // Stop speaking
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
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
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              size="icon"
              variant="outline"
              className="w-8 h-8 border-red-500/50 text-red-400"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            size="icon"
            variant="ghost"
            className={`w-8 h-8 ${voiceEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        {/* Big Mic Button */}
        <div className="relative">
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-32 h-32 rounded-full transition-all duration-300 ${
              isListening 
                ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-2xl shadow-red-500/50" 
                : isProcessing
                  ? "bg-amber-500 cursor-wait"
                  : "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:via-pink-400 hover:to-rose-400 shadow-2xl shadow-purple-500/30 hover:scale-105"
            }`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : isProcessing ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
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
              <p className="text-xl font-semibold text-red-400 animate-pulse">🎤 Listening...</p>
              {transcript && transcript !== "Listening..." && (
                <p className="text-sm text-slate-400">"{transcript}"</p>
              )}
            </>
          ) : isProcessing ? (
            <div className="flex items-center gap-2 text-amber-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing with AI...</span>
            </div>
          ) : isSpeaking ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <Play className="w-5 h-5" />
              <span>🔊 Speaking...</span>
            </div>
          ) : (
            <>
              <p className="text-lg text-slate-300 font-medium">Tap the mic and speak</p>
              <p className="text-sm text-slate-500">I will listen, process, and respond with voice</p>
            </>
          )}
        </div>

        {/* Last Response */}
        {response && !isListening && !isProcessing && !isSpeaking && (
          <div className="bg-slate-800/50 rounded-xl p-4 max-w-md border border-slate-700 w-full">
            <p className="text-sm text-slate-500 mb-1">AI Response:</p>
            <p className="text-lg text-slate-200">{response}</p>
          </div>
        )}

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="w-full max-w-md space-y-2 max-h-48 overflow-y-auto bg-slate-800/30 rounded-lg p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Conversation</p>
            {conversation.slice(-4).map((item, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${item.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className={`w-6 h-6 ${item.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}>
                  <AvatarFallback className="text-xs text-white">
                    {item.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`px-3 py-1.5 rounded-lg text-sm max-w-[80%] ${
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
            ? "🔊 Voice responses ON - I will speak back to you" 
            : "🔇 Voice responses OFF - Text only"}
        </p>
      </div>
    </Card>
  );
}
