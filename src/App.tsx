import { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, SkipForward, RotateCcw, Code, Sparkles, Cpu, 
  Terminal, Sliders, AlertCircle, CheckCircle, RefreshCw, 
  Info, HelpCircle, ChevronRight, Layers, ArrowRightLeft,
  X, HelpCircle as HelpIcon, ArrowUp, ArrowDown, BookOpen
} from "lucide-react";
import { PRESET_ALGORITHMS } from "./utils/presets";
import { ArrayElement, TraceStep, AlgorithmInfo } from "./types";

// Helper to align elements smoothly preserving IDs to animate swaps/shifts
function alignElements(prevElements: ArrayElement[], targetState: number[]): ArrayElement[] {
  const remaining = [...prevElements];
  const next: ArrayElement[] = [];
  
  for (let i = 0; i < targetState.length; i++) {
    const targetVal = targetState[i];
    // Find the first matching element by value
    const matchIdx = remaining.findIndex(el => el.value === targetVal);
    if (matchIdx !== -1) {
      next.push(remaining.splice(matchIdx, 1)[0]);
    } else {
      // Create new unique element if not found
      next.push({
        id: `cube-${targetVal}-${Date.now()}-${Math.random()}`,
        value: targetVal
      });
    }
  }
  return next;
}

const DEFAULT_ARRAY = [10, 5, 8, 2, 14, 7];

