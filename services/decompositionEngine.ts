import { ai, DECOMPOSITION_MODEL } from './gemini';
import { DecompositionPlan, DecompositionTask } from '../types';
import { Type } from "@google/genai";

/**
 * Fallback implementation using direct Gemini 3 Pro calls.
 * This ensures the app remains functional if the external package
 * encounters loading issues in the browser environment.
 */
const fallbackDecompose = async (prompt: string): Promise<DecompositionPlan> => {
  try {
    const response = await ai.models.generateContent({
      model: DECOMPOSITION_MODEL,
      contents: `You are the Ava LangGraph Prompt Decomposition Engine. 
      Your goal is to break down the following complex user prompt into a series of atomic, executable sub-tasks.
      Identify dependencies between tasks where necessary.
      
      User Prompt: "${prompt}"`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING, description: "High-level strategy for the breakdown" },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  dependencies: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of task IDs that must be completed before this one."
                  },
                  estimatedComplexity: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                },
                required: ["id", "title", "description", "dependencies", "estimatedComplexity"]
              }
            }
          },
          required: ["reasoning", "tasks"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        originalPrompt: prompt,
        tasks: result.tasks,
        reasoning: result.reasoning
      };
    }
    
    throw new Error("Empty response from decomposition engine.");

  } catch (error) {
    console.error("Fallback decomposition failed:", error);
    throw new Error("Failed to decompose prompt. Please try again.");
  }
};

export const decomposePrompt = async (prompt: string): Promise<DecompositionPlan> => {
  try {
    // Attempt to use the installed package
    // We use dynamic import to robustly handle the dependency loading
    // @ts-ignore
    const module = await import("ava-langgraph-prompt-decomposition-engine");
    
    // Check if the expected engine class is exported
    if (module && (module.AvaGraphEngine || module.default)) {
        const EngineClass = module.AvaGraphEngine || module.default;
        const engine = new EngineClass({ apiKey: process.env.API_KEY });
        
        console.log("Using Ava LangGraph Engine for decomposition...");
        const result = await engine.decompose(prompt);
        
        return {
          originalPrompt: prompt,
          tasks: result.tasks,
          reasoning: result.reasoning || "Processed by Ava LangGraph Engine"
        };
    }
    
    throw new Error("Engine export not found in package");

  } catch (error) {
    console.warn("Primary engine load failed, switching to Gemini Fallback:", error);
    return fallbackDecompose(prompt);
  }
};
