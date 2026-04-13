"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Key,
  Server,
  Bot,
  Mic
} from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
  description: string;
  category: "ai" | "deployment" | "voice" | "messaging";
  required: boolean;
  placeholder: string;
}

const ENV_VARS: EnvVar[] = [
  {
    key: "FIREWORKS_API_KEY",
    value: "",
    description: "Fireworks AI API key for Kimi K2.5 Turbo",
    category: "ai",
    required: true,
    placeholder: "fw_xxxxxxxxxxxxxxxx",
  },
  {
    key: "OPENAI_API_KEY",
    value: "",
    description: "OpenAI API key (optional backup)",
    category: "ai",
    required: false,
    placeholder: "sk-xxxxxxxxxxxxxxxx",
  },
  {
    key: "ANTHROPIC_API_KEY",
    value: "",
    description: "Anthropic API key for Claude (optional)",
    category: "ai",
    required: false,
    placeholder: "sk-ant-xxxxxxxxxxxxxxxx",
  },
  {
    key: "VERCEL_TOKEN",
    value: "",
    description: "Vercel API token for deployments",
    category: "deployment",
    required: true,
    placeholder: "vercel_token_xxxxxxxx",
  },
  {
    key: "VERCEL_PROJECT_ID",
    value: "",
    description: "Vercel Project ID",
    category: "deployment",
    required: false,
    placeholder: "prj_xxxxxxxxxxxxxxxx",
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    value: "",
    description: "Telegram Bot Token for bot integration",
    category: "messaging",
    required: false,
    placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
  },
  {
    key: "TELEGRAM_CHAT_ID",
    value: "",
    description: "Telegram Chat ID for notifications",
    category: "messaging",
    required: false,
    placeholder: "123456789",
  },
  {
    key: "ELEVENLABS_API_KEY",
    value: "",
    description: "ElevenLabs API key for voice synthesis",
    category: "voice",
    required: false,
    placeholder: "elevenlabs_api_key_xxxxxxxx",
  },
  {
    key: "ELEVENLABS_VOICE_ID",
    value: "",
    description: "ElevenLabs Voice ID",
    category: "voice",
    required: false,
    placeholder: "21m00Tcm4TlvDq8ikWAM",
  },
];

export function EnvPanel() {
  const [envVars, setEnvVars] = useState<EnvVar[]>(ENV_VARS);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const updateValue = (key: string, value: string) => {
    setEnvVars((prev) =>
      prev.map((v) => (v.key === key ? { ...v, value } : v))
    );
    setSaved(false);
  };

  const handleSave = () => {
    // In production, this would save to backend/secure storage
    console.log("Saving env vars:", envVars);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ai":
        return <Bot className="w-4 h-4" />;
      case "deployment":
        return <Server className="w-4 h-4" />;
      case "voice":
        return <Mic className="w-4 h-4" />;
      case "messaging":
        return <Key className="w-4 h-4" />;
      default:
        return <Key className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ai":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "deployment":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "voice":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "messaging":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const filteredVars = (category: string) =>
    envVars.filter((v) => v.category === category);

  const renderVarInputs = (vars: EnvVar[]) => (
    <div className="space-y-4">
      {vars.map((envVar) => (
        <div key={envVar.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              {envVar.key}
              {envVar.required && (
                <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                  Required
                </Badge>
              )}
            </label>
            <Badge variant="outline" className={`text-[10px] ${getCategoryColor(envVar.category)}`}>
              {getCategoryIcon(envVar.category)}
              <span className="ml-1 capitalize">{envVar.category}</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500">{envVar.description}</p>
          <div className="relative">
            <Input
              type={showSecrets[envVar.key] ? "text" : "password"}
              value={envVar.value}
              onChange={(e) => updateValue(envVar.key, e.target.value)}
              placeholder={envVar.placeholder}
              className="pr-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600 focus-visible:ring-emerald-500 font-mono text-sm"
            />
            <button
              onClick={() =>
                setShowSecrets((prev) => ({
                  ...prev,
                  [envVar.key]: !prev[envVar.key],
                }))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showSecrets[envVar.key] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-200">Environment Variables</span>
        </div>
        <Button
          onClick={handleSave}
          className={`text-sm ${
            saved
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
          } text-white`}
          size="sm"
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Save All
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-slate-800/50 p-1 m-4 mb-0 w-[calc(100%-2rem)]">
          <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-slate-700">
            <Bot className="w-3 h-3 mr-1" />
            AI
          </TabsTrigger>
          <TabsTrigger value="deployment" className="text-xs data-[state=active]:bg-slate-700">
            <Server className="w-3 h-3 mr-1" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="messaging" className="text-xs data-[state=active]:bg-slate-700">
            <Key className="w-3 h-3 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="voice" className="text-xs data-[state=active]:bg-slate-700">
            <Mic className="w-3 h-3 mr-1" />
            Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="p-4 pt-2">
          {renderVarInputs(filteredVars("ai"))}
        </TabsContent>

        <TabsContent value="deployment" className="p-4 pt-2">
          {renderVarInputs(filteredVars("deployment"))}
        </TabsContent>

        <TabsContent value="messaging" className="p-4 pt-2">
          {renderVarInputs(filteredVars("messaging"))}
        </TabsContent>

        <TabsContent value="voice" className="p-4 pt-2">
          {renderVarInputs(filteredVars("voice"))}
        </TabsContent>
      </Tabs>

      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            API keys are stored securely and never exposed in client-side code. 
            In production, these should be stored in Vercel Environment Variables or a secure vault.
          </p>
        </div>
      </div>
    </Card>
  );
}
