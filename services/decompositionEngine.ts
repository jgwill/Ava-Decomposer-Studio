import { ai, DECOMPOSITION_MODEL } from './gemini';
import { DecompositionPlan } from '../types';
import { Type } from "@google/genai";

/**
 * Interface for module status reporting
 */
export interface ModuleStatus {
  name: string;
  status: 'active' | 'loading' | 'error' | 'inactive';
  version?: string;
}

export type EngineType = 'langgraph' | 'langchain';

/**
 * Fallback implementation using direct Gemini 3 Pro calls.
 */
const fallbackDecompose = async (prompt: string, engineType: EngineType): Promise<DecompositionPlan> => {
  const enginePersona = engineType === 'langgraph' 
    ? "Ava LangGraph Engine (Stateful, Cyclic, Actor-based)" 
    : "Ava LangChain Engine (Linear, Chain-based, Traceable)";

  const styleInstruction = engineType === 'langgraph'
    ? "Focus on identifying independent actors, complex dependencies, and potential feedback loops."
    : "Focus on a clear, step-by-step linear chain of thought decomposition.";

  try {
    const response = await ai.models.generateContent({
      model: DECOMPOSITION_MODEL,
      contents: `You are the ${enginePersona}. 
      Your goal is to break down the following complex user prompt into a series of atomic, executable sub-tasks.
      ${styleInstruction}
      
      User Prompt: "${prompt}"`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING, description: `High-level strategy using ${engineType} architecture` },
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

/**
 * loads all Ava modules and reports their status
 */
export const loadAvaModules = async (): Promise<ModuleStatus[]> => {
  const modules = [
    'ava-langgraph-prompt-decomposition-engine',
    'ava-langgraph-narrative-intelligence',
    'ava-langchain-relational-intelligence',
    'ava-langchain-prompt-decomposition',
    'ava-langchain-narrative-tracing'
  ];

  const results = await Promise.all(modules.map(async (name) => {
    try {
        // @ts-ignore
        await import(name);
        return { name, status: 'active' as const, version: '0.1.1' };
    } catch (e) {
        // In a real env without these packages, this will error. 
        // For the demo, we might want to simulate 'active' if we are pretending, 
        // but let's be honest about the load status.
        console.warn(`Failed to load ${name}`, e);
        return { name, status: 'error' as const };
    }
  }));

  return results;
};

export const decomposePrompt = async (prompt: string, engineType: EngineType = 'langgraph'): Promise<DecompositionPlan> => {
  const packageName = engineType === 'langgraph' 
    ? "ava-langgraph-prompt-decomposition-engine"
    : "ava-langchain-prompt-decomposition";

  try {
    // Attempt to use the installed package
    // @ts-ignore
    const module = await import(packageName);
    
    // Check if the expected engine class is exported
    // Fallback to DecompositionGraph if default is not available
    const EngineClass = module.default || module.DecompositionGraph || module.ChainDecomposer;
    
    if (EngineClass) {
        const engine = new EngineClass({ apiKey: process.env.API_KEY });
        
        console.log(`Using ${engineType} Engine for decomposition...`);
        
        const result = await engine.decompose(prompt);
        
        return {
          originalPrompt: prompt,
          tasks: result.tasks,
          reasoning: result.reasoning || `Processed by ${engineType} Engine`
        };
    }
    
    throw new Error("Engine export not found in package");

  } catch (error) {
    console.warn(`Primary engine (${packageName}) load failed, switching to Gemini Fallback:`, error);
    return fallbackDecompose(prompt, engineType);
  }
};
