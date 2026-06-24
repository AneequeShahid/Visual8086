import React from 'react';
import { motion } from 'framer-motion';

interface DataFlowArrowProps {
  id: string;
  path: string;
  isActive: boolean;
  color?: string;
  isBus?: boolean;   // wider highway-style bus
  reverse?: boolean; // flip the particle direction
}

export function DataFlowArrow({
  id,
  path,
  isActive,
  color = '#22d3ee',
  isBus = false,
  reverse = false,
}: DataFlowArrowProps) {
  const trackW   = isBus ? 4 : 2;
  const activeW  = isBus ? 6 : 3;
  const glowW    = isBus ? 16 : 10;
  const dashLen  = isBus ? 30 : 18;
  const gapLen   = isBus ? 50 : 40;
  const speed    = isBus ? 0.9 : 0.7;

  // parse a unique filter id per arrow
  const filterId   = `glow-${id}`;
  const maskId     = `mask-${id}`;
  const gradId     = `grad-${id}`;

  return (
    <g>
      {/* ── defs ── */}
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isBus ? 4 : 2.5} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* ── track (always visible, very dim) ── */}
      <path
        d={path}
        fill="none"
        stroke="#2a2d3e"
        strokeWidth={trackW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── active layers ── */}
      {isActive && (
        <>
          {/* outer bloom */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={glowW}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.08}
          />

          {/* solid coloured line */}
          <motion.path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={activeW}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 0 ${isBus ? 8 : 5}px ${color})` }}
          />

          {/* first particle stream */}
          <motion.path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={activeW + 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${dashLen} ${gapLen}`}
            initial={{ strokeDashoffset: reverse ? -(dashLen + gapLen) : dashLen + gapLen }}
            animate={{ strokeDashoffset: reverse ? dashLen + gapLen : -(dashLen + gapLen) }}
            transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
            style={{ filter: `url(#${filterId})` }}
          />

          {/* second stream (phase offset) */}
          <motion.path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={activeW - 1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${Math.round(dashLen * 0.6)} ${gapLen + 20}`}
            initial={{ strokeDashoffset: reverse ? -(dashLen + gapLen) * 0.5 : (dashLen + gapLen) * 0.5 }}
            animate={{ strokeDashoffset: reverse ? (dashLen + gapLen) * 0.5 : -(dashLen + gapLen) * 0.5 }}
            transition={{ duration: speed * 1.3, ease: 'linear', repeat: Infinity }}
            opacity={0.6}
          />
        </>
      )}
    </g>
  );
}
