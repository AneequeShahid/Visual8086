import React, { useEffect, useRef } from 'react';
import { X, Play, Pause, StepForward, SkipBack, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCPUStore } from '../../store/cpuStore';
import { toHex } from '../../utils/format';

interface StackVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StackVisualizerModal({ isOpen, onClose }: StackVisualizerModalProps) {
  const { history, currentStepIndex, isRunning, isPaused, play, pause, stepBack, step, instructions } = useCPUStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to top whenever history changes to keep top of stack in view
      scrollRef.current.scrollTop = 0;
    }
  }, [currentStepIndex, isOpen]);

  if (!isOpen) return null;

  const currentSnapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const memory = currentSnapshot ? currentSnapshot.state.memory : {};
  const sp = currentSnapshot?.state.registers['SP'] ?? 0x0200;

  // Stack entries from SP up to 0x01FE
  const stackEntries = [];
  for (let addr = sp; addr < 0x0200; addr += 2) {
    stackEntries.push(addr);
  }

  // Reverse so newest (lowest address) is at the top of the UI
  // Wait, stack grows down. So address 0x01FE is first pushed, then 0x01FC.
  // 0x01FC is smaller, so it's "top" of the stack.
  // We want to visually display smallest addresses at the top.
  stackEntries.sort((a, b) => a - b);

  const ip = currentSnapshot ? currentSnapshot.state.registers['IP'] : 0;
  const isFinished = history.length > 0 && instructions.length > 0 && !instructions.some(i => i.address === ip);
  const canStepBack = currentStepIndex > 0;
  const canStepForward = history.length > 0 && !isFinished;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-[500px] bg-[#0b0d14] border border-[var(--color-border-subtle)] rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)] bg-[#131520]">
          <div className="flex items-center gap-2 text-white">
            <Layers className="text-[var(--color-brand-teal)]" size={20} />
            <h2 className="font-semibold">Interactive Stack Visualizer</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 flex gap-6 bg-[url('/grid.svg')] bg-center relative min-h-[400px]">
          {/* Main Stack Container */}
          <div className="flex-1 flex justify-center items-end relative">
            <div 
              ref={scrollRef}
              className="w-full max-w-[280px] h-full border-x-2 border-b-2 border-gray-700 rounded-b-xl flex flex-col justify-end p-2 pb-0 relative overflow-y-auto custom-scrollbar"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#131520]/50 pointer-events-none rounded-b-xl"></div>
              
              <AnimatePresence initial={false}>
                {stackEntries.map((addr) => {
                  const low = memory[addr] || 0;
                  const high = memory[addr + 1] || 0;
                  const word = (high << 8) | low;
                  const isTop = addr === sp;

                  return (
                    <motion.div
                      key={addr}
                      initial={{ opacity: 0, y: -50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                      className={`relative w-full mb-2 p-3 rounded-lg border-2 shadow-lg z-10 flex flex-col items-center
                        ${isTop 
                          ? 'bg-gradient-to-br from-[var(--color-brand-cyan)]/20 to-[var(--color-brand-teal)]/20 border-[var(--color-brand-teal)]' 
                          : 'bg-[#1a1d2d] border-gray-600'
                        }
                      `}
                    >
                      {isTop && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[var(--color-brand-teal)] font-bold text-xs animate-pulse"
                        >
                          SP &rarr;
                        </motion.div>
                      )}
                      <div className="text-[10px] text-gray-400 font-mono mb-1 w-full text-left">
                        {toHex(addr)}
                      </div>
                      <div className="text-xl font-mono font-bold text-white tracking-widest">
                        {toHex(word)}
                      </div>
                      <div className="flex justify-between w-full mt-2 text-[10px] font-mono text-gray-500 border-t border-gray-700 pt-1">
                        <span>HI: {toHex(high, 2)}</span>
                        <span>LO: {toHex(low, 2)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {stackEntries.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono italic">
                  Stack is empty
                </div>
              )}
            </div>
          </div>

          {/* Context Sidebar */}
          <div className="w-48 flex flex-col gap-4">
            <div className="bg-[#131520] p-4 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="text-xs text-gray-500 mb-1">Stack Pointer (SP)</div>
              <div className="text-lg font-mono font-bold text-[var(--color-brand-teal)]">
                {toHex(sp)}
              </div>
            </div>
            
            <div className="bg-[#131520] p-4 rounded-lg border border-[var(--color-border-subtle)] flex-1">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Current Instruction</div>
              <div className="font-mono text-sm text-white">
                {currentSnapshot?.instruction.originalText || 'INIT'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#131520] border-t border-[var(--color-border-subtle)] flex items-center justify-center gap-4">
          <button 
            onClick={() => {
              if (isRunning) pause();
              else play();
            }}
            disabled={history.length === 0}
            className="p-3 bg-[var(--color-surface-panel)] hover:bg-gray-700 text-white rounded-full transition-colors shadow-lg disabled:opacity-50"
            title={isRunning && !isPaused ? "Pause" : "Auto Play"}
          >
            {isRunning && !isPaused ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button 
            onClick={() => {
              if (canStepBack) stepBack();
            }}
            disabled={!canStepBack}
            className="p-3 bg-[var(--color-surface-panel)] hover:bg-gray-700 text-[var(--color-brand-amber)] rounded-full transition-colors shadow-lg disabled:opacity-50"
            title="Step Backward"
          >
            <SkipBack size={20} />
          </button>

          <button 
            onClick={() => {
              if (canStepForward) step();
            }}
            disabled={!canStepForward}
            className="p-3 bg-[var(--color-surface-panel)] hover:bg-gray-700 text-[var(--color-brand-teal)] rounded-full transition-colors shadow-lg disabled:opacity-50"
            title="Step Forward"
          >
            <StepForward size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
