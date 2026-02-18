import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const DECOMPOSITION_MODEL = 'gemini-3-pro-preview';
export const EXECUTION_MODEL = 'gemini-3-flash-preview';
