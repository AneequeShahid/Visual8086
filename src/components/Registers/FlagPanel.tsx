import React from 'react';
import { useCPUStore } from '../../store/cpuStore';
import { Flag } from '../../engine/types';
import { motion } from 'framer-motion';

export function FlagPanel() {
  const { history, currentStepIndex } = useCPUStore();
  
  const currentSnapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const prevSnapshot = currentStepIndex > 0 ? history[currentStepIndex - 1] : null;

  const flags = currentSnapshot ? currentSnapshot.state.flags : {
    [Flag.ZF]: false, [Flag.CF]: false, [Flag.SF]: false, [Flag.OF]: false,
    [Flag.PF]: false, [Flag.DF]: false, [Flag.IF]: false, [Flag.TF]: false
  };

  const oldFlags = prevSnapshot ? prevSnapshot.state.flags : flags;

  const flagList = [Flag.ZF, Flag.CF, Flag.SF, Flag.OF, Flag.PF]; // Simplified set

  return (
    <div className="flex items-center gap-4 mt-4 border-t border-[var(--color-border-subtle)] pt-4">
      {flagList.map((flag) => {
        const val = flags[flag];
        const oldVal = oldFlags[flag];
        const isChanged = val !== oldVal;

        return (
          <div key={flag} className="flex flex-col items-center gap-1">
            <span className={`text-[10px] font-bold ${isChanged ? 'text-[var(--color-brand-amber)]' : 'text-gray-500'}`}>
              {flag}
            </span>
            <motion.div
              animate={{
                backgroundColor: val 
                  ? (isChanged ? 'var(--color-brand-amber)' : 'var(--color-brand-teal)')
                  : 'var(--color-surface-base)',
                borderColor: val 
                  ? (isChanged ? 'var(--color-brand-amber)' : 'var(--color-brand-teal)')
                  : 'var(--color-border-subtle)'
              }}
              className="w-3 h-3 rounded-full border"
              title={`${flag}: ${val ? '1' : '0'}`}
            />
          </div>
        );
      })}
    </div>
  );
}
