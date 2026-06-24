import React, { useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Line } from '@react-three/drei';
import * as THREE from 'three';

// ── Layout positions for chips on the board ──
const POSITIONS: Record<string, [number, number, number]> = {
  PC:   [-5.5, 0.35, -3],
  MAR:  [-5.5, 0.35, 0],
  MEM:  [-5.5, 0.45, 4],
  MDR:  [-1.5, 0.35, 0],
  IR:   [-1.5, 0.35, -3],
  CU:   [2.5,  0.35, -3],
  ALU:  [6,    0.5,  0],
  REGS: [6,    0.45, 4],
};

const CHIP_SIZES: Record<string, [number, number, number]> = {
  PC:   [2.2, 0.5, 1.8],
  MAR:  [2.2, 0.5, 1.8],
  MEM:  [3.5, 0.7, 2.8],
  MDR:  [2.2, 0.5, 1.8],
  IR:   [2.2, 0.5, 1.8],
  CU:   [3,   0.5, 2.5],
  ALU:  [2.8, 0.7, 2.8],
  REGS: [3.5, 0.7, 2.8],
};

// ── Colors ──
const STAGE_COLORS: Record<string, string> = {
  FETCH:     '#3b82f6',
  DECODE:    '#a855f7',
  EXECUTE:   '#f97316',
  WRITEBACK: '#10b981',
  IDLE:      '#334155',
};

// ── Data bus paths (which chips connect) ──
const BUS_PATHS: [string, string, string][] = [
  // [pathId, fromChip, toChip]
  ['PC_MAR',   'PC',  'MAR'],
  ['MAR_MEM',  'MAR', 'MEM'],
  ['MEM_MDR',  'MEM', 'MDR'],
  ['MDR_IR',   'MDR', 'IR'],
  ['IR_CU',    'IR',  'CU'],
  ['CU_ALU',   'CU',  'ALU'],
  ['REGS_ALU', 'REGS','ALU'],
  ['ALU_REGS', 'ALU', 'REGS'],
];

// ── Which paths light up for each cycle stage ──
const STAGE_ACTIVE_PATHS: Record<string, string[]> = {
  FETCH:     ['PC_MAR', 'MAR_MEM', 'MEM_MDR', 'MDR_IR'],
  DECODE:    ['IR_CU', 'CU_ALU'],
  EXECUTE:   ['CU_ALU', 'REGS_ALU'],
  WRITEBACK: ['ALU_REGS'],
  IDLE:      [],
};

const STAGE_ACTIVE_CHIPS: Record<string, string[]> = {
  FETCH:     ['PC', 'MAR', 'MEM', 'MDR', 'IR'],
  DECODE:    ['IR', 'CU'],
  EXECUTE:   ['CU', 'ALU', 'REGS'],
  WRITEBACK: ['ALU', 'REGS'],
  IDLE:      [],
};

// ═════════════════════════════════════════════
// Single 3D Chip
// ═════════════════════════════════════════════
function Chip({ id, isActive, stageColor }: { id: string; isActive: boolean; stageColor: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = POSITIONS[id];
  const size = CHIP_SIZES[id];
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (isActive) {
      meshRef.current.position.y = pos[1] + Math.sin(state.clock.elapsedTime * 4) * 0.04;
    } else {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, pos[1], 0.08);
    }
    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 6) * 0.1;
      } else {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.05);
      }
    }
  });

  const color = isActive ? stageColor : '#1e293b';
  const emissive = isActive ? stageColor : '#000000';

  return (
    <group>
      {/* Under-glow */}
      <mesh ref={glowRef} position={[pos[0], 0.05, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] + 1.0, size[2] + 1.0]} />
        <meshBasicMaterial color={stageColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Main chip body */}
      <RoundedBox
        ref={meshRef}
        args={size}
        position={pos}
        radius={0.08}
        smoothness={4}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.85}
          emissive={emissive}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </RoundedBox>

      {/* Label - use a simple sprite instead of Text to avoid font loading */}
      <ChipLabel text={id === 'MEM' ? 'MEMORY' : id === 'REGS' ? 'REGISTERS' : id === 'CU' ? 'CONTROL\nUNIT' : id} position={[pos[0], pos[1] + size[1] / 2 + 0.15, pos[2]]} isActive={isActive} />
    </group>
  );
}

