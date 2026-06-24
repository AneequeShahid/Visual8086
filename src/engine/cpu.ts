import { Register, Flag, CPUState, CycleStage, Instruction, ExecutionSnapshot } from './types';
import { ALU } from './alu';

export class CPUEngine {
  private state: CPUState;
  private memorySize = 256; // Simplified memory size for educational purposes
  
  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): CPUState {
    return {
      registers: {
        [Register.AX]: 0,
        [Register.BX]: 0,
        [Register.CX]: 0,
        [Register.DX]: 0,
        [Register.SP]: 0x0200, // Stack grows downward from 0x0200 (first push at 0x01FE)
        [Register.IP]: 0,
      },
      flags: {
        [Flag.ZF]: false,
        [Flag.CF]: false,
        [Flag.SF]: false,
        [Flag.OF]: false,
        [Flag.PF]: false,
        [Flag.DF]: false,
        [Flag.IF]: false,
        [Flag.TF]: false,
      },
      memory: {}, // Sparse representation
      pc: 0,
      ir: '',
      mar: 0,
      mdr: 0,
    };
  }

  public reset() {
    this.state = this.getInitialState();
  }

  public getState(): CPUState {
    // Return deep copy
    return JSON.parse(JSON.stringify(this.state));
  }

  public setState(state: CPUState) {
    this.state = JSON.parse(JSON.stringify(state));
  }

  public setRegisters(regs: Partial<Record<Register, number>>) {
    this.state.registers = { ...this.state.registers, ...regs };
  }

  public setMemory(data: Record<number, number>) {
    this.state.memory = { ...data };
  }

  private evaluateExpression(expr: string): number {
    // Basic evaluation for things like "256+1"
    try {
      // Very restricted evaluation
      if (expr.includes('+')) {
        const [a, b] = expr.split('+');
        return parseInt(a.trim()) + parseInt(b.trim());
      }
      if (expr.includes('-')) {
        const [a, b] = expr.split('-');
        return parseInt(a.trim()) - parseInt(b.trim());
      }
      return parseInt(expr.trim());
    } catch {
      return parseInt(expr.trim());
    }
  }

  private resolveOperand(operand: string): number {
    operand = operand.toUpperCase();
    if (Object.values(Register).includes(operand as Register)) {
      return this.state.registers[operand as Register];
    }
    
    // Check if memory address e.g. [100] or [BX] or [256+1]
    if (operand.startsWith('[') && operand.endsWith(']')) {
      const inner = operand.slice(1, -1);
      // Try resolving as a register first, e.g. [BX]
      if (Object.values(Register).includes(inner as Register)) {
        const addr = this.state.registers[inner as Register];
        return this.state.memory[addr] || 0;
      }
      
      const addr = this.evaluateExpression(inner);
      return this.state.memory[addr] || 0;
    }

    // Number
    const num = parseInt(operand, operand.startsWith('0X') ? 16 : 10);
    if (isNaN(num)) throw new Error(`Invalid operand: ${operand}`);
    return num;
  }

  private writeOperand(operand: string, value: number) {
    operand = operand.toUpperCase();
    if (Object.values(Register).includes(operand as Register)) {
      this.state.registers[operand as Register] = ALU.mask16(value);
      return;
    }

    if (operand.startsWith('[') && operand.endsWith(']')) {
      const inner = operand.slice(1, -1);
      
      if (Object.values(Register).includes(inner as Register)) {
        const addr = this.state.registers[inner as Register];
        this.state.memory[addr] = ALU.mask16(value);
        return;
      }

      const addr = this.evaluateExpression(inner);
      this.state.memory[addr] = ALU.mask16(value);
      return;
    }

    throw new Error(`Cannot write to immediate value: ${operand}`);
  }

  public executeInstruction(inst: Instruction) {
    this.state.ir = inst.originalText;
    const { opcode, operands } = inst;

    switch (opcode) {
      case 'MOV':
        if (operands.length !== 2) throw new Error('MOV requires 2 operands');
        this.writeOperand(operands[0], this.resolveOperand(operands[1]));
        break;
      case 'ADD': {
        if (operands.length !== 2) throw new Error('ADD requires 2 operands');
        const dest = this.resolveOperand(operands[0]);
        const src = this.resolveOperand(operands[1]);
        const { result, flags } = ALU.add(dest, src);
        this.writeOperand(operands[0], result);
        this.state.flags = { ...this.state.flags, ...flags };
        break;
      }
      case 'SUB':
      case 'CMP': {
        if (operands.length !== 2) throw new Error(`${opcode} requires 2 operands`);
        const dest = this.resolveOperand(operands[0]);
        const src = this.resolveOperand(operands[1]);
        const { result, flags } = ALU.sub(dest, src);
        if (opcode === 'SUB') {
          this.writeOperand(operands[0], result);
        }
        this.state.flags = { ...this.state.flags, ...flags };
        break;
      }
      case 'MUL': {
        if (operands.length !== 2) throw new Error('MUL requires 2 operands');
        const dest = this.resolveOperand(operands[0]);
        const src = this.resolveOperand(operands[1]);
        this.writeOperand(operands[0], dest * src);
        // Simplified flags for MUL
        break;
      }
      case 'DIV': {
        if (operands.length !== 2) throw new Error('DIV requires 2 operands');
        const dest = this.resolveOperand(operands[0]);
        const src = this.resolveOperand(operands[1]);
        if (src === 0) throw new Error('Division by zero');
        this.writeOperand(operands[0], Math.floor(dest / src));
        break;
      }
      case 'INC': {
        if (operands.length !== 1) throw new Error('INC requires 1 operand');
        const dest = this.resolveOperand(operands[0]);
        const { result, flags } = ALU.inc(dest);
        this.writeOperand(operands[0], result);
        this.state.flags = { ...this.state.flags, ...flags };
        break;
      }
      case 'DEC': {
        if (operands.length !== 1) throw new Error('DEC requires 1 operand');
        const dest = this.resolveOperand(operands[0]);
        const { result, flags } = ALU.dec(dest);
        this.writeOperand(operands[0], result);
        this.state.flags = { ...this.state.flags, ...flags };
        break;
      }
      case 'AND': {
        if (operands.length !== 2) throw new Error('AND requires 2 operands');
        const dest = this.resolveOperand(operands[0]);
        const src = this.resolveOperand(operands[1]);
        const { result, flags } = ALU.and(dest, src);
        this.writeOperand(operands[0], result);
        this.state.flags = { ...this.state.flags, ...flags };
        break;
      }
      case 'OR': {
        if (operands.length !== 2) throw new Error('OR requires 2 operands');
        const dest = this.resolveOperand(operands[0]);
        const src = this.resolveOperand(operands[1]);
        const { result, flags } = ALU.or(dest, src);
        this.writeOperand(operands[0], result);
        this.state.flags = { ...this.state.flags, ...flags };
        break;
      }
      case 'XOR': {
        if (operands.length !== 2) throw new Error('XOR requires 2 operands');
        const dest = this.resolveOperand(operands[0]);
        const src = this.resolveOperand(operands[1]);
        const { result, flags } = ALU.xor(dest, src);
        this.writeOperand(operands[0], result);
        this.state.flags = { ...this.state.flags, ...flags };
        break;
      }
      case 'NOT': {
        if (operands.length !== 1) throw new Error('NOT requires 1 operand');
        const dest = this.resolveOperand(operands[0]);
        const { result } = ALU.not(dest);
        this.writeOperand(operands[0], result);
        break;
      }
      case 'PUSH': {
        if (operands.length !== 1) throw new Error('PUSH requires 1 operand');
        const val = this.resolveOperand(operands[0]);
        this.state.registers[Register.SP] -= 2;
        const sp = this.state.registers[Register.SP];
        this.state.memory[sp] = val & 0xFF;         // low byte
        this.state.memory[sp + 1] = (val >> 8) & 0xFF; // high byte
        break;
      }
      case 'POP': {
        if (operands.length !== 1) throw new Error('POP requires 1 operand');
        const sp = this.state.registers[Register.SP];
        const low = this.state.memory[sp] || 0;
        const high = this.state.memory[sp + 1] || 0;
        const val = (high << 8) | low;
        this.writeOperand(operands[0], val);
        this.state.registers[Register.SP] += 2;
        break;
      }
      case 'JMP':
      case 'JE':
      case 'JZ':
      case 'JNE':
      case 'JNZ':
      case 'JG':
      case 'JL':
      case 'JGE':
      case 'JLE': {
        if (operands.length !== 1) throw new Error(`${opcode} requires 1 operand`);
        // The target is a resolved memory address
        const targetAddress = this.resolveOperand(operands[0]);
        let shouldJump = false;
        
        switch (opcode) {
          case 'JMP': shouldJump = true; break;
          case 'JE':
          case 'JZ': shouldJump = this.state.flags[Flag.ZF]; break;
          case 'JNE':
          case 'JNZ': shouldJump = !this.state.flags[Flag.ZF]; break;
          case 'JG': shouldJump = !this.state.flags[Flag.ZF] && (this.state.flags[Flag.SF] === this.state.flags[Flag.OF]); break;
          case 'JGE': shouldJump = (this.state.flags[Flag.SF] === this.state.flags[Flag.OF]); break;
          case 'JL': shouldJump = (this.state.flags[Flag.SF] !== this.state.flags[Flag.OF]); break;
          case 'JLE': shouldJump = this.state.flags[Flag.ZF] || (this.state.flags[Flag.SF] !== this.state.flags[Flag.OF]); break;
        }

        if (shouldJump) {
          this.state.pc = targetAddress;
          this.state.registers[Register.IP] = targetAddress;
          return; // Skip the normal PC increment
        }
        break;
      }
      case 'NOP':
        break;
      default:
        throw new Error(`Unsupported instruction: ${opcode}`);
    }

    // Increment PC by 2 (instruction size)
    this.state.pc += 2;
    this.state.registers[Register.IP] = this.state.pc;
  }
}
