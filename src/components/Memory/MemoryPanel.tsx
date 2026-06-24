import React, { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { useCPUStore } from '../../store/cpuStore';
import { toHex } from '../../utils/format';
import { StackVisualizerModal } from './StackVisualizerModal';

export function MemoryPanel() {
  const { history, currentStepIndex, instructions } = useCPUStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isStackModalOpen, setIsStackModalOpen] = useState(false);
  
  const currentSnapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const prevSnapshot = currentStepIndex > 0 ? history[currentStepIndex - 1] : null;

  const memory = currentSnapshot ? currentSnapshot.state.memory : {};
  const oldMemory = prevSnapshot ? prevSnapshot.state.memory : memory;
  const pc = currentSnapshot?.state.pc ?? 0;
  const sp = currentSnapshot?.state.registers['SP'] ?? 0x0200;
  
  // Extract Data Segment addresses: >= 0x0100, but exclude anything currently in the active stack
  const dataAddresses = Object.keys(memory)
    .map(Number)
    .filter(addr => addr >= 0x0100 && addr < sp)
    .sort((a, b) => a - b);

  // Stack grows downwards from 0x0200. We display words from SP up to 0x01FE.
  // E.g., if SP=0x01FC, we display 0x01FC and 0x01FE.
  const stackEntries = [];
  for (let addr = sp; addr < 0x0200; addr += 2) {
    stackEntries.push(addr);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStepIndex, memory]);

  return (
    <div className="flex flex-col h-full font-mono text-xs">
      <StackVisualizerModal isOpen={isStackModalOpen} onClose={() => setIsStackModalOpen(false)} />
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar pr-2 scroll-smooth"
      >
        
        {/* --- DATA SEGMENT --- */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-phase-decode)] border-b border-[var(--color-border-subtle)] pb-1 mb-2 font-bold flex justify-between">
            <span>DATA SEGMENT</span>
            <span>0x0100+</span>
          </div>
          {dataAddresses.map((addr) => {
            const val = memory[addr] || 0;
            const oldVal = oldMemory[addr] || 0;
            const isChanged = val !== oldVal;

            return (
              <div 
                key={`data-${addr}`} 
                className={`grid grid-cols-[3rem_1fr] gap-x-3 py-1 px-2 rounded
                  ${isChanged ? 'bg-[var(--color-phase-decode)] bg-opacity-20 text-[var(--color-brand-amber)] font-bold' : 'text-gray-300'}
                `}
              >
                <div className="text-gray-500">{toHex(addr)}</div>
                <div>{toHex(val)} <span className="text-gray-600 text-[10px] ml-2">({val})</span></div>
              </div>
            );
          })}
          {dataAddresses.length === 0 && (
            <div className="text-gray-600 italic px-2 py-1">No data allocated</div>
          )}
        </div>

        {/* --- STACK SEGMENT --- */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-phase-writeback)] border-b border-[var(--color-border-subtle)] pb-1 mb-2 mt-4 font-bold flex justify-between items-center">
            <div className="flex gap-2">
              <span>STACK SEGMENT</span>
              <span className="text-gray-500 font-normal">↓ Grows Down</span>
            </div>
            <button 
              onClick={() => setIsStackModalOpen(true)}
              className="flex items-center gap-1 bg-[var(--color-phase-writeback)]/20 hover:bg-[var(--color-phase-writeback)]/40 text-[var(--color-phase-writeback)] px-2 py-0.5 rounded transition-colors"
            >
              <Layers size={12} /> View Stack
            </button>
          </div>
          
          <div className="grid grid-cols-[3rem_3rem_1fr] gap-x-2 px-2 pb-1 text-[10px] text-gray-500">
            <div>ADDR</div>
            <div>BYTES</div>
            <div>WORD</div>
          </div>

          <div className="flex flex-col">
            {stackEntries.map((addr) => {
              const low = memory[addr] || 0;
              const high = memory[addr + 1] || 0;
              const word = (high << 8) | low;
              
              const oldLow = oldMemory[addr] || 0;
              const oldHigh = oldMemory[addr + 1] || 0;
              const oldWord = (oldHigh << 8) | oldLow;
              
              const isChanged = word !== oldWord;
              const isSP = addr === sp;

              return (
                <div 
                  key={`stack-${addr}`} 
                  className={`group relative grid grid-cols-[3rem_3rem_1fr] gap-x-2 py-1.5 px-2 rounded
                    ${isChanged ? 'bg-[var(--color-phase-writeback)] bg-opacity-20 text-[var(--color-brand-emerald)] font-bold' : 'text-gray-300'}
                    ${isSP ? 'border border-[var(--color-phase-writeback)]/30 bg-[var(--color-phase-writeback)]/10' : ''}
                  `}
                >
                  <div className="text-gray-500">{toHex(addr)}</div>
                  <div className="text-gray-400 tracking-widest">{low.toString(16).padStart(2, '0').toUpperCase()} {high.toString(16).padStart(2, '0').toUpperCase()}</div>
                  <div className="flex items-center gap-2 relative">
                    <span className="cursor-help" title={`High Byte: 0x${high.toString(16).padStart(2, '0').toUpperCase()}\nLow Byte:  0x${low.toString(16).padStart(2, '0').toUpperCase()}`}>
                      {toHex(word)}
                    </span>
                    {isSP && (
                      <span className="text-[var(--color-phase-writeback)] text-[10px] font-bold tracking-widest animate-pulse flex items-center gap-1">
                        &larr; SP
                      </span>
                    )}
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -top-8 -translate-x-1/2 bg-[#060810] border border-[var(--color-border-subtle)] p-2 rounded shadow-xl text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
                    <div className="text-gray-400 mb-1">WORD BREAKDOWN</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <span className="text-gray-500">High ({toHex(addr + 1, 4)})</span>
                      <span className="text-white">0x{high.toString(16).padStart(2, '0').toUpperCase()}</span>
                      <span className="text-gray-500">Low ({toHex(addr, 4)})</span>
                      <span className="text-white">0x{low.toString(16).padStart(2, '0').toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="grid grid-cols-[3rem_1fr] gap-x-2 py-1 px-2 rounded text-gray-600 border-t border-dashed border-gray-700/50 mt-1">
              <div>0x0200</div>
              <div className="italic text-[10px]">BOTTOM OF STACK</div>
            </div>
            
            {stackEntries.length === 0 && sp === 0x0200 && (
              <div className="flex items-center gap-2 py-1 px-2 mt-1">
                <span className="text-[var(--color-phase-writeback)] text-[10px] font-bold tracking-widest animate-pulse">&rarr; SP</span>
                <span className="text-gray-600 italic">Stack is empty</span>
              </div>
            )}
          </div>
        </div>

        {/* --- CODE SEGMENT --- */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-phase-fetch)] border-b border-[var(--color-border-subtle)] pb-1 mb-2 mt-4 font-bold flex justify-between">
            <span>CODE SEGMENT</span>
            <span>0x0000+</span>
          </div>
          {instructions.map((inst) => {
            const isPC = inst.address === pc;
            return (
              <div 
                key={`code-${inst.address}`} 
                className={`grid grid-cols-[3rem_1fr] gap-x-3 py-1 px-2 rounded
                  ${isPC ? 'bg-[var(--color-phase-fetch)] bg-opacity-20 border border-[var(--color-phase-fetch)] text-white' : 'text-gray-400'}
                `}
              >
                <div className="flex items-center gap-1">
                  {isPC && <span className="text-[var(--color-phase-fetch)] text-[10px]">&rarr;</span>}
                  {toHex(inst.address)}
                </div>
                <div className="truncate">{inst.originalText}</div>
              </div>
            );
          })}
          {instructions.length === 0 && (
            <div className="text-gray-600 italic px-2 py-1">No instructions loaded</div>
          )}
        </div>

      </div>
    </div>
  );
}
