import React from 'react';
import { useCPUStore } from '../../store/cpuStore';
import { Register } from '../../engine/types';
import { toSigned16, toHex } from '../../utils/format';
import { Play } from 'lucide-react';

export function ExecutionTimeline() {
  const { history, currentStepIndex, setStepIndex } = useCPUStore();

  const handleJump = (index: number) => {
    setStepIndex(index);
  };

  return (
    <div className="h-full overflow-x-auto flex items-stretch gap-4 p-2 custom-scrollbar">
      {history.map((snapshot, index) => {
        const isCurrent = index === currentStepIndex;
        const isPast = index < currentStepIndex;
        const prevSnapshot = index > 0 ? history[index - 1] : null;

        // Find diffs
        const changedRegs = [];
        if (prevSnapshot) {
          for (const reg of Object.values(Register)) {
            if (snapshot.state.registers[reg] !== prevSnapshot.state.registers[reg]) {
              changedRegs.push(reg);
            }
          }
        }

        const opcode = snapshot.instruction.opcode;
        const isPush = opcode === 'PUSH';
        const isPop = opcode === 'POP';

        return (
          <div 
            key={index}
            onClick={() => handleJump(index)}
            className={`flex-shrink-0 w-56 rounded-lg border p-3 flex flex-col gap-2 transition-all cursor-pointer group
              ${isCurrent 
                ? 'border-[var(--color-phase-execute)] bg-[var(--color-surface-panel)] shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-phase-execute)]'
              }
              ${isPast ? 'opacity-80' : ''}
              ${!isCurrent && !isPast ? 'opacity-30' : ''}
            `}
          >
            <div className="flex justify-between items-center text-xs">
              <span className={`font-mono ${isCurrent ? 'text-[var(--color-phase-execute)]' : 'text-gray-500'}`}>
                {prevSnapshot 
                  ? `PC: ${toHex(prevSnapshot.state.pc)} \u2192 ${toHex(snapshot.state.pc)}`
                  : `PC: ${toHex(snapshot.state.pc)}`
                }
              </span>
              {isCurrent && (
                <span className="flex items-center gap-1 text-[var(--color-phase-execute)] font-bold text-[10px] uppercase tracking-wider animate-pulse">
                  <Play size={10} /> Active
                </span>
              )}
            </div>
            
            <div className="font-mono text-[15px] font-bold text-[var(--foreground)] truncate bg-[#0f1117] p-2 rounded border border-[var(--color-border-subtle)]">
              {snapshot.instruction.originalText || 'INIT'}
            </div>
            
            <div className="flex-1 flex flex-col justify-end">
              {isPush && prevSnapshot && (
                <div className="text-xs text-[var(--color-brand-emerald)] font-mono border-t border-[var(--color-border-subtle)] pt-2 mt-2">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Stack Push</div>
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>SP</span>
                    <span>{toHex(prevSnapshot.state.registers[Register.SP])} &rarr; {toHex(snapshot.state.registers[Register.SP])}</span>
                  </div>
                  <div className="bg-[#0f1117] p-1.5 rounded border border-[var(--color-brand-emerald)]/30">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Word</span>
                      <span>{toHex((snapshot.state.memory[snapshot.state.registers[Register.SP] + 1] << 8) | snapshot.state.memory[snapshot.state.registers[Register.SP]])}</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-gray-500">Bytes</span>
                      <span>{snapshot.state.memory[snapshot.state.registers[Register.SP]].toString(16).padStart(2, '0').toUpperCase()} {snapshot.state.memory[snapshot.state.registers[Register.SP] + 1].toString(16).padStart(2, '0').toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}

              {isPop && prevSnapshot && (
                <div className="text-xs text-[var(--color-brand-amber)] font-mono border-t border-[var(--color-border-subtle)] pt-2 mt-2">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Stack Pop</div>
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>SP</span>
                    <span>{toHex(prevSnapshot.state.registers[Register.SP])} &rarr; {toHex(snapshot.state.registers[Register.SP])}</span>
                  </div>
                  <div className="bg-[#0f1117] p-1.5 rounded border border-[var(--color-brand-amber)]/30">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Loaded</span>
                      <span>{toHex((prevSnapshot.state.memory[prevSnapshot.state.registers[Register.SP] + 1] << 8) | prevSnapshot.state.memory[prevSnapshot.state.registers[Register.SP]])}</span>
                    </div>
                  </div>
                </div>
              )}

              {changedRegs.length > 0 ? (
                <div className={`text-xs font-mono pt-2 mt-2 ${isPush || isPop ? '' : 'border-t border-[var(--color-border-subtle)]'} text-[var(--color-phase-writeback)]`}>
                  <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Writes</div>
                  {changedRegs.filter(r => r !== Register.SP).map(reg => (
                    <div key={reg} className="flex justify-between">
                      <span>{reg}</span>
                      <span>{prevSnapshot ? toHex(prevSnapshot.state.registers[reg]) : '0x0000'} &rarr; {toHex(snapshot.state.registers[reg])}</span>
                    </div>
                  ))}
                  {changedRegs.filter(r => r !== Register.SP).length === 0 && (
                    <div className="text-gray-600 italic">No general registers written</div>
                  )}
                </div>
              ) : (
                !isPush && !isPop && (
                  <div className="text-xs text-gray-600 font-mono border-t border-[var(--color-border-subtle)] pt-2 mt-2 italic">
                    No state changes
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
