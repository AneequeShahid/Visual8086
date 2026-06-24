export const assemblyLanguageDef = {
  defaultToken: 'invalid',
  ignoreCase: true,

  keywords: [
    'MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'INC', 'DEC',
    'AND', 'OR', 'XOR', 'NOT', 'CMP',
    'JMP', 'JE', 'JZ', 'JNE', 'JNZ', 'JG', 'JL', 'JGE', 'JLE',
    'PUSH', 'POP', 'NOP'
  ],

  registers: [
    'AX', 'BX', 'CX', 'DX', 'SP', 'IP'
  ],

  operators: [
    ',', '[', ']', ':'
  ],

  tokenizer: {
    root: [
      // labels
      [/^[a-zA-Z_]\w*:/, 'type.identifier'],
      
      // identifiers and keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@registers': 'variable.predefined',
          '@default': 'identifier'
        }
      }],

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[\[\]:,]/, 'delimiter'],

      // numbers
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/[0-9]+/, 'number'],
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/;.*$/, 'comment'],
    ],
  },
};

export const assemblyThemeDef = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '22d3ee', fontStyle: 'bold' }, // teal
    { token: 'variable.predefined', foreground: 'f59e0b' }, // amber for registers
    { token: 'number', foreground: '10b981' }, // emerald for numbers
    { token: 'number.hex', foreground: '10b981' },
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' }, // muted
    { token: 'type.identifier', foreground: 'e2e8f0', fontStyle: 'bold' }, // labels
    { token: 'delimiter', foreground: 'a1a1aa' },
  ],
  colors: {
    'editor.background': '#131520', // matches our bento panel bg
    'editor.foreground': '#e2e8f0',
    'editorLineNumber.foreground': '#475569',
    'editorLineNumber.activeForeground': '#22d3ee',
    'editor.selectionBackground': '#2a2d3e',
    'editorCursor.foreground': '#22d3ee',
  }
};
