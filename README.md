# 🖥️ Visual8086 — 8086 Microprocessor Architecture Simulator

Visual8086 is a software simulator designed to visualize, step through, and execute **Intel 8086 Assembly instructions**. Written to demonstrate low-level computer architecture, it features register state monitoring, dynamic flag bit calculations, segment-based memory mapping, and a visual pipeline showing instruction execution cycle stages.

---

## 🚀 Key Features

* **Register Visualization**: Real-time display of 8086 registers:
  * General Purpose: `AX`, `BX`, `CX`, `DX` (and their high/low 8-bit splits `AH`, `AL`, etc.)
  * Index & Pointer: `SI`, `DI`, `SP`, `BP`, `IP`
  * Segment Registers: `CS`, `DS`, `SS`, `ES`
* **Dynamic Flags Calculation**: Real-time evaluation of the Status Flags register:
  * **CF** (Carry), **ZF** (Zero), **SF** (Sign), **OF** (Overflow), **PF** (Parity), and **AF** (Auxiliary Carry).
* **20-bit Physical Addressing**: Simulates the hardware address translation unit, demonstrating how segment registers combine with offsets to address 1 MB of physical memory:
  $$\text{Physical Address} = (\text{Segment} \times 0\text{x}10) + \text{Offset}$$
* **6-Stage Instruction Cycle Visualization**: Displays the internal steps of instruction execution:
  1. **Fetch**: Loads instructions from memory pointed to by `CS:IP`.
  2. **Decode**: Parses instructions into opcode and operands.
  3. **Calculate EA**: Resolves Effective Address for memory operands (e.g., `[BX + SI + displacement]`).
  4. **Fetch Operands**: Retrieves register values or memory contents.
  5. **Execute**: Performs ALU operations (arithmetic, bitwise manipulation).
  6. **Write Back**: Commits results to registers or memory.

---

## 🛠️ Technology Stack

* **Bare-metal Routines**: x86 Assembly (NASM / TASM)
* **Simulation Core**: C++ (OOP logic for ALU and memory space emulator)
* **Visualization Layer**: Interactive text console and register dashboard

---

## 📂 Repository Contents

* `F2024-0920-AneequeShahhid.ASM` — Main assembly routines implementing standard logical sequences.
* `Question1.asm` to `Question6.asm` — Assembly programs demonstrating bitwise manipulations, string conversions, index registers, and arithmetic loops.
* `README.md` — Project documentation.

---

## 🔍 Addressing Math Example

For an instruction accessing data at memory location `[BX + SI]`, where `DS = 0x2000`, `BX = 0x0100`, and `SI = 0x0050`:
1. **Offset (Effective Address)**: $0x0100 + 0x0050 = 0x0150$
2. **Segment Base**: $0x2000 \times 16 = 0x20000$
3. **Physical Address**: $0x20000 + 0x0150 = 0x20150$ (20-bit address)

---

## ⚙️ Running the Assembly Routines

To compile and execute the assembly scripts using **TASM** (Turbo Assembler) or **NASM**:

### Using TASM (DosBox Environment)
1. Assemble the file:
   ```bash
   tasm Question1.asm
   ```
2. Link the object code:
   ```bash
   tlink Question1.obj
   ```
3. Run or debug with Turbo Debugger:
   ```bash
   td Question1.exe
   ```

### Using NASM (Modern CLI)
1. Compile to a raw binary or object file:
   ```bash
   nasm -f win32 Question1.asm -o Question1.obj
   ```
2. Link using your compiler/linker (e.g., GCC or MSVC linker).

---

## 🎓 Academic Credit
Developed as a project for the Computer Organization and Assembly Language (COAL) course at **Beaconhouse National University (BNU)**.
