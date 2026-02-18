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
    ? "Ava LangGraph Engine v0.1.2 (Stateful, Cyclic, Actor-based)" 
    : "Ava LangChain Engine v0.1.2 (Linear, Chain-based, Traceable)";

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
                  estimatedComplexity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  taskType: { 
                    type: Type.STRING, 
                    enum: ["research", "reasoning", "coding", "creative", "review"],
                    description: "The primary nature of this task."
                  },
                  recommendedTools: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Suggested tools to accomplish this task (e.g. 'Search', 'Calculator', 'Code Interpreter')"
                  },
                  reasoningStrategy: {
                    type: Type.STRING,
                    description: "A brief note on the strategic purpose of this task."
                  }
                },
                required: ["id", "title", "description", "dependencies", "estimatedComplexity", "taskType", "reasoningStrategy"]
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
    { name: 'ava-langgraph-prompt-decomposition-engine', version: '0.1.2' },
    { name: 'ava-langchain-prompt-decomposition', version: '0.1.2' },
    { name: 'ava-langgraph-narrative-intelligence', version: '0.1.1' },
    { name: 'ava-langchain-relational-intelligence', version: '0.1.1' },
    { name: 'ava-langchain-narrative-tracing', version: '0.1.1' }
  ];

  const results = await Promise.all(modules.map(async (mod) => {
    try {
        // @ts-ignore
        await import(mod.name);
        return { name: mod.name, status: 'active' as const, version: mod.version };
    } catch (e) {
        console.warn(`Failed to load ${mod.name}`, e);
        return { name: mod.name, status: 'error' as const };
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