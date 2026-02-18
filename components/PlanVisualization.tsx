import React from 'react';
import { DecompositionTask, TaskStatus, ExecutionResult } from '../types';
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowDown, Cpu } from 'lucide-react';

interface PlanVisualizationProps {
  tasks: DecompositionTask[];
  executionResults: Record<string, ExecutionResult>;
}

const StatusIcon = ({ status }: { status?: TaskStatus }) => {
  switch (status) {
    case TaskStatus.COMPLETED:
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case TaskStatus.RUNNING:
      return <Cpu className="w-5 h-5 text-blue-400 animate-spin" />;
    case TaskStatus.FAILED:
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Circle className="w-5 h-5 text-gray-600" />;
  }
};

export const PlanVisualization: React.FC<PlanVisualizationProps> = ({ tasks, executionResults }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <h2 className="text-xl font-semibold text-white">Decomposition Plan</h2>
        <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 text-xs font-mono border border-blue-800">
          {tasks.length} Steps
        </span>
      </div>

      <div className="relative">
        {tasks.map((task, index) => {
          const result = executionResults[task.id];
          const isLast = index === tasks.length - 1;
          const status = result?.status || TaskStatus.PENDING;

          return (
            <div key={task.id} className="relative pl-8 pb-8">
              {/* Connecting Line */}
              {!isLast && (
                <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-800" />
              )}
              
              {/* Node Point */}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center bg-gray-900 border-2 transition-colors duration-300 z-10 ${
                status === TaskStatus.COMPLETED ? 'border-green-500/50 bg-green-900/20' : 
                status === TaskStatus.RUNNING ? 'border-blue-500 bg-blue-900/20' : 
                'border-gray-700'
              }`}>
                {index + 1}
              </div>

              {/* Card */}
              <div className={`
                relative p-4 rounded-xl border transition-all duration-300
                ${status === TaskStatus.RUNNING ? 'bg-gray-800/80 border-blue-500/50 shadow-lg shadow-blue-500/10' : 
                  status === TaskStatus.COMPLETED ? 'bg-gray-800/50 border-green-500/30' : 
                  'bg-gray-900 border-gray-800 hover:border-gray-700'}
              `}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-200">{task.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                      task.estimatedComplexity === 'High' ? 'text-orange-400 bg-orange-950/30' :
                      task.estimatedComplexity === 'Medium' ? 'text-yellow-400 bg-yellow-950/30' :
                      'text-emerald-400 bg-emerald-950/30'
                    }`}>
                      {task.estimatedComplexity}
                    </span>
                  </div>
                  <StatusIcon status={status} />
                </div>
                
                <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                
                {task.dependencies.length > 0 && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <ArrowDown className="w-3 h-3" />
                    <span>Depends on: {task.dependencies.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
