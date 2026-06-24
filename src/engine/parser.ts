import { Instruction } from './types';

export class ParserError extends Error {
  constructor(public message: string, public lineNumber: number) {
    super(`Line ${lineNumber}: ${message}`);
    this.name = 'ParserError';
  }
}

export interface ParseResult {
  instructions: Instruction[];
  dataSegment: Record<number, number>;
  labels: Record<string, number>;
}

export class Parser {
  static parse(sourceCode: string): ParseResult {
    const instructions: Instruction[] = [];
    const dataSegment: Record<number, number> = {};
    const labels: Record<string, number> = {};
    
    const lines = sourceCode.split('\n');

    // Memory Map:
    // Code Segment:  0x0000 - 0x00FF
    // Data Segment:  0x0100 - 0x01FF
    // Stack Segment: 0x0200 - 0x02FF
    let codeAddress = 0x0000;
    let dataAddress = 0x0100;

    for (let i = 0; i < lines.length; i++) {
      const originalText = lines[i];
      // Strip comments (anything after ;)
      let line = originalText.split(';')[0].trim();
      
      if (!line) continue; // Skip empty lines or pure comments

      let label: string | undefined = undefined;

      // Check for label
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        label = line.substring(0, colonIndex).trim();
        line = line.substring(colonIndex + 1).trim();
      }

      // Check if it's a data declaration (e.g. `num db 4, 6, 7` or `arr: db 1`)
      // DB doesn't always have a colon in assembly. E.g. "num db 5"
      const parts = line.split(/[\s,]+/).filter(p => p.length > 0);
      if (parts.length === 0 && label) {
         // Label on its own line -> points to the next code address
         labels[label] = codeAddress;
         continue;
      }

      // If first token is a label without a colon (e.g., 'num db 5')
      if (parts.length >= 2 && parts[1].toLowerCase() === 'db') {
        label = parts[0];
        labels[label] = dataAddress;
        
        // Parse the values
        for (let j = 2; j < parts.length; j++) {
          const val = parseInt(parts[j], 10);
          if (isNaN(val)) throw new ParserError(`Invalid data value: ${parts[j]}`, i + 1);
          dataSegment[dataAddress] = val;
          dataAddress += 1;
        }
        continue;
      }

      // If it has a label but starts with db (e.g., 'num: db 5')
      if (parts[0].toLowerCase() === 'db') {
        if (label) labels[label] = dataAddress;
        
        // Parse the values
        for (let j = 1; j < parts.length; j++) {
          const val = parseInt(parts[j], 10);
          if (isNaN(val)) throw new ParserError(`Invalid data value: ${parts[j]}`, i + 1);
          dataSegment[dataAddress] = val;
          dataAddress += 1;
        }
        continue;
      }

      // It is an instruction
      if (label) labels[label] = codeAddress;

      const opcode = parts[0].toUpperCase();
      const operands = parts.slice(1);

      instructions.push({
        opcode,
        operands,
        lineNumber: i + 1,
        originalText,
        label,
        address: codeAddress,
        size: 2 // Fixed 2-byte instruction size
      });

      codeAddress += 2; // Increment PC by 2
    }

    return { instructions, dataSegment, labels };
  }
}
