import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCPUStore } from '../../store/cpuStore';
import { useAnimationStore } from '../../store/animationStore';
import { CPUComponent } from './CPUComponent';
import { DataFlowArrow } from './DataFlowArrow';
import { toHex } from '../../utils/format';
import { CycleStage } from '../../engine/types';

/* ─────────────────────────────────────────────
   Color palette per cycle stage
───────────────────────────────────────────── */
const PHASE_COLORS: Record<string, string> = {
  [CycleStage.FETCH]: '#3b82f6',  // electric blue
  [CycleStage.DECODE]: '#a855f7',  // violet
  [CycleStage.EXECUTE]: '#f97316',  // fiery orange
  [CycleStage.WRITEBACK]: '#10b981',  // emerald
  [CycleStage.IDLE]: '#22d3ee',  // teal
};

const PHASE_LABELS: Record<string, string> = {
  [CycleStage.FETCH]: 'FETCH',
  [CycleStage.DECODE]: 'DECODE',
  [CycleStage.EXECUTE]: 'EXECUTE',
  [CycleStage.WRITEBACK]: 'WRITE-BACK',
  [CycleStage.IDLE]: 'IDLE',
};

const PHASE_DESC: Record<string, string> = {
  [CycleStage.FETCH]: 'PC → MAR → Memory → MDR → IR',
  [CycleStage.DECODE]: 'IR → Control Unit — opcode analysis',
  [CycleStage.EXECUTE]: 'CU → ALU computation + register reads',
  [CycleStage.WRITEBACK]: 'ALU result → Register file',
  [CycleStage.IDLE]: 'Awaiting instruction',
};

// Removed OscilloscopeStrip

/* ─────────────────────────────────────────────
   Floating data packet label on a path
───────────────────────────────────────────── */
function PathLabel({
  label,
  x,
  y,
  color,
}: {
  label: string;
  x: number;
  y: number;
  color: string;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.2 }}
    >
      <rect
        x={x - 22}
        y={y - 9}
        width={44}
        height={16}
        rx={4}
        fill="#0f1117"
        stroke={color}
        strokeWidth={1}
        opacity={0.9}
      />
      <text
        x={x}
        y={y + 3}
        textAnchor="middle"
        fill={color}
        fontSize={8}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
      >
        {label}
      </text>
    </motion.g>
  );
}

