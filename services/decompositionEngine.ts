import { ai, DECOMPOSITION_MODEL } from './gemini';
import { DecompositionPlan, DecompositionTask } from '../types';
import { Type } from "@google/genai";

/**
 * NOTE: In a production environment with the actual package installed, 
 * you would import the engine as follows:
 * 
 * import { decompose } from 'ava-langgraph-prompt-decomposition-engine';
 * 
 * Since this is a web demo, we implement the decomposition logic using 
 * Gemini 3 Pro to simulate the engine's capability of breaking down 
 * complex prompts into directed acyclic graphs (DAGs) of tasks.
 */

export const decomposePrompt = async (prompt: string): Promise<DecompositionPlan> => {
  try {
    const response = await ai.models.generateContent({
      model: DECOMPOSITION_MODEL,
      contents: `You are the Ava LangGraph Prompt Decomposition Engine. 
      Your goal is to break down the following complex user prompt into a series of atomic, executable sub-tasks.
      Identify dependencies between tasks where necessary.
      
      User Prompt: "${prompt}"`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking for better planning
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
    console.error("Decomposition failed:", error);
    throw new Error("Failed to decompose prompt. Please try again.");
  }
};
