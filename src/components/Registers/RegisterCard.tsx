import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toHex, toSigned16 } from '../../utils/format';
import { useAnimationStore } from '../../store/animationStore';
import { CycleStage } from '../../engine/types';

interface RegisterCardProps {
  name: string;
  value: number;
  oldValue?: number;
}

export function RegisterCard({ name, value, oldValue }: RegisterCardProps) {
  const { currentCycle, isAnimating } = useAnimationStore();
  const isChanged = oldValue !== undefined && oldValue !== value;
  
  // Use Green during active writeback, otherwise Amber if changed
  const getHighlightColor = () => {
    if (isChanged) {
      if (isAnimating && currentCycle === CycleStage.WRITEBACK) return 'var(--color-phase-writeback)'; // Green
      return 'var(--color-brand-amber)'; // Amber for past changes
    }
    return 'var(--color-border-subtle)';
  };

  const highlightColor = getHighlightColor();
  const isHighlighted = isChanged;

  return (
    <div 
      className={`flex items-center justify-between p-2 rounded border transition-colors duration-300`}
      style={{
        borderColor: isHighlighted ? highlightColor : 'var(--color-border-subtle)',
        backgroundColor: isHighlighted ? 'var(--color-surface-panel)' : 'var(--color-surface-base)',
        boxShadow: isHighlighted ? `0 0 10px ${highlightColor}20` : 'none',
        opacity: isHighlighted ? 1 : 0.8
      }}
    >
      <span className="font-bold font-inter" style={{ color: isHighlighted ? highlightColor : 'var(--color-border-subtle)' }}>
        {name}
      </span>
      <div className="flex flex-col items-end">
        <div className="font-mono text-sm relative h-5 w-16 overflow-hidden flex justify-end">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
              className="absolute"
              style={{ color: isHighlighted ? highlightColor : 'var(--color-border-subtle)' }}
            >
              {toHex(value)}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="text-[10px] text-gray-500 font-mono mt-0.5">
          {toSigned16(value).toString().padStart(5, ' ')}
        </span>
      </div>
    </div>
  );
}
