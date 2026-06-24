import React, { useEffect, useRef } from 'react';
import { Play, Pause, StepForward, SkipBack, RotateCcw } from 'lucide-react';
import { useCPUStore } from '../../store/cpuStore';
import { useAnimationStore } from '../../store/animationStore';
import { CycleStage } from '../../engine/types';

export function ControlBar() {
  const { compile, step, reset, play, pause, isRunning, isPaused, stepBack, history, currentStepIndex, animationSpeed, setAnimationSpeed, instructions } = useCPUStore();
  const { setCurrentCycle, setActivePaths, setActiveComponents, setIsAnimating } = useAnimationStore();
  
  const isExecutingRef = useRef(false);

  const executeMicroSteps = async () => {
    if (isExecutingRef.current) return;
    
    // Check if program is finished before executing micro steps
    const { history: currentHistory, currentStepIndex: index, instructions: currentInsts } = useCPUStore.getState();
    const currentSnapshot = currentHistory[index];
    if (currentSnapshot) {
      const currentIP = currentSnapshot.state.registers['IP'];
      if (!currentInsts.some(i => i.address === currentIP)) {
        return;
      }
    }

    isExecutingRef.current = true;
    setIsAnimating(true);
    
    // We want the total animation to take animationSpeed time, split among 4 stages, and then split among substeps
    const stageDelay = animationSpeed / 4;
    
    // Helper to animate substeps
    const animateSubsteps = async (stage: CycleStage, numSteps: number, components: any[], paths: string[]) => {
      setCurrentCycle(stage);
      setActiveComponents(components);
      setActivePaths(paths);
      
      const stepDelay = stageDelay / numSteps;
      for (let i = 0; i < numSteps; i++) {
        useAnimationStore.getState().setCurrentSubStep(i);
        await new Promise(r => setTimeout(r, stepDelay));
      }
    };

    // FETCH (4 substeps)
    await animateSubsteps(
      CycleStage.FETCH, 4,
      ['PC', 'MAR', 'MEM', 'MDR', 'IR'],
      ['PC_MAR', 'MAR_MEM', 'MEM_MDR', 'MDR_IR']
    );

    // DECODE (3 substeps)
    await animateSubsteps(
      CycleStage.DECODE, 3,
      ['IR', 'CU', 'ALU', 'REGS'],
      ['IR_CU', 'CU_ALL']
    );

    // EXECUTE (3 substeps)
    await animateSubsteps(
      CycleStage.EXECUTE, 3,
      ['CU', 'ALU', 'REGS'],
      ['CU_ALU', 'REGS_ALU']
    );

    // WRITEBACK (2 substeps)
    await animateSubsteps(
      CycleStage.WRITEBACK, 2,
      ['ALU', 'REGS'],
      ['ALU_REGS']
    );
    
    // Commit the state change
    step();
    
    // IDLE
    setCurrentCycle(CycleStage.IDLE);
    setActiveComponents([]);
    setActivePaths([]);
    setIsAnimating(false);
    useAnimationStore.getState().setCurrentSubStep(0);
    isExecutingRef.current = false;
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const loop = async () => {
      if (isRunning && !isPaused && !isExecutingRef.current) {
        const { history: currentHistory, currentStepIndex: index, instructions: currentInsts } = useCPUStore.getState();
        const currentSnapshot = currentHistory[index];
        if (currentSnapshot) {
          const currentIP = currentSnapshot.state.registers['IP'];
          if (!currentInsts.some(i => i.address === currentIP)) {
            useCPUStore.setState({ isRunning: false, isPaused: false });
            return;
          }
        }
        await executeMicroSteps();
        // Schedule next after a tiny gap
        timeout = setTimeout(loop, 100);
      }
    };

    if (isRunning && !isPaused) {
      loop();
    }
    
    return () => clearTimeout(timeout);
  }, [isRunning, isPaused, animationSpeed]);

  const snapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const ip = snapshot ? snapshot.state.registers['IP'] : 0;
  const isFinished = history.length > 0 && instructions.length > 0 && !instructions.some(i => i.address === ip);

  const canStepBack = currentStepIndex > 0 && !isExecutingRef.current;
  const canStepForward = history.length > 0 && !isExecutingRef.current && !isFinished;

  return (
    <div className="flex items-center gap-4 p-2 bg-[#131520] border-t border-[var(--color-border-subtle)]">
      <button 
        onClick={compile}
        className="px-3 py-1.5 text-xs font-semibold text-white bg-[var(--color-brand-teal)] hover:bg-[var(--color-brand-cyan)] rounded flex items-center gap-1 transition-colors"
      >
        <RotateCcw size={14} /> Build & Reset
      </button>

      <div className="w-px h-6 bg-[var(--color-border-subtle)] mx-1"></div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => {
            if (isRunning) pause();
            else play();
          }}
          disabled={history.length === 0}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[var(--color-surface-panel)] rounded transition-colors disabled:opacity-50"
          title={isRunning && !isPaused ? "Pause" : "Auto Play"}
        >
          {isRunning && !isPaused ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button 
          onClick={() => {
            if (canStepBack) stepBack();
          }}
          disabled={!canStepBack}
          className="p-1.5 text-gray-300 hover:text-[var(--color-brand-teal)] hover:bg-[var(--color-surface-panel)] rounded transition-colors disabled:opacity-50"
          title="Step Backward"
        >
          <SkipBack size={18} />
        </button>

        <button 
          onClick={() => {
            if (canStepForward) executeMicroSteps();
          }}
          disabled={!canStepForward}
          className="p-1.5 text-[var(--color-brand-teal)] hover:text-[var(--color-brand-cyan)] hover:bg-[var(--color-surface-panel)] rounded transition-colors disabled:opacity-50"
          title="Step Forward"
        >
          <StepForward size={18} />
        </button>
      </div>

      <div className="w-px h-6 bg-[var(--color-border-subtle)] mx-1"></div>
      
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>Speed</span>
        <input 
          type="range" 
          min="200" max="3000" step="100"
          value={3200 - animationSpeed} // Reverse so right is faster (smaller delay)
          onChange={(e) => setAnimationSpeed(3200 - parseInt(e.target.value))}
          className="w-24 accent-[var(--color-brand-teal)]"
        />
      </div>
    </div>
  );
}
