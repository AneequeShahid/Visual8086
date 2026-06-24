export function toHex(val: number, padding: number = 4): string {
  if (val === undefined || val === null) return '0x0000';
  return `0x${val.toString(16).toUpperCase().padStart(padding, '0')}`;
}

export function toBin(val: number, padding: number = 16): string {
  if (val === undefined || val === null) return '0'.repeat(padding);
  return val.toString(2).padStart(padding, '0');
}

export function toSigned16(val: number): number {
  if (val === undefined || val === null) return 0;
  return val >= 0x8000 ? val - 0x10000 : val;
}
