export interface ArrayElement {
  id: string;
  value: number;
}

export type StepType = "compare" | "swap" | "shift" | "write" | "highlight" | "complete";

export interface TraceStep {
  type: StepType;
  indices: number[];
  values?: number[];
  arrayState: number[];
  explanation: string;
}

export interface AlgorithmInfo {
  name: string;
  timeComplexity: string;
  spaceComplexity: string;
  summary: string;
}

export interface PresetAlgorithm {
  id: string;
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  codeTemplates: {
    python: string;
    java: string;
    c: string;
  };
  generateSteps: (arr: number[]) => TraceStep[];
}
