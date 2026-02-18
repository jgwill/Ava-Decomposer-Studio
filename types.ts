export interface DecompositionTask {
  id: string;
  title: string;
  description: string;
  dependencies: string[]; // IDs of tasks that must complete first
  estimatedComplexity: 'Low' | 'Medium' | 'High';
}

export interface DecompositionPlan {
  originalPrompt: string;
  tasks: DecompositionTask[];
  reasoning: string;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ExecutionResult {
  taskId: string;
  status: TaskStatus;
  output?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}