// ═════════════════════════════════════════════
// Chip Label using Canvas Texture (no font fetch)
// ═════════════════════════════════════════════
function ChipLabel({ text, position, isActive }: { text: string; position: [number, number, number]; isActive: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 128);
    ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 128, 64 + (i - (lines.length - 1) / 2) * 38);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, isActive]);

  return (
    <sprite position={position} scale={[1.6, 0.8, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

// ═════════════════════════════════════════════
// Data Bus (connecting line between chips)
// ═════════════════════════════════════════════
function DataBus({ from, to, isActive, stageColor }: { from: string; to: string; isActive: boolean; stageColor: string }) {
  const p1 = POSITIONS[from];
  const p2 = POSITIONS[to];

  const points = useMemo(() => {
    return [
      [p1[0], p1[1] + 0.3, p1[2]],
      [p2[0], p2[1] + 0.3, p2[2]],
    ] as [number, number, number][];
  }, [p1, p2]);

  return (
    <Line 
      points={points} 
      color={isActive ? stageColor : '#1e293b'} 
      lineWidth={isActive ? 3 : 1}
      transparent
      opacity={isActive ? 0.9 : 0.2}
    />
  );
}

// ═════════════════════════════════════════════
// Animated Particle flowing along a bus
// ═════════════════════════════════════════════
function DataParticle({ from, to, isActive, stageColor }: { from: string; to: string; isActive: boolean; stageColor: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const p1 = POSITIONS[from];
  const p2 = POSITIONS[to];

  useFrame((state) => {
    if (!ref.current || !isActive) return;
    const t = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2; // oscillate 0-1
    ref.current.position.x = THREE.MathUtils.lerp(p1[0], p2[0], t);
    ref.current.position.y = THREE.MathUtils.lerp(p1[1] + 0.4, p2[1] + 0.4, t);
    ref.current.position.z = THREE.MathUtils.lerp(p1[2], p2[2], t);
  });

  if (!isActive) return null;

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshBasicMaterial color={stageColor} />
      <pointLight color={stageColor} intensity={3} distance={2.5} />
    </mesh>
  );
}

// ═════════════════════════════════════════════
// Main 3D Scene (exported)
// ═════════════════════════════════════════════
interface CPU3DSceneProps {
  currentStage: string; // 'FETCH' | 'DECODE' | 'EXECUTE' | 'WRITEBACK' | 'IDLE'
}

export function CPU3DScene({ currentStage }: CPU3DSceneProps) {
  const stageColor = STAGE_COLORS[currentStage] || STAGE_COLORS.IDLE;
  const activeChips = STAGE_ACTIVE_CHIPS[currentStage] || [];
  const activePaths = STAGE_ACTIVE_PATHS[currentStage] || [];

  return (
    <>
      <color attach="background" args={['#060810']} />
      <fog attach="fog" args={['#060810', 15, 35]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow />
      <pointLight position={[0, 6, 0]} intensity={0.4} color="#22d3ee" />
      <pointLight position={[-6, 4, -3]} intensity={0.3} color="#3b82f6" />
      <pointLight position={[6, 4, 3]} intensity={0.3} color="#10b981" />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.2}
        minDistance={6}
        maxDistance={28}
        autoRotate={currentStage === 'IDLE'}
        autoRotateSpeed={0.5}
      />

      <group position={[0, 0, 0.5]}>
        {/* Motherboard base */}
        <RoundedBox args={[18, 0.15, 13]} position={[0, -0.1, 0.5]} radius={0.3} smoothness={4}>
          <meshStandardMaterial color="#0c1020" roughness={0.9} metalness={0.3} />
        </RoundedBox>

        {/* Subtle PCB grid */}
        <gridHelper args={[17, 34, '#111830', '#0a0e1a']} position={[0, 0.01, 0.5]} />

        {/* Chips */}
        {Object.keys(POSITIONS).map((chipId) => (
          <Chip
            key={chipId}
            id={chipId}
            isActive={activeChips.includes(chipId)}
            stageColor={stageColor}
          />
        ))}

        {/* Buses */}
        {BUS_PATHS.map(([pathId, from, to]) => (
          <DataBus
            key={pathId}
            from={from}
            to={to}
            isActive={activePaths.includes(pathId)}
            stageColor={stageColor}
          />
        ))}

        {/* Animated particles */}
        {BUS_PATHS.map(([pathId, from, to]) => (
          <DataParticle
            key={`p-${pathId}`}
            from={from}
            to={to}
            isActive={activePaths.includes(pathId)}
            stageColor={stageColor}
          />
        ))}
      </group>
    </>
  );
}
