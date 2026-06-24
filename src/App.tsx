import React from 'react';
import { Panel } from './components/common/Panel';
import { Cpu, Code2, Layers, AlignLeft, Clock } from 'lucide-react';

import { CodeEditor } from './components/Editor/CodeEditor';
import { ControlBar } from './components/Editor/ControlBar';
import { ExamplePrograms } from './components/Editor/ExamplePrograms';

import { CPUDiagram } from './components/CPU/CPUDiagram';

import { RegisterPanel } from './components/Registers/RegisterPanel';
import { MemoryPanel } from './components/Memory/MemoryPanel';
import { ExecutionTimeline } from './components/Timeline/ExecutionTimeline';
import { CPU3DModal } from './components/CPU3D/CPU3DModal';
import { useAnimationStore } from './store/animationStore';
import { Maximize2 } from 'lucide-react';

function App() {
  const { setIs3DModalOpen } = useAnimationStore();
  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col md:grid md:gap-4 md:grid-cols-12 md:grid-rows-[1fr_250px] md:h-screen md:overflow-hidden text-sm bg-[var(--background)] gap-4">
      
      {/* Left Column: Editor (spans 4 columns) */}
      <Panel 
        title="Assembly Editor" 
        icon={<Code2 size={16} />} 
        className="md:col-span-4 h-[50vh] md:h-full"
        headerRight={<ExamplePrograms />}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0">
            <CodeEditor />
          </div>
          <ControlBar />
        </div>
      </Panel>

      {/* Middle Column: CPU Visualization (spans 5 columns) */}
      <Panel 
        title="CPU Architecture" 
        icon={<Cpu size={16} />} 
        className="md:col-span-5 h-[45vh] md:h-full"
        headerRight={
          <button 
            onClick={() => setIs3DModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[var(--color-brand-teal)] hover:text-white hover:bg-[var(--color-brand-teal)]/20 rounded transition-colors border border-[var(--color-brand-teal)]/30"
          >
            <Maximize2 size={12} /> Expand 3D View
          </button>
        }
      >
        <CPUDiagram />
      </Panel>

      {/* Right Column: Registers & Memory (spans 3 columns) */}
      <div className="md:col-span-3 flex flex-col gap-4 h-[65vh] md:h-full overflow-hidden">
        <Panel 
          title="Registers" 
          icon={<AlignLeft size={16} />} 
          className="flex-[3] min-h-0"
        >
          <div className="p-4 h-full">
            <RegisterPanel />
          </div>
        </Panel>
        
        <Panel 
          title="Memory Map" 
          icon={<Layers size={16} />} 
          className="flex-[2] min-h-0"
        >
          <div className="p-4 h-full">
            <MemoryPanel />
          </div>
        </Panel>
      </div>

      {/* Bottom Row: Timeline (spans all 12 columns) */}
      <Panel 
        title="Execution Timeline" 
        icon={<Clock size={16} />} 
        className="md:col-span-12 row-start-2 min-h-[30vh] md:min-h-0"
      >
        <ExecutionTimeline />
      </Panel>

      <CPU3DModal />
    </div>
  );
}

export default App;
