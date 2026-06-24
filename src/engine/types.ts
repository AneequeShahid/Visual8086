export enum Register {
  AX = 'AX',
  BX = 'BX',
  CX = 'CX',
  DX = 'DX',
  SP = 'SP',
  IP = 'IP'
}

export enum Flag {
  ZF = 'ZF', // Zero Flag
  CF = 'CF', // Carry Flag
  SF = 'SF', // Sign Flag
  OF = 'OF', // Overflow Flag
  PF = 'PF', // Parity Flag
  DF = 'DF', // Direction Flag
  IF = 'IF', // Interrupt Flag
  TF = 'TF', // Trap Flag
}

export interface Instruction {
  opcode: string;
  operands: string[];
  lineNumber: number;
  originalText: string;
  label?: string; // If this instruction has a label
  address: number;
  size: number;
}

export enum CycleStage {
  FETCH = 'FETCH',
  DECODE = 'DECODE',
  EXECUTE = 'EXECUTE',
  WRITEBACK = 'WRITEBACK',
  IDLE = 'IDLE'
}

export interface CPUState {
  registers: Record<Register, number>;
  flags: Record<Flag, boolean>;
  memory: Record<number, number>; // address -> value
  pc: number;  // Program Counter (same as IP but often used conceptually)
  ir: string;  // Instruction Register
  mar: number; // Memory Address Register
  mdr: number; // Memory Data Register
}

export interface ExecutionSnapshot {
  state: CPUState;
  instruction: Instruction;
  cycleStage: CycleStage;
}