/* ─────────────────────────────────────────────
   Main CPUDiagram
───────────────────────────────────────────── */
export function CPUDiagram() {
  const { history, currentStepIndex, instructions } = useCPUStore();
  const { currentCycle, activeComponents, activePaths, isAnimating } = useAnimationStore();

  const snapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const state = snapshot?.state;
  const isExecuting = snapshot !== null;

  const color = PHASE_COLORS[currentCycle] ?? '#22d3ee';

  const currentCommand = state?.ir ? state.ir.split(';')[0].trim() : 'NOP';

  const getIRValue = () => {
    if (!state) return 'NOP';
    if (isAnimating) {
      const animatingInst = instructions.find(i => i.address === state.pc);
      if (animatingInst) {
        return animatingInst.originalText.split(';')[0].trim();
      }
    }
    return state.ir ? state.ir.split(';')[0].trim() : 'NOP';
  };

  /* ────── layout constants ────── */
  const VW = 960;
  const VH = 640;

  // Column X centres
  const COL_LEFT = 140;   // PC / MAR / Memory column
  const COL_MID = 410;   // IR / MDR column
  const COL_RIGHT = 680;   // ALU / Regs column
  const COL_BUS = 260;   // data bus highway centre

  // Row Y centres
  const ROW_CU = 70;    // Control Unit (top centre)
  const ROW_PC = 210;
  const ROW_IR = 210;
  const ROW_ALU = 190;
  const ROW_MAR = 370;
  const ROW_MDR = 370;
  const ROW_REGS = 370;
  const ROW_MEM = 510;

  // Component sizes
  const W_WIDE = 160;
  const W_MED = 130;
  const H_STD = 75;
  const H_TALL = 110;

  // Component top-left x,y derived from centres
  const C = (cx: number, w: number) => cx - w / 2;
  const R = (cy: number, h: number) => cy - h / 2;

  const comps = {
    CU: { x: C(400, W_WIDE), y: R(ROW_CU, H_STD), w: W_WIDE, h: H_STD },
    PC: { x: C(COL_LEFT, W_MED), y: R(ROW_PC, H_STD), w: W_MED, h: H_STD },
    IR: { x: C(COL_MID, W_MED), y: R(ROW_IR, H_STD), w: W_MED, h: H_STD },
    ALU: { x: C(COL_RIGHT, W_MED), y: R(ROW_ALU, H_TALL), w: W_MED, h: H_TALL },
    MAR: { x: C(COL_LEFT, W_MED), y: R(ROW_MAR, H_STD), w: W_MED, h: H_STD },
    MDR: { x: C(COL_MID, W_MED), y: R(ROW_MDR, H_STD), w: W_MED, h: H_STD },
    REGS: { x: C(COL_RIGHT, W_MED), y: R(ROW_REGS, H_TALL), w: W_MED, h: H_TALL },
    MEM: { x: C(COL_BUS, W_WIDE), y: R(ROW_MEM, H_STD), w: W_WIDE, h: H_STD },
  };

  // shorthand centre of component
  const cc = (k: keyof typeof comps) => ({
    cx: comps[k].x + comps[k].w / 2,
    cy: comps[k].y + comps[k].h / 2,
    top: comps[k].y,
    bot: comps[k].y + comps[k].h,
    left: comps[k].x,
    right: comps[k].x + comps[k].w,
    midX: comps[k].x + comps[k].w / 2,
    midY: comps[k].y + comps[k].h / 2,
  });

  /* ────── path definitions ────── */
  const paths: Record<string, string> = {
    // FETCH: PC → MAR (vertical down left column)
    PC_MAR: `M ${cc('PC').midX} ${cc('PC').bot} L ${cc('MAR').midX} ${cc('MAR').top}`,

    // FETCH: Memory → MDR (vertical, slightly curved)
    MEM_MDR: `M ${cc('MEM').right - 20} ${cc('MEM').top}
              C ${cc('MEM').right - 20} ${cc('MDR').bot + 40},
                ${cc('MDR').midX} ${cc('MDR').bot + 40},
                ${cc('MDR').midX} ${cc('MDR').bot}`,

    // FETCH: MDR → IR (vertical up)
    MDR_IR: `M ${cc('MDR').midX} ${cc('MDR').top} L ${cc('IR').midX} ${cc('IR').bot}`,

    // DECODE: IR → CU (diagonal to top)
    IR_CU: `M ${cc('IR').midX} ${cc('IR').top}
            C ${cc('IR').midX} ${cc('CU').bot + 30},
              ${cc('CU').midX} ${cc('CU').bot + 30},
              ${cc('CU').midX} ${cc('CU').bot}`,

    // DECODE/EXECUTE: CU → ALU (curved right)
    CU_ALU: `M ${cc('CU').right} ${cc('CU').midY}
             C ${cc('CU').right + 60} ${cc('CU').midY},
               ${cc('ALU').left - 40} ${cc('ALU').midY},
               ${cc('ALU').left} ${cc('ALU').midY}`,

    // EXECUTE: REGS → ALU (up from registers to ALU)
    REGS_ALU: `M ${cc('REGS').midX} ${cc('REGS').top}
               L ${cc('ALU').midX} ${cc('ALU').bot}`,

    // WRITEBACK: ALU → REGS
    ALU_REGS: `M ${cc('ALU').midX - 14} ${cc('ALU').bot}
               L ${cc('REGS').midX - 14} ${cc('REGS').top}`,

    // CU broadcast bus (control signals) — horizontal spine
    CU_ALL: `M ${cc('CU').left} ${cc('CU').midY}
             L ${cc('PC').right + 10} ${cc('CU').midY}
             M ${cc('PC').right + 10} ${cc('CU').midY}
             L ${cc('PC').right + 10} ${cc('PC').midY}
             M ${cc('CU').right} ${cc('CU').midY}
             L ${cc('ALU').left - 8} ${cc('CU').midY}
             M ${cc('ALU').left - 8} ${cc('CU').midY}
             L ${cc('ALU').left - 8} ${cc('ALU').midY}`,

    // MAR → MEM (down to memory)
    MAR_MEM: `M ${cc('MAR').midX} ${cc('MAR').bot}
              C ${cc('MAR').midX} ${cc('MAR').bot + 40},
                ${cc('MEM').left + 20} ${cc('MEM').top - 30},
                ${cc('MEM').left + 20} ${cc('MEM').top}`,
  };

  /* ────── path label positions ────── */
  const pathLabels: Record<string, { x: number; y: number; label: string }> = {
    PC_MAR: { x: cc('PC').midX + 18, y: (cc('PC').bot + cc('MAR').top) / 2, label: 'ADDR' },
    MEM_MDR: { x: cc('MDR').midX + 30, y: (cc('MEM').top + cc('MDR').bot) / 2, label: 'DATA' },
    MDR_IR: { x: cc('MDR').midX + 18, y: (cc('MDR').top + cc('IR').bot) / 2, label: 'INST' },
    IR_CU: { x: (cc('IR').midX + cc('CU').midX) / 2, y: cc('IR').top - 18, label: 'OPC' },
    CU_ALU: { x: (cc('CU').right + cc('ALU').left) / 2, y: cc('CU').midY - 14, label: 'CTRL' },
    REGS_ALU: { x: cc('REGS').midX + 22, y: (cc('REGS').top + cc('ALU').bot) / 2, label: 'SRC' },
    ALU_REGS: { x: cc('ALU').midX - 32, y: (cc('ALU').bot + cc('REGS').top) / 2, label: 'RES' },
    MAR_MEM: { x: cc('MAR').midX - 28, y: (cc('MAR').bot + cc('MEM').top) / 2, label: 'MREQ' },
  };

  /* ────── phase pill state ────── */
  const phaseLabel = PHASE_LABELS[currentCycle] ?? 'IDLE';
  const phaseDesc = PHASE_DESC[currentCycle] ?? '';

  // Removed Oscilloscope Y coords

  return (
    <div
      id="cpu-container"
      className="w-full h-full relative overflow-hidden rounded-xl bg-[#080b12]"
    >
      <div className="w-full h-full absolute inset-0">
        {/* ── background scanlines ── */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
          }}
        />

        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <defs>
            {/* dot grid */}
            <pattern id="dotgrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.8" fill="rgba(255,255,255,0.06)" />
            </pattern>

            {/* vignette radial */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
            </radialGradient>

            {/* chip board texture */}
            <filter id="board-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" mode="multiply" />
            </filter>

            <filter id="main-glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── dot grid background ── */}
          <rect width="100%" height="100%" fill="url(#dotgrid)" />

          {/* ── vignette ── */}
          <rect width="100%" height="100%" fill="url(#vignette)" />

          {/* ═══════════════════════════════════════
            CPU ZONE BOUNDARY (chip die outline)
        ═══════════════════════════════════════ */}
          <rect
            x={28} y={28}
            width={VW - 56} height={VH - 56}
            rx={18}
            fill="none"
            stroke={isAnimating ? color : '#1e2235'}
            strokeWidth={1.5}
            strokeDasharray={isAnimating ? '8 4' : '6 6'}
            opacity={isAnimating ? 0.5 : 0.3}
          />
          {/* top label */}
          <text x={VW / 2} y={18} textAnchor="middle" fill={isAnimating ? color : '#374151'}
            fontSize={9} fontFamily="'JetBrains Mono', monospace" letterSpacing="0.15em" opacity={0.7}>
            ARCH-16 EDUCATIONAL PROCESSOR  ·  16-bit RISC CORE
          </text>

          {/* ═══════════════════════════════════════
            DATA BUS HIGHWAY  (vertical spine)
        ═══════════════════════════════════════ */}
          {/* bus tracks */}
          {[0, 5, 10].map((offset) => (
            <line
              key={offset}
              x1={COL_BUS - 15 + offset} y1={90}
              x2={COL_BUS - 15 + offset} y2={ROW_MEM + 30}
              stroke={isAnimating ? `${color}30` : '#1e2235'}
              strokeWidth={1}
            />
          ))}
          {/* bus label */}
          <text
            x={COL_BUS - 28} y={(90 + ROW_MEM + 30) / 2}
            textAnchor="middle"
            fill={isAnimating ? `${color}80` : '#2a2d3e'}
            fontSize={7}
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="0.12em"
            transform={`rotate(-90, ${COL_BUS - 28}, ${(90 + ROW_MEM + 30) / 2})`}
          >
            ADDRESS BUS
          </text>

          {/* ═══════════════════════════════════════
            STATIC BACKGROUND PATHS (dim tracks)
        ═══════════════════════════════════════ */}
          {Object.entries(paths).map(([key, d]) => (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="#1a1d2e"
              strokeWidth={key === 'CU_ALL' ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* ═══════════════════════════════════════
            ANIMATED DATA FLOW ARROWS
        ═══════════════════════════════════════ */}
          <DataFlowArrow id="pc-mar" path={paths.PC_MAR} isActive={activePaths.includes('PC_MAR')} color={color} />
          <DataFlowArrow id="mem-mdr" path={paths.MEM_MDR} isActive={activePaths.includes('MEM_MDR')} color={color} />
          <DataFlowArrow id="mdr-ir" path={paths.MDR_IR} isActive={activePaths.includes('MDR_IR')} color={color} />
          <DataFlowArrow id="ir-cu" path={paths.IR_CU} isActive={activePaths.includes('IR_CU')} color={color} />
          <DataFlowArrow id="cu-alu" path={paths.CU_ALU} isActive={activePaths.includes('CU_ALU')} color={color} isBus />
          <DataFlowArrow id="regs-alu" path={paths.REGS_ALU} isActive={activePaths.includes('REGS_ALU')} color={color} />
          <DataFlowArrow id="alu-regs" path={paths.ALU_REGS} isActive={activePaths.includes('ALU_REGS')} color={color} reverse />
          <DataFlowArrow id="cu-all" path={paths.CU_ALL} isActive={activePaths.includes('CU_ALL')} color={color} isBus />
          <DataFlowArrow id="mar-mem" path={paths.MAR_MEM} isActive={activePaths.includes('MAR_MEM')} color={color} />

          {/* ═══════════════════════════════════════
            PATH LABELS (data packet tags)
        ═══════════════════════════════════════ */}
          <AnimatePresence>
            {Object.entries(pathLabels).map(([key, { x, y, label }]) =>
              activePaths.includes(key) ? (
                <PathLabel key={key} x={x} y={y} color={color} label={label} />
              ) : null
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════
            COMPONENTS
        ═══════════════════════════════════════ */}

          {/* Control Unit */}
          <CPUComponent
            id="CU" name="CU" subtitle="Control Unit"
            x={comps.CU.x} y={comps.CU.y} width={comps.CU.w} height={comps.CU.h}
            value={activeComponents.includes('CU') ? currentCommand : undefined}
            isActive={activeComponents.includes('CU') || (isExecuting && !isAnimating)}
            color={color}
          />

          {/* Program Counter */}
          <CPUComponent
            id="PC" name="PC" subtitle="Program Counter"
            x={comps.PC.x} y={comps.PC.y} width={comps.PC.w} height={comps.PC.h}
            value={state ? toHex(state.pc) : '0x0000'}
            isActive={isExecuting}
            color={color}
          />

          {/* Instruction Register */}
          <CPUComponent
            id="IR" name="IR" subtitle="Instr. Register"
            x={comps.IR.x} y={comps.IR.y} width={comps.IR.w} height={comps.IR.h}
            value={getIRValue()}
            isActive={isExecuting}
            color={color}
          />

          {/* ALU */}
          <CPUComponent
            id="ALU" name="ALU" subtitle="Arith. Logic Unit"
            x={comps.ALU.x} y={comps.ALU.y} width={comps.ALU.w} height={comps.ALU.h}
            value={activeComponents.includes('ALU') ? currentCommand : undefined}
            isActive={activeComponents.includes('ALU') || (isExecuting && !isAnimating)}
            color={color}
            shape="hexagon"
          />

          {/* MAR */}
          <CPUComponent
            id="MAR" name="MAR" subtitle="Mem. Addr. Reg"
            x={comps.MAR.x} y={comps.MAR.y} width={comps.MAR.w} height={comps.MAR.h}
            value={state ? toHex(state.mar) : '0x0000'}
            isActive={activeComponents.includes('MAR') || (isExecuting && !isAnimating)}
            color={color}
          />

          {/* MDR */}
          <CPUComponent
            id="MDR" name="MDR" subtitle="Mem. Data Reg"
            x={comps.MDR.x} y={comps.MDR.y} width={comps.MDR.w} height={comps.MDR.h}
            value={state ? toHex(state.mdr) : '0x0000'}
            isActive={activeComponents.includes('MDR') || (isExecuting && !isAnimating)}
            color={color}
          />

          {/* Register File */}
          <CPUComponent
            id="REGS" name="REG FILE" subtitle="Register Bank"
            x={comps.REGS.x} y={comps.REGS.y} width={comps.REGS.w} height={comps.REGS.h}
            value={state ? `AX ${toHex(state.registers['AX'])}` : 'AX 0x0000'}
            secondValue={state ? `BX ${toHex(state.registers['BX'])}` : 'BX 0x0000'}
            isActive={activeComponents.includes('REGS') || (isExecuting && !isAnimating)}
            color={color}
          />

          {/* Memory */}
          <CPUComponent
            id="MEM" name="RAM" subtitle="Main Memory"
            x={comps.MEM.x} y={comps.MEM.y} width={comps.MEM.w} height={comps.MEM.h}
            secondValue={activeComponents.includes('MEM') ? currentCommand : undefined}
            isActive={activeComponents.includes('MEM') || (isExecuting && !isAnimating)}
            color={color}
          />

          {/* ═══════════════════════════════════════
            SECTION ZONE LABELS
        ═══════════════════════════════════════ */}
          {/* Left column label */}
          <text x={42} y={ROW_PC + 4} fill="#1e3a5f" fontSize={8} fontFamily="'JetBrains Mono', monospace"
            letterSpacing="0.1em" transform={`rotate(-90, 42, ${ROW_PC + 4})`}>
            ADDRESS GEN
          </text>
          {/* Right column label */}
          <text x={VW - 18} y={ROW_ALU + 8} fill="#1e3a5f" fontSize={8} fontFamily="'JetBrains Mono', monospace"
            letterSpacing="0.1em" transform={`rotate(90, ${VW - 18}, ${ROW_ALU + 8})`}>
            EXECUTION UNIT
          </text>

          {/* ═══════════════════════════════════════
            PHASE BADGE (top-left)
        ═══════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            <motion.g
              key={currentCycle}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
            >
              {/* badge bg */}
              <rect x={38} y={36} width={200} height={42} rx={8}
                fill={`${color}18`} stroke={color} strokeWidth={1} opacity={0.9} />

              {/* badge label */}
              <text x={50} y={53} fill={color} fontSize={13} fontWeight="800"
                fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">
                {phaseLabel}
              </text>

              {/* badge description */}
              <text x={50} y={68} fill={`${color}aa`} fontSize={7.5}
                fontFamily="Inter, sans-serif" letterSpacing="0.04em">
                {phaseDesc}
              </text>

              {/* animated indicator dot */}
              {isAnimating && (
                <motion.circle
                  cx={228} cy={57} r={5} fill={color}
                  animate={{ opacity: [1, 0.2, 1], r: [5, 7, 5] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                />
              )}
            </motion.g>
          </AnimatePresence>

          {/* ═══════════════════════════════════════
            PC COUNTER (top-right)
        ═══════════════════════════════════════ */}
          <rect x={VW - 140} y={36} width={110} height={42} rx={8}
            fill="#0f1117" stroke="#1e2235" strokeWidth={1} />
          <text x={VW - 130} y={53} fill="#64748b" fontSize={8}
            fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">
            INSTRUCTION PTR
          </text>
          <text x={VW - 130} y={68} fill={isAnimating ? color : '#f59e0b'}
            fontSize={14} fontWeight="700" fontFamily="'JetBrains Mono', monospace"
            style={isAnimating ? { filter: `drop-shadow(0 0 4px ${color})` } : {}}>
            {state ? toHex(state.pc, 4) : '0x0000'}
          </text>

        </svg>
      </div>
    </div>
  );
}
