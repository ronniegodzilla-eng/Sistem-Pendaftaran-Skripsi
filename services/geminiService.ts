import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let aiClient: GoogleGenAI | null = null;

// Initialize conditionally to avoid crashing if env var is missing during dev
try {
  if (process.env.API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Gemini Client", error);
}

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!aiClient) {
    return "Maaf, sistem AI sedang tidak tersedia (API Key missing). Silakan cek persyaratan secara manual.";
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Maaf, saya tidak dapat memproses permintaan tersebut saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan saat menghubungkan ke asisten virtual.";
  }
};