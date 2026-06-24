import { Flag } from './types';

// Utility for 16-bit arithmetic
const MAX_16 = 0xFFFF;
const SIGN_BIT = 0x8000;

export class ALU {
  /**
   * Helper to keep values within 16 bits
   */
  static mask16(val: number): number {
    return val & MAX_16;
  }

  /**
   * Calculate parity flag: true if even number of 1s in lowest byte
   */
  static calculateParity(val: number): boolean {
    let count = 0;
    let byte = val & 0xFF;
    while (byte > 0) {
      if (byte & 1) count++;
      byte >>= 1;
    }
    return count % 2 === 0;
  }

  /**
   * Perform an ADD operation, returning result and updated flags
   */
  static add(a: number, b: number): { result: number; flags: Partial<Record<Flag, boolean>> } {
    const rawResult = a + b;
    const result = this.mask16(rawResult);
    
    // Overflow: if signs of operands are same, but sign of result is different
    const aSign = (a & SIGN_BIT) !== 0;
    const bSign = (b & SIGN_BIT) !== 0;
    const resSign = (result & SIGN_BIT) !== 0;
    const overflow = (aSign === bSign) && (aSign !== resSign);

    return {
      result,
      flags: {
        [Flag.CF]: rawResult > MAX_16,
        [Flag.ZF]: result === 0,
        [Flag.SF]: resSign,
        [Flag.OF]: overflow,
        [Flag.PF]: this.calculateParity(result),
      }
    };
  }

  /**
   * Perform a SUB operation, returning result and updated flags
   */
  static sub(a: number, b: number): { result: number; flags: Partial<Record<Flag, boolean>> } {
    const rawResult = a - b;
    // For 16 bit, borrow occurs if a < b
    const carry = a < b;
    const result = this.mask16(rawResult < 0 ? rawResult + 0x10000 : rawResult);
    
    // Overflow: if signs of operands are different, and sign of result is different from a
    const aSign = (a & SIGN_BIT) !== 0;
    const bSign = (b & SIGN_BIT) !== 0;
    const resSign = (result & SIGN_BIT) !== 0;
    const overflow = (aSign !== bSign) && (aSign !== resSign);

    return {
      result,
      flags: {
        [Flag.CF]: carry,
        [Flag.ZF]: result === 0,
        [Flag.SF]: resSign,
        [Flag.OF]: overflow,
        [Flag.PF]: this.calculateParity(result),
      }
    };
  }

  static and(a: number, b: number): { result: number; flags: Partial<Record<Flag, boolean>> } {
    const result = this.mask16(a & b);
    return {
      result,
      flags: {
        [Flag.CF]: false,
        [Flag.OF]: false,
        [Flag.ZF]: result === 0,
        [Flag.SF]: (result & SIGN_BIT) !== 0,
        [Flag.PF]: this.calculateParity(result),
      }
    };
  }

  static or(a: number, b: number): { result: number; flags: Partial<Record<Flag, boolean>> } {
    const result = this.mask16(a | b);
    return {
      result,
      flags: {
        [Flag.CF]: false,
        [Flag.OF]: false,
        [Flag.ZF]: result === 0,
        [Flag.SF]: (result & SIGN_BIT) !== 0,
        [Flag.PF]: this.calculateParity(result),
      }
    };
  }

  static xor(a: number, b: number): { result: number; flags: Partial<Record<Flag, boolean>> } {
    const result = this.mask16(a ^ b);
    return {
      result,
      flags: {
        [Flag.CF]: false,
        [Flag.OF]: false,
        [Flag.ZF]: result === 0,
        [Flag.SF]: (result & SIGN_BIT) !== 0,
        [Flag.PF]: this.calculateParity(result),
      }
    };
  }

  static not(a: number): { result: number } {
    // NOT does not affect flags in x86 usually, but returns result
    return {
      result: this.mask16(~a)
    };
  }

  static inc(a: number): { result: number; flags: Partial<Record<Flag, boolean>> } {
    // INC does not affect CF
    const result = this.mask16(a + 1);
    const aSign = (a & SIGN_BIT) !== 0;
    const resSign = (result & SIGN_BIT) !== 0;
    const overflow = !aSign && resSign;

    return {
      result,
      flags: {
        [Flag.ZF]: result === 0,
        [Flag.SF]: resSign,
        [Flag.OF]: overflow,
        [Flag.PF]: this.calculateParity(result),
      }
    };
  }

  static dec(a: number): { result: number; flags: Partial<Record<Flag, boolean>> } {
    // DEC does not affect CF
    const result = this.mask16(a - 1 < 0 ? a - 1 + 0x10000 : a - 1);
    const aSign = (a & SIGN_BIT) !== 0;
    const resSign = (result & SIGN_BIT) !== 0;
    const overflow = aSign && !resSign;

    return {
      result,
      flags: {
        [Flag.ZF]: result === 0,
        [Flag.SF]: resSign,
        [Flag.OF]: overflow,
        [Flag.PF]: this.calculateParity(result),
      }
    };
  }
}
