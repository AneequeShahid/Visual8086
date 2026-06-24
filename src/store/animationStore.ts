import { create } from 'zustand';
import { CycleStage } from '../engine/types';

export type ComponentId = 'PC' | 'MAR' | 'MDR' | 'IR' | 'ALU' | 'REGS' | 'MEM' | 'CU';

interface AnimationStore {
  activeComponents: ComponentId[];
  activePaths: string[];
  currentCycle: CycleStage;
  isAnimating: boolean;
  is3DModalOpen: boolean;
  currentSubStep: number;
  
  setActiveComponents: (components: ComponentId[]) => void;
  setActivePaths: (paths: string[]) => void;
  setCurrentCycle: (cycle: CycleStage) => void;
  setIsAnimating: (animating: boolean) => void;
  setIs3DModalOpen: (isOpen: boolean) => void;
  setCurrentSubStep: (step: number) => void;
  resetAnimations: () => void;
}

export const useAnimationStore = create<AnimationStore>((set) => ({
  activeComponents: [],
  activePaths: [],
  currentCycle: CycleStage.IDLE,
  isAnimating: false,
  is3DModalOpen: false,
  currentSubStep: 0,

  setActiveComponents: (components) => set({ activeComponents: components }),
  setActivePaths: (paths) => set({ activePaths: paths }),
  setCurrentCycle: (cycle) => set({ currentCycle: cycle }),
  setIsAnimating: (animating) => set({ isAnimating: animating }),
  setIs3DModalOpen: (isOpen) => set({ is3DModalOpen: isOpen }),
  setCurrentSubStep: (step) => set({ currentSubStep: step }),
  resetAnimations: () => set({ activeComponents: [], activePaths: [], currentCycle: CycleStage.IDLE, isAnimating: false, currentSubStep: 0 })
}));
