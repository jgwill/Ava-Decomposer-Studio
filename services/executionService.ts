import { ai, EXECUTION_MODEL } from './gemini';

export const executeTask = async (taskTitle: string, taskDescription: string, context: string = ""): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: EXECUTION_MODEL,
      contents: `
        Task Title: ${taskTitle}
        Task Description: ${taskDescription}
        
        Context from previous steps:
        ${context}
        
        Please execute this task and provide a concise, high-quality output.
      `
    });
    
    return response.text || "No output generated.";
  } catch (error) {
    console.error("Task execution failed:", error);
    throw new Error(`Execution failed for task: ${taskTitle}`);
  }
};
