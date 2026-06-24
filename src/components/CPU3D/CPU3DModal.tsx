import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Play, Pause, StepForward, SkipForward, ChevronRight } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useAnimationStore } from '../../store/animationStore';
import { useCPUStore } from '../../store/cpuStore';
import { CycleStage } from '../../engine/types';
import { CPU3DScene } from './CPU3DScene';
import { toHex } from '../../utils/format';

const STAGES = ['FETCH', 'DECODE', 'EXECUTE', 'WRITEBACK'] as const;

const getStageDescriptions = (
  stage: string,
  pcHex: string,
  instStr: string,
  opc: string,
  operands: string[]
): string[] => {
  switch (stage) {
    case 'FETCH':
      return [
        `PC (${pcHex}) value is copied to MAR (Memory Address Register)`,
        `MAR (${pcHex}) sends address to Memory via the address bus`,
        `Memory returns instruction data for "${instStr}" to MDR`,
        `MDR transfers instruction to IR (Instruction Register)`,
      ];
    case 'DECODE':
      return [
        `IR sends opcode "${opc}" to the Control Unit`,
        `Control Unit decodes the opcode "${opc}" and identifies the operation`,
        `Control Unit generates control signals for ALU and Registers`,
      ];
    case 'EXECUTE':
      return [
        `Control Unit signals ALU with the operation type for "${opc}"`,
        operands.length > 0 
          ? `Operands (${operands.join(', ')}) are read and sent via data bus` 
          : `No operands to read for this instruction`,
        `ALU/Control performs the computation and updates status flags`,
      ];
    case 'WRITEBACK':
      return [
        `Result is placed on the data bus`,
        `Result is written back to the destination ${operands[0] ? `(${operands[0]})` : ''}`,
      ];
    default:
      return [];
  }
};

const STAGE_COLORS: Record<string, string> = {
  FETCH:     '#3b82f6',
  DECODE:    '#a855f7',
  EXECUTE:   '#f97316',
  WRITEBACK: '#10b981',
  IDLE:      '#334155',
};

