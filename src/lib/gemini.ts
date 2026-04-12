import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MeditationSession {
  id: string;
  title: string;
  script: string;
  imageUrl: string;
  audioUrl: string;
  duration: number;
  mood: string;
  focus: string;
  createdAt: number;
}

export async function generateMeditationScript(mood: string, focus: string, duration: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-preview",
    contents: `Create a guided meditation script for a ${duration}-minute session. 
    The mood should be ${mood} and the focus should be ${focus}.
    Return a JSON object with 'title' and 'script' fields.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: { type: Type.STRING },
        },
        required: ["title", "script"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generateMeditationImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [
        {
          text: `A serene, high-quality meditative visual for: ${prompt}. Minimalist, atmospheric, ethereal lighting.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
}

export async function generateMeditationAudio(text: string, voice: string = "Kore") {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this meditation script calmly and slowly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "audio/pcm" });
    // Note: PCM needs to be wrapped or played with AudioContext. 
    // For simplicity, I'll return the base64 and handle it in the component.
    return base64Audio;
  }
  throw new Error("Failed to generate audio");
}

export async function chatWithGemini(message: string, history: { role: string; parts: { text: string }[] }[]) {
  const chat = ai.chats.create({
    model: "gemini-3.1-flash-preview",
    config: {
      systemInstruction: "You are Zen, a wise and compassionate meditation guide. Help users find peace, refine their meditation practice, and suggest custom sessions.",
    },
    history: history,
  });

  const response = await chat.sendMessage(message);
  return response.text;
}