export default function App() {
  // Array input and states
  const [arrayInput, setArrayInput] = useState<string>("10, 5, 8, 2, 14, 7");
  const [elements, setElements] = useState<ArrayElement[]>([]);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  
  // Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // ms per step
  
  // 3D Scene rotation controls
  const [pitch, setPitch] = useState<number>(20); // deg
  const [yaw, setYaw] = useState<number>(-15); // deg
  const [zoom, setZoom] = useState<number>(1);
  
  // Code Editor State
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>("bubble");
  const [activeLang, setActiveLang] = useState<"python" | "java" | "c">("python");
  const [codeContent, setCodeContent] = useState<string>("");
  const [isCustomCode, setIsCustomCode] = useState<boolean>(false);
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);
  
  // AI Status
  const [isParsingAI, setIsParsingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [algorithmInfo, setAlgorithmInfo] = useState<AlgorithmInfo>({
    name: "Bubble Sort",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    summary: "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order."
  });

  // Log and Terminal history
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Load preset code templates when algorithm or language changes
  useEffect(() => {
    const selectedPreset = PRESET_ALGORITHMS.find(a => a.id === selectedAlgoId);
    if (selectedPreset && !isCustomCode) {
      setCodeContent(selectedPreset.codeTemplates[activeLang]);
      setAlgorithmInfo({
        name: selectedPreset.name,
        timeComplexity: selectedPreset.timeComplexity,
        spaceComplexity: selectedPreset.spaceComplexity,
        summary: selectedPreset.description
      });
    }
  }, [selectedAlgoId, activeLang, isCustomCode]);

  // Handle array input parsing and initialization
  const initializeArray = (customArrayValues?: number[]) => {
    let vals = customArrayValues;
    if (!vals) {
      vals = arrayInput
        .split(",")
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
    }

    if (!vals || vals.length === 0) {
      vals = DEFAULT_ARRAY;
      setArrayInput(DEFAULT_ARRAY.join(", "));
    }

    // Set initial cubes with unique persistent IDs
    const initialElements = vals.map((val, idx) => ({
      id: `cube-${val}-${idx}-${Math.random()}`,
      value: val
    }));
    setElements(initialElements);

    // Generate local steps if using a preset and not custom code
    const selectedPreset = PRESET_ALGORITHMS.find(a => a.id === selectedAlgoId);
    if (selectedPreset && !isCustomCode) {
      const generatedSteps = selectedPreset.generateSteps(vals);
      setSteps(generatedSteps);
      setCurrentStepIndex(0);
      setLogs([
        `[SYSTEM] Initialized ${selectedPreset.name} locally.`,
        `[SYSTEM] Input Array: [${vals.join(", ")}]`,
        `[SYSTEM] Click 'Run' or 'Step' to visualize algorithm execution.`
      ]);
    } else {
      // Simulate general trace if custom code is active without AI parsing
      const fallbackSteps = PRESET_ALGORITHMS[0].generateSteps(vals);
      setSteps(fallbackSteps);
      setCurrentStepIndex(0);
      setLogs([
        `[SYSTEM] Preset fallback initialized for custom configurations.`,
        `[SYSTEM] Click 'Parse & Visualize' to analyze arbitrary logic using server-side Gemini AI.`
      ]);
    }
    setIsPlaying(false);
  };

  // Run on mount or when algorithm or array input changes
  useEffect(() => {
    initializeArray();
  }, [selectedAlgoId, isCustomCode]);

  // Effect to update cube position and state when current step changes
  useEffect(() => {
    if (steps.length > 0 && currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      // Align cube IDs to the step's arrayState to trigger smooth sliding transforms
      setElements(prev => alignElements(prev, step.arrayState));

      // Append step explanation to log terminal
      setLogs(prev => [
        ...prev,
        `[STEP ${currentStepIndex + 1}] ${step.explanation}`
      ]);
    }
  }, [currentStepIndex, steps]);

  // Scroll terminal to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Core Play/Animation Interval
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [isPlaying, steps, speed]);

  // Trigger server-side Gemini AI code analysis
  const handleAITrace = async () => {
    setIsParsingAI(true);
    setAiError(null);
    setIsPlaying(false);

    const vals = arrayInput
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    if (vals.length === 0) {
      setAiError("Please provide a valid comma-separated list of numbers.");
      setIsParsingAI(false);
      return;
    }

    try {
      const response = await fetch("/api/parse-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeContent,
          language: activeLang,
          array: vals
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze code execution path.");
      }

      const data = await response.json();
      
      setAlgorithmInfo({
        name: data.algorithmName || "Custom AI Traced Algorithm",
        timeComplexity: data.timeComplexity || "O(n²)",
        spaceComplexity: data.spaceComplexity || "O(1)",
        summary: data.summary || "Parsed and simulated directly from custom user logic via Google Gemini."
      });

      // Map steps to the UI
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
        setCurrentStepIndex(0);
        
        // Re-align cubes with original order
        const initialElements = vals.map((val, idx) => ({
          id: `cube-${val}-${idx}-${Math.random()}`,
          value: val
        }));
        setElements(initialElements);

        setLogs([
          `[AI ENGINE] Successfully compiled and verified code structure!`,
          `[AI ENGINE] Detected Algorithm: ${data.algorithmName || "Custom Array Scan"}`,
          `[AI ENGINE] Time Complexity: ${data.timeComplexity || "N/A"}`,
          `[SYSTEM] Simulated on input: [${vals.join(", ")}]`,
          `[SYSTEM] Traced ${data.steps.length} atomic steps.`
        ]);
      } else {
        throw new Error("No execution steps returned by the AI compiler.");
      }

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "An unexpected error occurred while parsing code.");
      setLogs(prev => [
        ...prev,
        `[AI ERROR] Analysis failed. Falling back to local visualizer simulation.`
      ]);
    } finally {
      setIsParsingAI(false);
    }
  };

  // Step Controllers
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };
  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    initializeArray();
  };

  // Spacing for 3D layout row centering
  const spacing = 110;
  const getCubeX = (index: number) => {
    return (index - (elements.length - 1) / 2) * spacing;
  };

  // Active step details
  const currentStepData = steps[currentStepIndex] || null;

  // Track active indices for highlighting
  const activeIndices = currentStepData?.indices || [];
  const activeStepType = currentStepData?.type || "normal";

  // Watch variables derived from logs or active indices
  const watchI = activeIndices[0] !== undefined ? activeIndices[0] : "-";
  const watchJ = activeIndices[1] !== undefined ? activeIndices[1] : "-";

  return (
    <div id="app-root" className="w-full min-h-screen bg-[#0F172A] text-slate-200 font-sans flex flex-col overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      
      {/* Header Navigation */}
      <header id="app-header" className="h-16 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center transform rotate-12 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <div className="w-4 h-4 border-2 border-white transform -rotate-12 flex items-center justify-center font-bold text-xs">3D</div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none italic">AlgoCube<span className="text-indigo-400 font-normal">3D</span></h1>
            <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">Interactive Array Visualizer</span>
          </div>
        </div>

        {/* Global Controls & Speed Slider */}
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 shadow-inner">
            <button 
              id="ctrl-play-pause"
              onClick={handlePlayPause}
              disabled={steps.length <= 1}
              className={`p-1.5 px-3 rounded-md transition-all flex items-center gap-1 text-xs font-semibold ${
                isPlaying 
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" 
                  : "hover:bg-slate-800 text-slate-300 disabled:opacity-40"
              }`}
              title={isPlaying ? "Pause execution" : "Run continuous animation"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? "Pause" : "Run"}
            </button>
            
            <button 
              id="ctrl-step-back"
              onClick={handleStepBackward}
              disabled={currentStepIndex === 0 || steps.length === 0}
              className="p-1.5 px-2.5 rounded-md hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors text-xs flex items-center gap-1"
              title="Previous step"
            >
              <SkipForward className="w-3.5 h-3.5 rotate-180" />
              <span>Back</span>
            </button>

            <button 
              id="ctrl-step-forward"
              onClick={handleStepForward}
              disabled={currentStepIndex >= steps.length - 1 || steps.length === 0}
              className="p-1.5 px-2.5 rounded-md hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors text-xs flex items-center gap-1"
              title="Next step"
            >
              <span>Step</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button 
              id="ctrl-reset"
              onClick={handleReset}
              className="p-1.5 px-2.5 rounded-md hover:bg-slate-800 text-slate-300 transition-colors text-xs flex items-center gap-1"
              title="Reset to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          {/* Speed slider */}
          <div className="flex items-center gap-3 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Speed</span>
            <input 
              id="speed-range"
              type="range"
              min="200"
              max="2000"
              step="100"
              value={2200 - speed} // Reverse to make higher values speed up
              onChange={(e) => setSpeed(2200 - parseInt(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs text-indigo-400 font-mono w-10 text-right">
              {((2200 - speed) / 1000).toFixed(1)}x
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main id="app-workspace" className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Panel: Code and Variables */}
        <aside id="workspace-sidebar" className="w-80 border-r border-slate-800 bg-[#0B0F19] flex flex-col shrink-0">
          
          {/* Preset Algorithms Dropdown */}
          <div className="p-4 border-b border-slate-800">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">ALGORITHM LOGIC</label>
            <div className="relative">
              <select
                id="algo-select"
                value={selectedAlgoId}
                onChange={(e) => {
                  setSelectedAlgoId(e.target.value);
                  setIsCustomCode(false);
                }}
                className="w-full bg-slate-900/90 text-sm text-slate-200 border border-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors font-medium cursor-pointer"
              >
                {PRESET_ALGORITHMS.map(algo => (
                  <option key={algo.id} value={algo.id}>
                    {algo.name}
                  </option>
                ))}
                <option value="custom">Custom Algorithm (Editor)</option>
              </select>
            </div>
          </div>

          {/* Code panel tab-system */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex bg-slate-900/40 border-b border-slate-800 shrink-0">
              {(["python", "java", "c"] as const).map(lang => (
                <button
                  key={lang}
                  id={`tab-lang-${lang}`}
                  onClick={() => setActiveLang(lang)}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeLang === lang
                      ? "border-indigo-500 bg-[#0B0F19] text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
                  }`}
                >
                  {lang === "c" ? "C / C++" : lang}
                </button>
              ))}
            </div>

            {/* Code Editor Header Action info */}
            <div className="p-3 bg-slate-900/30 flex items-center justify-between border-b border-slate-800/40 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                <span>Source Code Outline</span>
              </div>
              <div className="flex gap-2">
                {!isEditingCode ? (
                  <button
                    id="btn-edit-code"
                    onClick={() => {
                      setIsEditingCode(true);
                      setIsCustomCode(true);
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded transition-colors uppercase tracking-wider"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    id="btn-done-editing"
                    onClick={() => setIsEditingCode(false)}
                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded transition-colors uppercase tracking-wider"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>

            {/* Editor Textarea with lines */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-slate-950/40 relative flex gap-3 min-h-[180px]">
              {/* Lines Column */}
              <div className="text-slate-600 text-right select-none pr-1 border-r border-slate-800/60 leading-relaxed font-semibold">
                {Array.from({ length: codeContent.split("\n").length || 1 }, (_, i) => i + 1).map(n => (
                  <div key={n}>{n}</div>
                ))}
              </div>

              {/* Text content or Interactive Textarea */}
              {isEditingCode ? (
                <textarea
                  id="code-textarea"
                  value={codeContent}
                  onChange={(e) => {
                    setCodeContent(e.target.value);
                    setIsCustomCode(true);
                  }}
                  className="flex-1 bg-transparent text-slate-200 outline-none border-none resize-none overflow-y-hidden leading-relaxed font-mono focus:ring-0 p-0"
                  spellCheck="false"
                  placeholder="Paste your array manipulation code here..."
                />
              ) : (
                <pre id="code-preview" className="flex-1 text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-text font-mono">
                  {codeContent}
                </pre>
              )}

              {/* Status Badge */}
              {isCustomCode && (
                <div className="absolute top-2 right-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm animate-pulse">
                  Modified
                </div>
              )}
            </div>

            {/* AI Code compiler trigger panel */}
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 shrink-0">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                    AI Code Engine
                  </span>
                  <span className="text-[9px] text-slate-500">Powered by Gemini 3.5</span>
                </div>
                
                <button
                  id="btn-ai-parse"
                  onClick={handleAITrace}
                  disabled={isParsingAI}
                  className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    isParsingAI 
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-[0.98]"
                  }`}
                >
                  {isParsingAI ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing Code Logic...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Compile & Visualize Code</span>
                    </>
                  )}
                </button>

                {aiError && (
                  <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-md text-[10px] text-rose-300 flex gap-1.5 items-start">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Execution Error:</span> {aiError}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Variables Watch panel */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 shrink-0">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Variables Watch</span>
                <span className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1 rounded">STATE</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-mono font-medium">index i</span>
                  <span className="text-amber-400 font-mono font-bold text-sm bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800/80">
                    {watchI}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-mono font-medium">index j</span>
                  <span className="text-indigo-400 font-mono font-bold text-sm bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800/80">
                    {watchJ}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800 col-span-2">
                  <span className="text-slate-400 font-mono font-medium">Step Counter</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80">
                    {currentStepIndex + 1} / {steps.length || 1}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* Center/Right Panel: Canvas and Output Log */}
        <div id="workspace-center" className="flex-1 flex flex-col bg-[#080B11] relative">
          
          {/* Subtle Indigo mesh background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#6366f1 0.7px, transparent 0.7px)", backgroundSize: "28px 28px" }}></div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900/5 rounded-full blur-[120px] pointer-events-none"></div>

          {/* 3D Scene Controls Row */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            {/* Input list customizer trigger */}
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shadow-lg shadow-black/30">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Input Array</span>
              <input
                id="array-input"
                type="text"
                value={arrayInput}
                onChange={(e) => setArrayInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && initializeArray()}
                className="bg-slate-950/90 text-xs text-slate-100 font-mono border border-slate-800 px-2.5 py-1 rounded-md focus:outline-none focus:border-indigo-500 w-32 tracking-wider text-center"
                placeholder="e.g. 10, 5, 8, 2"
              />
              <button
                id="btn-apply-array"
                onClick={() => initializeArray()}
                className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded font-bold uppercase transition-colors shrink-0"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-lg shadow-black/30">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold px-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              3D View Settings
            </span>
            <div className="h-4 w-px bg-slate-800 mx-1"></div>
            
            {/* Pitch slider */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-mono text-[10px]">Pitch</span>
              <input
                id="pitch-slider"
                type="range"
                min="0"
                max="60"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Yaw slider */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
              <span className="font-mono text-[10px]">Yaw</span>
              <input
                id="yaw-slider"
                type="range"
                min="-60"
                max="60"
                value={yaw}
                onChange={(e) => setYaw(parseInt(e.target.value))}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              id="btn-recenter-3d"
              onClick={() => { setPitch(20); setYaw(-15); setZoom(1); }}
              className="ml-2 text-[8px] bg-slate-800 text-slate-400 px-1.5 py-1 rounded hover:text-white transition-colors"
              title="Reset viewport orientation"
            >
              Reset 3D
            </button>
          </div>

          {/* 3D Visualizer Core Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden p-6 select-none">
            
            {/* Dynamic visual algorithm helper label */}
            <div className="absolute top-20 text-center z-10">
              <span className="text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-sm shadow-indigo-500/5">
                {algorithmInfo.name}
              </span>
            </div>

            {/* Core 3D Scene Viewport */}
            <div 
              id="viewport-3d"
              className="scene-3d w-full max-w-4xl h-[340px] flex items-center justify-center relative transition-transform duration-300"
              style={{
                transform: `scale(${zoom})`,
              }}
            >
              {/* Rotation wrapper that tilts the layout */}
              <div
                className="cube-3d w-full h-full flex items-center justify-center relative transition-transform duration-300"
                style={{
                  transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                
                {/* Visual grid floor reflecting depth */}
                <div 
                  className="absolute w-[600px] h-[600px] opacity-20 pointer-events-none"
                  style={{
                    transform: 'rotateX(90deg) translateZ(-60px)',
                    backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    backgroundPosition: 'center',
                    maskImage: 'radial-gradient(ellipse at center, black, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 70%)',
                  }}
                />

                {/* Ground Shadows under cubes */}
                <div 
                  className="absolute w-full h-[150px] bottom-1/4 pointer-events-none"
                  style={{
                    transform: 'rotateX(90deg) translateZ(-60px)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {elements.map((el, idx) => {
                    const isSwapping = activeStepType === "swap" && activeIndices.includes(idx);
                    const isComparing = activeStepType === "compare" && activeIndices.includes(idx);
                    const x = getCubeX(idx);
                    return (
                      <div
                        key={`shadow-${el.id}`}
                        className="absolute w-14 h-7 bg-black/60 rounded-full blur-md transition-all duration-500 ease-in-out"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) translateX(${x}px) scale(${isSwapping ? 0.75 : isComparing ? 0.9 : 1})`,
                          opacity: isSwapping ? 0.3 : 0.65,
                        }}
                      />
                    );
                  })}
                </div>

                {/* 3D Cubes Container */}
                <div 
                  id="cubes-stage"
                  className="relative flex items-center justify-center"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {elements.map((el, idx) => {
                    // Check if cube is comparing, swapping, highlighted or complete
                    const isComparing = activeIndices.includes(idx) && activeStepType === "compare";
                    const isSwapping = activeIndices.includes(idx) && activeStepType === "swap";
                    const isHighlighted = activeIndices.includes(idx) && activeStepType === "highlight";
                    const isShift = activeIndices.includes(idx) && activeStepType === "shift";
                    const isWrite = activeIndices.includes(idx) && activeStepType === "write";
                    const isComplete = activeStepType === "complete" && (activeIndices.length === 0 || activeIndices.includes(idx));

                    let cubeState: "normal" | "compare" | "swap" | "complete" | "highlight" = "normal";
                    if (isSwapping || isShift || isWrite) cubeState = "swap";
                    else if (isComparing) cubeState = "compare";
                    else if (isHighlighted) cubeState = "highlight";
                    else if (isComplete) cubeState = "complete";

                    const x = getCubeX(idx);

                    // Height calculation to act as a 3D bar, proportional to its value
                    // Standard max height cap at 120px, min at 40px
                    const maxValue = Math.max(...elements.map(e => e.value), 1);
                    const cubeHeight = 40 + (el.value / maxValue) * 70;

                    // Compute colors
                    const styleConfig = (() => {
                      switch (cubeState) {
                        case "compare":
                          return {
                            border: "border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]",
                            bg: "bg-amber-950/85",
                            text: "text-amber-300",
                            glow: "bg-amber-400"
                          };
                        case "swap":
                          return {
                            border: "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse",
                            bg: "bg-rose-950/85",
                            text: "text-rose-300 font-bold",
                            glow: "bg-rose-500"
                          };
                        case "highlight":
                          return {
                            border: "border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]",
                            bg: "bg-purple-950/85",
                            text: "text-purple-300",
                            glow: "bg-purple-400"
                          };
                        case "complete":
                          return {
                            border: "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
                            bg: "bg-emerald-950/85",
                            text: "text-emerald-300",
                            glow: "bg-emerald-400"
                          };
                        default:
                          return {
                            border: "border-indigo-500/40 hover:border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.05)]",
                            bg: "bg-slate-900/90",
                            text: "text-slate-200",
                            glow: "bg-indigo-500"
                          };
                      }
                    })();

                    // Dynamic 3D face structure based on actual cube height
                    // Face translations must be centered around height
                    const hHalf = cubeHeight / 2;
                    const wHalf = 36; // half width (width = 72)
                    const dHalf = 36; // half depth (depth = 72)

                    return (
                      <div
                        key={el.id}
                        className="cube-3d absolute transition-all duration-500 ease-out"
                        style={{
                          transform: `translateX(${x}px) translateY(${isSwapping ? -35 : isComparing ? -15 : 0}px) translateZ(${isSwapping ? 40 : 0}px)`,
                          transformStyle: "preserve-3d",
                        }}
                      >
                        {/* The core 3D Box geometry */}
                        <div 
                          className="relative w-[72px] transition-all duration-500 ease-out"
                          style={{
                            height: `${cubeHeight}px`,
                            transformStyle: "preserve-3d",
                            marginTop: `-${hHalf}px`
                          }}
                        >
                          {/* Front Face */}
                          <div 
                            className={`absolute inset-0 flex flex-col items-center justify-between py-2 border rounded-md select-none transition-colors duration-300 ${styleConfig.bg} ${styleConfig.border}`}
                            style={{ 
                              transform: `translateZ(${dHalf}px)`,
                              backfaceVisibility: 'hidden'
                            }}
                          >
                            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">VAL</span>
                            <span className={`text-2xl font-black tracking-tight select-all leading-none ${styleConfig.text}`}>
                              {el.value}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">i: {idx}</span>
                          </div>

                          {/* Back Face */}
                          <div 
                            className={`absolute inset-0 flex items-center justify-center border rounded-md select-none opacity-80 ${styleConfig.bg} ${styleConfig.border}`}
                            style={{ 
                              transform: `rotateY(180deg) translateZ(${dHalf}px)`,
                              backfaceVisibility: 'hidden'
                            }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600/40" />
                          </div>

                          {/* Left Face */}
                          <div 
                            className={`absolute top-0 bottom-0 border rounded-md opacity-40 ${styleConfig.bg} ${styleConfig.border}`}
                            style={{ 
                              width: `${dHalf * 2}px`,
                              left: `-${dHalf}px`,
                              transform: `rotateY(-90deg) translateZ(${wHalf}px)`,
                              backfaceVisibility: 'hidden'
                            }}
                          />

                          {/* Right Face */}
                          <div 
                            className={`absolute top-0 bottom-0 border rounded-md opacity-40 ${styleConfig.bg} ${styleConfig.border}`}
                            style={{ 
                              width: `${dHalf * 2}px`,
                              right: `-${dHalf}px`,
                              transform: `rotateY(90deg) translateZ(${wHalf}px)`,
                              backfaceVisibility: 'hidden'
                            }}
                          />

                          {/* Top Face */}
                          <div 
                            className={`absolute left-0 right-0 border rounded-md flex items-center justify-center opacity-60 ${styleConfig.bg} ${styleConfig.border}`}
                            style={{ 
                              height: `${dHalf * 2}px`,
                              top: `-${dHalf}px`,
                              transform: `rotateX(90deg) translateZ(${hHalf}px)`,
                              backfaceVisibility: 'hidden'
                            }}
                          >
                            <span className="text-[8px] font-mono text-slate-500 font-semibold">{el.value}</span>
                          </div>

                          {/* Bottom Face */}
                          <div 
                            className={`absolute left-0 right-0 border-t border-slate-700/50 opacity-20`}
                            style={{ 
                              height: `${dHalf * 2}px`,
                              bottom: `-${dHalf}px`,
                              transform: `rotateX(-90deg) translateZ(${hHalf}px)`,
                              backfaceVisibility: 'hidden'
                            }}
                          />

                          {/* Sub-label for actions */}
                          {(isSwapping || isComparing || isHighlighted) && (
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 z-20 transition-all duration-300 border bg-slate-900/90"
                              style={{ 
                                bottom: `-${dHalf + 24}px`,
                                transform: `translateZ(${dHalf + 10}px)`,
                                borderColor: isSwapping ? '#ef4444' : isComparing ? '#f59e0b' : '#a855f7',
                                color: isSwapping ? '#fca5a5' : isComparing ? '#fde047' : '#e9d5ff'
                              }}
                            >
                              {isSwapping ? (
                                <>
                                  <ArrowRightLeft className="w-2.5 h-2.5 animate-spin text-rose-400" />
                                  <span>Swapping</span>
                                </>
                              ) : isComparing ? (
                                <>
                                  <Sliders className="w-2.5 h-2.5 text-amber-400 animate-bounce" />
                                  <span>Comparing</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                  <span>Active</span>
                                </>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Step Explanation Bubbles */}
            <div id="step-explanation" className="max-w-2xl w-full px-6 py-4 bg-[#111827]/95 rounded-2xl border border-slate-800 shadow-2xl relative z-10 mx-auto transform hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  activeStepType === "swap" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                  activeStepType === "compare" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  activeStepType === "complete" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                }`}>
                  {activeStepType === "swap" ? (
                    <ArrowRightLeft className="w-5 h-5 animate-pulse" />
                  ) : activeStepType === "compare" ? (
                    <Sliders className="w-5 h-5" />
                  ) : activeStepType === "complete" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                    <span>Step {currentStepIndex + 1} of {steps.length || 1}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      activeStepType === "swap" ? "bg-rose-500/20 text-rose-300" :
                      activeStepType === "compare" ? "bg-amber-500/20 text-amber-300" :
                      activeStepType === "complete" ? "bg-emerald-500/20 text-emerald-300" :
                      "bg-indigo-500/20 text-indigo-300"
                    }`}>
                      {activeStepType}
                    </span>
                  </h3>
                  <p id="step-explanation-text" className="text-slate-300 text-sm mt-1 leading-relaxed">
                    {currentStepData?.explanation || "Algorithm ready. Click 'Run' or 'Step' to begin the step-by-step 3D visual journey."}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Execution Log & Terminal Panel */}
          <div id="execution-logs" className="h-44 border-t border-slate-800 bg-[#070B11] p-4 font-mono text-xs flex flex-col shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2 shrink-0">
              <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span>Execution Trace Log</span>
              </div>
              <button 
                id="btn-clear-logs"
                onClick={() => setLogs([`[SYSTEM] Log cleared. Ready for next run.`])}
                className="text-[9px] hover:text-white text-slate-500 transition-colors uppercase tracking-wider font-bold"
              >
                Clear Log
              </button>
            </div>
            
            <div 
              ref={logContainerRef}
              className="flex-1 overflow-y-auto space-y-1.5 pr-2"
            >
              {logs.map((log, index) => {
                let colorClass = "text-slate-400";
                if (log.startsWith("[SYSTEM]")) colorClass = "text-indigo-400/90 font-medium";
                else if (log.startsWith("[AI ENGINE]")) colorClass = "text-cyan-400 font-semibold";
                else if (log.startsWith("[AI ERROR]")) colorClass = "text-rose-400 font-semibold";
                else if (log.includes("swap") || log.includes("Swap")) colorClass = "text-rose-300";
                else if (log.includes("Compare") || log.includes("compare")) colorClass = "text-amber-200";
                else if (log.includes("sorted") || log.includes("Sorted") || log.includes("complete")) colorClass = "text-emerald-400";

                return (
                  <div key={index} className={`leading-relaxed select-text flex items-start gap-1.5 ${colorClass}`}>
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                    <span>{log}</span>
                  </div>
                );
              })}
              
              {isPlaying && (
                <div className="flex items-center gap-1 text-slate-500 animate-pulse mt-1 pl-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animation-delay-200"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animation-delay-400"></span>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Stats & Metadata Bar */}
      <footer id="app-footer" className="h-10 bg-[#1E293B] border-t border-slate-800 px-6 flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-widest shrink-0">
        <div className="flex gap-6">
          <span>Time Complexity: <span className="text-slate-400 lowercase font-mono font-bold">{algorithmInfo.timeComplexity}</span></span>
          <span className="hidden sm:inline">Space Complexity: <span className="text-slate-400 lowercase font-mono font-bold">{algorithmInfo.spaceComplexity}</span></span>
        </div>
        <div className="text-slate-400 tracking-normal font-sans italic max-w-sm truncate hidden md:inline">
          {algorithmInfo.summary}
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
            AI Studio Live
          </span>
          <span>MEM: ~4.5MB</span>
        </div>
      </footer>

    </div>
  );
}
