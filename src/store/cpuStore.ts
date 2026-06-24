import { create } from 'zustand';
import { CPUEngine } from '../engine/cpu';
import { Parser } from '../engine/parser';
import { Instruction, ExecutionSnapshot, CycleStage } from '../engine/types';

interface CPUStore {
  engine: CPUEngine;
  sourceCode: string;
  instructions: Instruction[];
  labels: Record<string, number>;
  history: ExecutionSnapshot[];
  currentStepIndex: number;
  isRunning: boolean;
  isPaused: boolean;
  animationSpeed: number;
  errors: string[];
  
  // Actions
  setSourceCode: (code: string) => void;
  setAnimationSpeed: (speed: number) => void;
  compile: () => void;
  step: () => void;
  stepBack: () => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
}

export const useCPUStore = create<CPUStore>((set, get) => ({
  engine: new CPUEngine(),
  sourceCode: '',
  instructions: [],
  labels: {},
  history: [],
  currentStepIndex: -1,
  isRunning: false,
  isPaused: false,
  animationSpeed: 1000,
  errors: [],

  setSourceCode: (code) => set({ sourceCode: code }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

  compile: () => {
    const { sourceCode, engine } = get();
    try {
      const { instructions, dataSegment, labels } = Parser.parse(sourceCode);
      
      // Second pass to resolve labels in operands (both jumps and memory access)
      const resolvedInstructions = instructions.map(inst => {
        const newOperands = inst.operands.map(op => {
          let resolvedOp = op;
          // Sort labels by length descending to prevent partial replacements (e.g. arr vs arr2)
          const sortedLabels = Object.keys(labels).sort((a, b) => b.length - a.length);
          for (const label of sortedLabels) {
            // Replace the label if it's a whole word or inside brackets
            const regex = new RegExp(`\\b${label}\\b`, 'gi');
            resolvedOp = resolvedOp.replace(regex, labels[label].toString());
          }
          return resolvedOp;
        });
        return { ...inst, operands: newOperands };
      });

      engine.reset();
      engine.setMemory(dataSegment); // Need to add this to cpu.ts
      
      // Save initial state snapshot
      const initialState: ExecutionSnapshot = {
        state: engine.getState(),
        instruction: { opcode: 'INIT', operands: [], lineNumber: 0, originalText: '', address: 0, size: 0 },
        cycleStage: CycleStage.IDLE
      };

      set({
        instructions: resolvedInstructions,
        labels,
        errors: [],
        history: [initialState],
        currentStepIndex: 0,
        isRunning: false,
        isPaused: false
      });
    } catch (e: any) {
      set({ errors: [e.message] });
    }
  },

  step: () => {
    const { engine, instructions, history, currentStepIndex } = get();
    const currentState = engine.getState();
    const pc = currentState.pc;
    
    const inst = instructions.find(i => i.address === pc);
    
    if (!inst) {
      set({ isRunning: false, isPaused: false });
      return; // Program ended or jumped out of bounds
    }
    
    try {
      engine.executeInstruction(inst);
      
      const newSnapshot: ExecutionSnapshot = {
        state: engine.getState(),
        instruction: inst,
        cycleStage: CycleStage.WRITEBACK // Simplified: skipping inner stages for now
      };

      const newHistory = [...history.slice(0, currentStepIndex + 1), newSnapshot];
      
      set({
        history: newHistory,
        currentStepIndex: currentStepIndex + 1,
        errors: []
      });
    } catch (e: any) {
      set({ errors: [`Runtime error at line ${inst.lineNumber}: ${e.message}`], isRunning: false });
    }
  },

  stepBack: () => {
    const { currentStepIndex, history, engine } = get();
    if (currentStepIndex > 0) {
      const prevSnapshot = history[currentStepIndex - 1];
      engine.reset();
      engine.setRegisters(prevSnapshot.state.registers);
      // We also need to restore memory and flags in a full implementation
      // For now, simple object assignment (need to add restoreState to CPUEngine in a robust way)
      Object.assign(engine.getState(), prevSnapshot.state); 
      
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  reset: () => {
    const { compile } = get();
    compile();
  },

  play: () => set({ isRunning: true, isPaused: false }),
  pause: () => set({ isPaused: true }),
}));
