import React from 'react';
import { motion } from 'framer-motion';

interface CPUComponentProps {
  id: string;
  name: string;
  subtitle?: string;     // e.g. "Program Counter"
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  secondValue?: string;  // second line of data
  isActive: boolean;
  color?: string;
  shape?: 'rect' | 'hexagon' | 'diamond'; // special chip shapes
}

export function CPUComponent({
  id,
  name,
  subtitle,
  x,
  y,
  width,
  height,
  value,
  secondValue,
  isActive,
  color = '#22d3ee',
  shape = 'rect',
}: CPUComponentProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const r  = Math.min(width, height) / 2 - 2;

  /* ---------- corner-notch rectangle clip path ---------- */
  const notch = 8;
  const rectPath = `
    M ${x + notch},${y}
    L ${x + width - notch},${y}
    L ${x + width},${y + notch}
    L ${x + width},${y + height - notch}
    L ${x + width - notch},${y + height}
    L ${x + notch},${y + height}
    L ${x},${y + height - notch}
    L ${x},${y + notch}
    Z
  `;

  /* ---------- hexagon path (ALU) ---------- */
  const hw = width / 2;
  const hh = height / 2;
  const hexPath = `
    M ${cx},${y}
    L ${x + width},${cy - hh * 0.4}
    L ${x + width},${cy + hh * 0.4}
    L ${cx},${y + height}
    L ${x},${cy + hh * 0.4}
    L ${x},${cy - hh * 0.4}
    Z
  `;

  const bodyPath = shape === 'hexagon' ? hexPath : rectPath;
  const glowBlur = isActive ? 10 : 3;

  return (
    <motion.g
      initial={false}
      animate={{ opacity: isActive ? 1 : 0.25 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── outer glow halo ── */}
      {isActive && (
        <motion.path
          d={bodyPath}
          fill="none"
          stroke={color}
          strokeWidth={12}
          opacity={0.15}
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── body fill ── */}
      <path
        d={bodyPath}
        fill={isActive ? `${color}12` : '#161922'}
        stroke={isActive ? color : '#2a2d3e'}
        strokeWidth={isActive ? 1.5 : 1}
      />

      {/* ── scanline overlay (cosmetic) ── */}
      {isActive && (
        <clipPath id={`clip-${id}`}>
          <path d={bodyPath} />
        </clipPath>
      )}
      {isActive && (
        <motion.rect
          x={x}
          width={width}
          height={height}
          fill="none"
          clipPath={`url(#clip-${id})`}
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
          }}
          animate={{ attrY: [y - height, y] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          opacity={0.4}
        />
      )}

      {/* ── corner accent dots ── */}
      {isActive && [
        [x + 3, y + 3],
        [x + width - 3, y + 3],
        [x + 3, y + height - 3],
        [x + width - 3, y + height - 3],
      ].map(([dx, dy], i) => (
        <motion.circle
          key={i}
          cx={dx}
          cy={dy}
          r={2}
          fill={color}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* ── LED activity dot ── */}
      <motion.circle
        cx={x + width - 10}
        cy={y + 10}
        r={3}
        fill={isActive ? color : '#2a2d3e'}
        animate={isActive ? { opacity: [1, 0.3, 1], r: [3, 4, 3] } : { opacity: 0.3 }}
        transition={{ duration: 0.8, repeat: Infinity }}
        style={isActive ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}
      />

      {/* ── component name ── */}
      <text
        x={cx}
        y={subtitle ? y + 22 : cy - (value ? 10 : 0)}
        textAnchor="middle"
        fill={isActive ? '#f1f5f9' : '#64748b'}
        fontSize={shape === 'hexagon' ? 14 : 13}
        fontWeight="800"
        fontFamily="Inter, sans-serif"
        letterSpacing="0.05em"
      >
        {name}
      </text>

      {/* ── subtitle ── */}
      {subtitle && (
        <text
          x={cx}
          y={y + 36}
          textAnchor="middle"
          fill={isActive ? `${color}cc` : '#475569'}
          fontSize={9}
          fontFamily="Inter, sans-serif"
          letterSpacing="0.08em"
        >
          {subtitle.toUpperCase()}
        </text>
      )}

      {/* ── value ── */}
      {value !== undefined && (
        <motion.text
          key={value}
          x={cx}
          y={subtitle ? y + height - 20 : cy + (value ? 18 : 0)}
          textAnchor="middle"
          fill={isActive ? color : '#f59e0b'}
          fontSize={value.length > 10 ? 10 : value.length > 7 ? 12 : 14}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          textLength={value.length * 8.5 > width - 12 ? width - 12 : undefined}
          lengthAdjust="spacingAndGlyphs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={isActive ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}
        >
          {value}
        </motion.text>
      )}

      {/* ── second value ── */}
      {secondValue !== undefined && (
        <text
          x={cx}
          y={y + height - 8}
          textAnchor="middle"
          fill={isActive ? `${color}dd` : '#475569'}
          fontSize={9}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          textLength={secondValue.length * 6.5 > width - 12 ? width - 12 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {secondValue}
        </text>
      )}
    </motion.g>
  );
}
