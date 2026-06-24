import React from 'react';
import { useCPUStore } from '../../store/cpuStore';
import { examplePrograms } from '../../utils/examples';

export function ExamplePrograms() {
  const { setSourceCode } = useCPUStore();

  return (
    <div className="flex gap-2">
      <select 
        className="bg-[#131520] border border-[var(--color-border-subtle)] text-xs text-gray-300 rounded px-2 py-1 outline-none focus:border-[var(--color-brand-teal)]"
        onChange={(e) => {
          if (e.target.value) {
            const program = examplePrograms.find(p => p.id === e.target.value);
            if (program) setSourceCode(program.code);
          }
        }}
        defaultValue=""
      >
        <option value="" disabled>Load Example...</option>
        {examplePrograms.map(prog => (
          <option key={prog.id} value={prog.id}>{prog.title}</option>
        ))}
      </select>
    </div>
  );
}
