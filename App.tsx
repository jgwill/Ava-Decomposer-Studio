import React, { useState, useCallback } from 'react';
import { Layers, Play, RefreshCw, Zap, Sparkles, Box } from 'lucide-react';
import { decomposePrompt } from './services/decompositionEngine';
import { executeTask } from './services/executionService';
import { DecompositionPlan, ExecutionResult, TaskStatus } from './types';
import { PlanVisualization } from './components/PlanVisualization';
import { ExecutionLog } from './components/ExecutionLog';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [plan, setPlan] = useState<DecompositionPlan | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, ExecutionResult>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecompose = async () => {
    if (!prompt.trim()) return;
    
    setIsDecomposing(true);
    setError(null);
    setPlan(null);
    setExecutionResults({});
    
    try {
      const newPlan = await decomposePrompt(prompt);
      setPlan(newPlan);
    } catch (e: any) {
      setError(e.message || "Failed to decompose prompt");
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleExecute = useCallback(async () => {
    if (!plan) return;
    
    setIsExecuting(true);
    let currentContext = "";
    
    // Create a copy of tasks to execute sequentially (simulating dependency resolution simply for this demo)
    // In a full LangGraph engine, this would be topological sort.
    const tasksToRun = [...plan.tasks];
    
    for (const task of tasksToRun) {
      // Set to running
      setExecutionResults(prev => ({
        ...prev,
        [task.id]: { taskId: task.id, status: TaskStatus.RUNNING, startedAt: Date.now() }
      }));

      try {
        const output = await executeTask(task.title, task.description, currentContext);
        
        setExecutionResults(prev => ({
          ...prev,
          [task.id]: { 
            taskId: task.id, 
            status: TaskStatus.COMPLETED, 
            output, 
            completedAt: Date.now() 
          }
        }));
        
        // Append to context for next tasks
        currentContext += `\n\n[Result of ${task.title}]:\n${output}`;
        
      } catch (e: any) {
        setExecutionResults(prev => ({
          ...prev,
          [task.id]: { 
            taskId: task.id, 
            status: TaskStatus.FAILED, 
            error: e.message, 
            completedAt: Date.now() 
          }
        }));
        // Stop execution on failure
        break;
      }
    }
    
    setIsExecuting(false);
  }, [plan]);

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#030712]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
              Ava Decomposer <span className="font-mono text-xs opacity-50 font-normal ml-1">v0.1.1</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-md bg-gray-900 border border-gray-800">
              <Box className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-mono text-gray-400">ava-langgraph-prompt-decomposition-engine@0.1.1</span>
            </div>
            <div className="h-4 w-px bg-gray-800 hidden md:block"></div>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-900/50">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium">Gemini 3 Pro</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        
        {/* Intro / Prompt Section */}
        <section className="mb-12 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Decompose Complex Goals</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Transform high-level prompts into actionable, dependency-aware execution graphs using the Ava Engine.
          </p>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative bg-gray-900 rounded-2xl border border-gray-800 p-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Plan a 3-day itinerary for Tokyo focusing on anime culture and traditional food, including travel logistics..."
                className="w-full bg-transparent border-none text-gray-200 placeholder-gray-600 resize-none h-32 p-4 focus:ring-0 text-lg"
              />
              <div className="flex justify-between items-center px-4 pb-2 pt-2 border-t border-gray-800/50">
                <span className="text-xs text-gray-500 font-mono">
                  {prompt.length} chars
                </span>
                <button
                  onClick={handleDecompose}
                  disabled={!prompt.trim() || isDecomposing || isExecuting}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200
                    ${!prompt.trim() || isDecomposing 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-gray-200 hover:shadow-lg hover:shadow-white/10 active:scale-95'}
                  `}
                >
                  {isDecomposing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Decomposing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Decompose Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </section>

        {/* Results Grid */}
        {plan && (
          <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Left Column: Plan & Reasoning */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Engine Reasoning</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {plan.reasoning}
                  </p>
               </div>

               <PlanVisualization tasks={plan.tasks} executionResults={executionResults} />
            </div>

            {/* Right Column: Execution */}
            <div className="lg:col-span-8">
              <div className="bg-gray-950 rounded-2xl border border-gray-800 h-full min-h-[500px] flex flex-col">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/30 rounded-t-2xl">
                  <h3 className="font-semibold text-gray-200">Execution Engine</h3>
                  <button
                    onClick={handleExecute}
                    disabled={isExecuting || Object.keys(executionResults).length > 0}
                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all
                      ${isExecuting || Object.keys(executionResults).length > 0
                        ? 'bg-gray-800 text-gray-500'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'}
                    `}
                  >
                    {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isExecuting ? 'Executing...' : 'Run All Tasks'}</span>
                  </button>
                </div>
                
                <div className="p-6 flex-1 bg-gradient-to-b from-gray-900/10 to-transparent">
                  <ExecutionLog results={executionResults} tasks={plan.tasks} />
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
