# Visual8086 🖥️

> **An interactive, browser-based Intel 8086 CPU simulator** — write assembly in the editor, watch instructions execute step-by-step across registers, flags, memory, and a 3D CPU diagram — all without installing anything.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-000000?logo=three.js)](https://threejs.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📖 Description

**Visual8086** is a fully client-side, educational 8086 microprocessor simulator built for Computer Organization and Assembly Language (COAL) students. It lets you type x86 assembly instructions directly into a Monaco-powered editor, then execute them — one step at a time or all at once — while watching every CPU component react in real time.

The simulator implements a faithful subset of the Intel 8086 instruction set (registers AX/BX/CX/DX/SP/IP, eight CPU flags, sparse memory, and a full jump engine). An interactive 2D CPU architecture diagram and an expandable **3D CPU model** (powered by Three.js and `@react-three/fiber`) let students visualize how data flows between the BIU, EU, ALU, and memory — turning abstract architecture concepts into something you can see.

**Who is it for?** Computer science undergraduates studying assembly language or computer architecture; instructors who want a zero-setup classroom tool; anyone curious about how CPUs execute code at the instruction level.

---

## 📑 Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Supported Instructions](#supported-instructions)
6. [Contributing](#contributing)
7. [License & Contact](#license--contact)

---

## ✨ Features

- 📝 **Monaco Code Editor** — syntax-highlighted assembly editor (the same engine as VS Code)
- ▶️ **Step / Run / Reset Controls** — execute one instruction at a time or run the entire program
- 🔲 **CPU Architecture Diagram** — live 2D diagram of BIU, EU, ALU, registers, and buses with data-flow animation
- 🧊 **3D CPU Model** — expandable interactive Three.js model of the 8086 chip
- 📋 **Register Panel** — live values for AX, BX, CX, DX, SP, IP with hex and decimal display
- 🚩 **Flag Register** — real-time ZF, CF, SF, OF, PF, DF, IF, TF flag states
- 🗺️ **Memory Map** — sparse 256-byte memory viewer showing live reads/writes
- ⏱️ **Execution Timeline** — chronological log of every instruction and the cycle stage (Fetch → Decode → Execute → Write-back)
- 📚 **Built-in Example Programs** — load pre-written snippets (arithmetic, loops, stack ops) from a dropdown
- ⚡ **Runs 100% in-browser** — no backend, no installation, no DOSBOX required

---

## 🗂️ Project Structure

```
visual8086/
├── public/                  # Static assets
├── src/
│   ├── engine/
│   │   ├── cpu.ts           # CPUEngine — instruction fetch/decode/execute loop
│   │   ├── alu.ts           # ALU — ADD/SUB/AND/OR/XOR/NOT/INC/DEC + flag logic
│   │   ├── parser.ts        # Assembly parser — tokenizer and operand resolver
│   │   └── types.ts         # Register, Flag, CPUState, Instruction types
│   │
│   ├── components/
│   │   ├── Editor/          # CodeEditor (Monaco), ControlBar, ExamplePrograms
│   │   ├── CPU/             # CPUDiagram — animated SVG architecture view
│   │   ├── CPU3D/           # CPU3DModal — Three.js / @react-three/fiber 3D model
│   │   ├── Registers/       # RegisterPanel — live AX/BX/CX/DX/SP/IP display
│   │   ├── Memory/          # MemoryPanel — sparse memory grid
│   │   ├── Timeline/        # ExecutionTimeline — step-by-step instruction log
│   │   └── common/          # Panel wrapper used by all sections
│   │
│   ├── store/
│   │   └── animationStore.ts # Zustand global state (CPU state, timeline, 3D modal)
│   │
│   ├── App.tsx              # Root layout — 12-column CSS grid
│   └── main.tsx             # React entry point
│
├── vercel.json              # SPA routing config for Vercel
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Installation

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/AneequeShahid/Visual8086.git
cd Visual8086

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build      # Outputs to /dist
npm run preview    # Serve the production build locally
```

---

## 💻 Usage

### Running a program

1. Type (or paste) assembly code into the **Assembly Editor** panel on the left.
2. Use the **Control Bar** buttons:
   - **Step** — execute one instruction and pause
   - **Run** — execute all instructions to completion
   - **Reset** — clear registers, flags, and memory back to initial state
3. Watch the **CPU Architecture** diagram animate data flow in real time.
4. Inspect **Registers** and **Memory Map** panels to verify state.
5. Review the **Execution Timeline** at the bottom for a full cycle-by-cycle log.

### Example program

```asm
MOV AX, 5
MOV BX, 3
ADD AX, BX    ; AX = 8,  ZF=0, SF=0
CMP AX, 8     ; ZF = 1 (equal)
JE  10        ; jump to instruction at address 10
MOV CX, 99   ; skipped
```

### Load built-in examples

Click the **Examples** dropdown in the editor header to instantly load pre-built programs demonstrating arithmetic, conditional jumps, stack operations, and loops.

---

## 🔧 Supported Instructions

| Category | Instructions |
|----------|-------------|
| **Data Transfer** | `MOV`, `PUSH`, `POP` |
| **Arithmetic** | `ADD`, `SUB`, `MUL`, `DIV`, `INC`, `DEC` |
| **Logic** | `AND`, `OR`, `XOR`, `NOT` |
| **Comparison** | `CMP` |
| **Jumps** | `JMP`, `JE`/`JZ`, `JNE`/`JNZ`, `JG`, `JGE`, `JL`, `JLE` |
| **Misc** | `NOP` |

> **Registers:** AX, BX, CX, DX, SP, IP (16-bit)
> **Flags:** ZF, CF, SF, OF, PF, DF, IF, TF
> **Memory:** 256-byte sparse model; supports `[addr]`, `[BX]`, `[256+1]` addressing

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please keep commits focused and write meaningful commit messages.

---

## 📄 License & Contact

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

**Aneeque Shahid**
- GitHub: [@AneequeShahid](https://github.com/AneequeShahid)
- Email: aneequeshahid495@gmail.com

---

*Built as a COAL (Computer Organization & Assembly Language) semester project.*
