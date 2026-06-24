import React from 'react';
import { useCPUStore } from '../../store/cpuStore';
import { RegisterCard } from './RegisterCard';
import { FlagPanel } from './FlagPanel';
import { Register } from '../../engine/types';

export function RegisterPanel() {
  const { history, currentStepIndex } = useCPUStore();
  
  const currentSnapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const prevSnapshot = currentStepIndex > 0 ? history[currentStepIndex - 1] : null;

  const registers = currentSnapshot ? currentSnapshot.state.registers : {
    [Register.AX]: 0, [Register.BX]: 0, [Register.CX]: 0, [Register.DX]: 0,
    [Register.SP]: 0, [Register.IP]: 0
  };

  const oldRegisters = prevSnapshot ? prevSnapshot.state.registers : registers;

  return (
    <div className="flex flex-col h-full gap-2 overflow-auto">
      <div className="grid grid-cols-2 gap-2">
        <RegisterCard name="AX" value={registers[Register.AX]} oldValue={oldRegisters[Register.AX]} />
        <RegisterCard name="BX" value={registers[Register.BX]} oldValue={oldRegisters[Register.BX]} />
        <RegisterCard name="CX" value={registers[Register.CX]} oldValue={oldRegisters[Register.CX]} />
        <RegisterCard name="DX" value={registers[Register.DX]} oldValue={oldRegisters[Register.DX]} />
      </div>
      <div className="mt-2 text-xs text-gray-500 uppercase tracking-widest border-b border-[var(--color-border-subtle)] pb-1 mb-1">
        Pointers
      </div>
      <div className="grid grid-cols-2 gap-2">
        <RegisterCard name="SP" value={registers[Register.SP]} oldValue={oldRegisters[Register.SP]} />
        <RegisterCard name="IP" value={registers[Register.IP]} oldValue={oldRegisters[Register.IP]} />
      </div>
      
      <FlagPanel />
    </div>
  );
}
