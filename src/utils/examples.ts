export const examplePrograms = [
  {
    id: 'basic-mov',
    title: 'Basic Data Transfer',
    code: `; Basic MOV instructions
MOV AX, 5
MOV BX, 10
MOV CX, AX
MOV DX, BX`
  },
  {
    id: 'arithmetic',
    title: 'Arithmetic & Flags',
    code: `; Arithmetic operations
MOV AX, 0xFFFF
ADD AX, 1       ; Triggers Zero and Carry flags
MOV BX, 5
SUB BX, 10      ; Triggers Sign flag
INC CX
DEC DX`
  },
  {
    id: 'loop',
    title: 'Simple Loop',
    code: `; A simple counter loop
MOV CX, 5       ; Loop counter
MOV AX, 0       ; Accumulator

START:          ; Loop label
ADD AX, 2
DEC CX
CMP CX, 0
JNE START       ; Jump if not equal to zero

MOV BX, AX      ; Store result in BX`
  },
  {
    id: 'stack',
    title: 'Stack Operations',
    code: `; Push and Pop from Stack
MOV AX, 0x1234
MOV BX, 0x5678

PUSH AX         ; Save AX to stack
PUSH BX         ; Save BX to stack

MOV AX, 0       ; Clear AX
MOV BX, 0       ; Clear BX

POP AX          ; Restore old BX into AX (LIFO)
POP BX          ; Restore old AX into BX`
  }
];
