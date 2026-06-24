import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useCPUStore } from '../../store/cpuStore';
import { useAnimationStore } from '../../store/animationStore';
import { assemblyLanguageDef, assemblyThemeDef } from '../../editor/assemblyLanguage';
import { CycleStage } from '../../engine/types';

export function CodeEditor() {
  const monaco = useMonaco();
  const { sourceCode, setSourceCode, errors, currentStepIndex, history, instructions } = useCPUStore();
  const { currentCycle, isAnimating } = useAnimationStore();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const snapshot = currentStepIndex >= 0 ? history[currentStepIndex] : null;
  const ip = snapshot ? snapshot.state.registers['IP'] : 0;
  const isFinished = history.length > 0 && instructions.length > 0 && !instructions.some(i => i.address === ip);
  const isEmptyCode = sourceCode.trim() === '';

  useEffect(() => {
    if (monaco) {
      monaco.languages.register({ id: 'assembly' });
      monaco.languages.setMonarchTokensProvider('assembly', assemblyLanguageDef as any);
      monaco.editor.defineTheme('assembly-dark', assemblyThemeDef as any);
      monaco.editor.setTheme('assembly-dark');
    }
  }, [monaco]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  // Highlight current line if executing
  useEffect(() => {
    if (!monaco || !editorRef.current) return;
    
    const editor = editorRef.current;
    
    if (currentStepIndex >= 0 && history[currentStepIndex]) {
      const currentInst = history[currentStepIndex].instruction;
      // In our simple engine, currentStepIndex is just pointing to history.
      // Wait, we want to highlight the next instruction if we are currently executing it, or the last one if we are paused?
      // During execution, the instruction we are currently animating is history[currentStepIndex] ? No, wait.
      // In CPUStore, step() executes and PUSHES to history. So if currentStepIndex is X, we are at the state AFTER instruction X finished.
      // Ah. If we are micro-stepping, step() hasn't been called yet.
      // We need to know which instruction is CURRENTLY executing.
      // Let's use the CPU's PC to find the next instruction.
      const snapshot = history[currentStepIndex];
      const pc = snapshot.state.pc;
      const { instructions } = useCPUStore.getState();
      
      let highlightLine = -1;
      
      if (isAnimating) {
        // We are currently animating the instruction at 'pc'
        const nextInst = instructions.find(i => i.address === pc);
        if (nextInst) highlightLine = nextInst.lineNumber;
      } else {
        // Paused, highlight the instruction that just finished or is next
        const nextInst = instructions.find(i => i.address === pc);
        if (nextInst) highlightLine = nextInst.lineNumber;
      }

      if (highlightLine > 0) {
        let className = 'bg-gray-800/50';
        let marginClass = 'gutter-indicator ';
        if (isAnimating) {
          switch (currentCycle) {
            case CycleStage.FETCH: className = 'bg-blue-500/20 border-l-2 border-blue-500'; marginClass += 'fetch'; break;
            case CycleStage.DECODE: className = 'bg-purple-500/20 border-l-2 border-purple-500'; marginClass += 'decode'; break;
            case CycleStage.EXECUTE: className = 'bg-orange-500/20 border-l-2 border-orange-500'; marginClass += 'execute'; break;
            case CycleStage.WRITEBACK: className = 'bg-emerald-500/20 border-l-2 border-emerald-500'; marginClass += 'writeback'; break;
          }
        }

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
          {
            range: new monaco.Range(highlightLine, 1, highlightLine, 1),
            options: {
              isWholeLine: true,
              className: className,
              glyphMarginClassName: marginClass,
            }
          }
        ]);
        
        // Ensure it's visible
        editor.revealLineInCenterIfOutsideViewport(highlightLine);
      } else {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [currentStepIndex, history, monaco, currentCycle, isAnimating]);

  return (
    <div className="h-full w-full relative">
      <Editor
        height="100%"
        defaultLanguage="assembly"
        theme="assembly-dark"
        value={sourceCode}
        onChange={(val) => setSourceCode(val || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          lineHeight: 24,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderLineHighlight: 'all',
          renderLineHighlightOnlyWhenFocus: true,
          glyphMargin: true,
        }}
      />
      {errors.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-brand-rose)] text-white p-2 text-xs font-mono">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}
      {errors.length === 0 && isEmptyCode && (
        <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-brand-rose)]/20 border-t border-[var(--color-brand-rose)]/40 text-[var(--color-brand-rose)] p-3 text-xs font-mono flex items-center gap-2 backdrop-blur-md">
          <span className="animate-pulse">⚠️</span>
          <span>No code provided. Please write some assembly code to execute.</span>
        </div>
      )}
      {errors.length === 0 && !isEmptyCode && isFinished && (
        <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-brand-amber)]/20 border-t border-[var(--color-brand-amber)]/40 text-[var(--color-brand-amber)] p-3 text-xs font-mono flex items-center gap-2 backdrop-blur-md">
          <span className="animate-pulse">⚠️</span>
          <span>Program execution completed! Click "Build & Reset" to run again.</span>
        </div>
      )}
    </div>
  );
}