export function CPU3DModal() {
  const { is3DModalOpen, setIs3DModalOpen } = useAnimationStore();
  const { history, currentStepIndex, instructions, step: cpuStep } = useCPUStore();

  // ── Internal pipeline state (independent from main ControlBar) ──
  const [pipelineStageIdx, setPipelineStageIdx] = useState(-1); // -1 = idle, 0-3 = stages
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Current snapshot info
  const snapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const pc = snapshot?.state.pc ?? 0;
  const currentInst = instructions.find(i => i.address === pc);
  const instructionText = currentInst ? currentInst.originalText.split(';')[0].trim() : '—';

  const ip = snapshot ? snapshot.state.registers['IP'] : 0;
  const isFinished = history.length > 0 && instructions.length > 0 && !instructions.some(i => i.address === ip);

  // Current stage string for 3D scene
  const currentStageStr = pipelineStageIdx >= 0 && pipelineStageIdx < 4 ? STAGES[pipelineStageIdx] : 'IDLE';

  // ── Next Phase ──
  const nextPhase = useCallback(() => {
    if (isFinished && pipelineStageIdx === -1) return;

    if (pipelineStageIdx < 3) {
      // Advance to next pipeline stage
      setPipelineStageIdx(prev => prev + 1);
    } else {
      // We finished WRITEBACK -> commit the CPU step and reset pipeline
      cpuStep();
      setPipelineStageIdx(-1);
    }
  }, [pipelineStageIdx, cpuStep, isFinished]);

  // ── Skip to next instruction (run all 4 phases instantly) ──
  const skipToNext = useCallback(() => {
    if (isFinished) return;
    cpuStep();
    setPipelineStageIdx(-1);
  }, [cpuStep, isFinished]);

  // ── Auto-play toggle ──
  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  useEffect(() => {
    if (isAutoPlaying && !isFinished) {
      autoPlayRef.current = setInterval(() => {
        // Check if finished inside the interval
        const { history: h, currentStepIndex: idx, instructions: insts } = useCPUStore.getState();
        const snap = idx >= 0 ? h[idx] : null;
        const currentIP = snap ? snap.state.registers['IP'] : 0;
        if (h.length > 0 && insts.length > 0 && !insts.some(i => i.address === currentIP)) {
          setIsAutoPlaying(false);
          return;
        }
        // Advance one phase
        setPipelineStageIdx(prev => {
          if (prev < 3) return prev + 1;
          // Commit step
          useCPUStore.getState().step();
          return -1;
        });
      }, 1200);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, isFinished]);

  // Reset pipeline when modal closes
  useEffect(() => {
    if (!is3DModalOpen) {
      setPipelineStageIdx(-1);
      setIsAutoPlaying(false);
    }
  }, [is3DModalOpen]);

  if (!is3DModalOpen) return null;

  const stageColor = STAGE_COLORS[currentStageStr] || STAGE_COLORS.IDLE;
  const pcHex = toHex(pc);
  const opc = currentInst?.opcode || 'UNKNOWN';
  const operands = currentInst?.operands || [];
  const stageDescriptions = getStageDescriptions(currentStageStr, pcHex, instructionText, opc, operands);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex flex-col bg-[#060810]"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0c1020] shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Cpu className="text-cyan-400" size={20} />
            <h2 className="text-base font-bold tracking-[0.2em] text-white uppercase font-mono">
              3D Pipeline View
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Instruction display */}
            <div className="px-4 py-1.5 bg-white/5 rounded-lg border border-white/10 font-mono text-sm">
              <span className="text-gray-500 mr-2">PC: {toHex(pc)}</span>
              <span className="text-white font-bold">{instructionText}</span>
            </div>

            {/* Status badge */}
            {isFinished ? (
              <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Complete
              </div>
            ) : (
              <div 
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                style={{ 
                  color: stageColor, 
                  borderColor: `${stageColor}40`,
                  backgroundColor: `${stageColor}15`,
                }}
              >
                {currentStageStr}
              </div>
            )}
            
            <button 
              onClick={() => setIs3DModalOpen(false)}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex min-h-0">
          
          {/* 3D Canvas */}
          <div className="flex-1 relative">
            <Canvas camera={{ position: [0, 10, 16], fov: 42 }}>
              <CPU3DScene currentStage={currentStageStr} />
            </Canvas>
          </div>

          {/* ── RIGHT SIDEBAR: Phase Detail ── */}
          <div className="w-80 border-l border-white/10 bg-[#0a0e18] flex flex-col shrink-0">
            
            {/* Pipeline stages progress */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3">Pipeline Stages</h3>
              <div className="flex gap-2">
                {STAGES.map((stage, idx) => {
                  const isCurrent = pipelineStageIdx === idx;
                  const isDone = pipelineStageIdx > idx;
                  const color = STAGE_COLORS[stage];
                  return (
                    <div 
                      key={stage} 
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <div 
                        className="w-full h-1.5 rounded-full transition-all duration-500"
                        style={{ 
                          backgroundColor: isDone ? color : isCurrent ? color : '#1e293b',
                          opacity: isDone ? 0.6 : isCurrent ? 1 : 0.3,
                          boxShadow: isCurrent ? `0 0 10px ${color}` : 'none',
                        }}
                      />
                      <span 
                        className="text-[9px] font-mono font-bold tracking-wider"
                        style={{ color: isCurrent ? color : isDone ? `${color}99` : '#475569' }}
                      >
                        {stage.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage description */}
            <div className="flex-1 overflow-y-auto p-4">
              {pipelineStageIdx === -1 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <ChevronRight size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-mono">Ready to step</p>
                    <p className="text-gray-600 text-xs mt-1">Press "Next Phase" to begin the fetch cycle</p>
                  </div>
                </div>
              ) : (
                <motion.div
                  key={currentStageStr}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 
                    className="text-lg font-bold font-mono tracking-wider mb-4"
                    style={{ color: stageColor }}
                  >
                    {currentStageStr}
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {stageDescriptions.map((desc, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                          style={{ 
                            backgroundColor: `${stageColor}20`, 
                            color: stageColor,
                            border: `1px solid ${stageColor}40`,
                          }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed font-mono">{desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Register snapshot */}
                  {snapshot && (
                    <div className="mt-6 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Register Snapshot</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        {Object.entries(snapshot.state.registers).map(([reg, val]) => (
                          <div key={reg} className="flex justify-between text-gray-400">
                            <span className="text-gray-600">{reg}</span>
                            <span>{toHex(val as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* ── CONTROLS ── */}
            <div className="p-4 border-t border-white/10 bg-[#0c1020] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {/* Auto-play */}
                <button
                  onClick={toggleAutoPlay}
                  disabled={isFinished}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30"
                  style={{
                    backgroundColor: isAutoPlaying ? `${STAGE_COLORS.FETCH}20` : 'rgba(255,255,255,0.05)',
                    color: isAutoPlaying ? STAGE_COLORS.FETCH : '#94a3b8',
                    border: `1px solid ${isAutoPlaying ? `${STAGE_COLORS.FETCH}40` : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isAutoPlaying ? 'Pause' : 'Auto Play'}
                </button>

                {/* Next Phase */}
                <button
                  onClick={nextPhase}
                  disabled={isFinished || isAutoPlaying}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30"
                  style={{
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    color: '#22d3ee',
                    border: '1px solid rgba(34, 211, 238, 0.25)',
                  }}
                >
                  <StepForward size={14} />
                  Next Phase
                </button>
              </div>

              {/* Skip to next instruction */}
              <button
                onClick={skipToNext}
                disabled={isFinished || isAutoPlaying}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-gray-500 hover:text-gray-300 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all disabled:opacity-30"
              >
                <SkipForward size={12} />
                Skip to Next Instruction
              </button>
            </div>
          </div>
        </div>

        {/* ── LEGEND (bottom-left overlay) ── */}
        <div className="absolute bottom-4 left-4 flex gap-4 p-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg pointer-events-none z-10">
          {STAGES.map((stage) => (
            <div key={stage} className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage], boxShadow: `0 0 6px ${STAGE_COLORS[stage]}` }} />
              {stage}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
