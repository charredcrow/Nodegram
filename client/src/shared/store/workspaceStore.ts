import { create } from 'zustand';
import type {
  AppStore,
  WorkspaceMode,
  SaveState,
  Node,
  Link,
  CalendarItem,
  WorkspaceData,
  Transform,
} from './types';
import { generateWid } from '../../entities/workspace/model/types';
import { createExampleNodes, createExampleLinks } from '../../entities/workspace/model/utils';

// Helper to create ref-like objects
const createRef = <T>(initialValue: T) => {
  return { current: initialValue };
};

const initialState = {
  // Mode and UI state
  mode: 'select' as WorkspaceMode,
  isLoading: true,
  initialLoading: true,
  isFading: true,

  // Workspace data
  nodes: [] as Node[],
  links: [] as Link[],
  calendar: [] as CalendarItem[],

  // Node management
  addNode: '',
  nodeId: undefined as number | undefined,
  nodeData: null as (Node & { nodeColor?: string }) | null,
  updateNodeData: null as (Node & { node?: Node; nodeColor?: string }) | null,
  selectedNodes: [] as number[],

  // Modal state
  isModalOpen: false,
  isMassDeleteModalOpen: false,
  showCalendar: false,

  // Transform and save state
  savedTransform: null as string | null,
  saveState: 'idle' as SaveState,

  // Workspace management
  workspaces: [] as string[],
  workspaceData: [] as WorkspaceData[],
  currentWid: null as string | null,
  widModeShared: false,
  userRole: 'admin',

  // Refs stored as objects with current property
  nodesRef: createRef<Node[]>([]),
  linksRef: createRef<Link[]>([]),
  calendarRef: createRef<CalendarItem[]>([]),
  nodeEditorCenterRef: createRef<{ x: number; y: number } | null>(null),
  triggerUpdateRef: createRef<(() => void) | null>(null),
};

export const useWorkspaceStore = create<AppStore>((set, get) => ({
  ...initialState,

  // Mode actions
  setMode: (mode: WorkspaceMode) => set({ mode }),

  // Loading actions
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setInitialLoading: (initialLoading: boolean) => set({ initialLoading }),
  setIsFading: (isFading: boolean) => set({ isFading }),

  // Data actions
  setNodes: (nodes: Node[]) => {
    const normalized = Array.isArray(nodes) ? nodes.map((n) => ({ ...n, id: Number(n.id) })) : [];
    const state = get();
    if (state.nodesRef) {
      state.nodesRef.current = normalized;
    }
    set({ nodes: normalized });
  },
  setLinks: (links: Link[]) => {
    const normalizedLinks = Array.isArray(links) ? links : [];
    const state = get();
    if (state.linksRef) {
      state.linksRef.current = normalizedLinks;
    }
    set({ links: normalizedLinks });
  },
  setCalendar: (calendar: CalendarItem[]) => {
    const state = get();
    if (state.calendarRef) {
      state.calendarRef.current = calendar;
    }
    set({ calendar });
  },

  // Node actions
  setAddNode: (addNode: string) => set({ addNode }),
  setNodeModal: (nodeId: number | undefined) => set({ nodeId }),
  setNodeData: (nodeData: (Node & { nodeColor?: string }) | null) => set({ nodeData }),
  setUpdateNodeData: (updateNodeData: (Node & { node?: Node; nodeColor?: string }) | null) =>
    set({ updateNodeData }),
  setSelectedNodes: (selectedNodes: number[]) => set({ selectedNodes }),

  // Modal actions
  setModalOpen: (isModalOpen: boolean) => set({ isModalOpen }),
  setIsMassDeleteModalOpen: (isMassDeleteModalOpen: boolean) => set({ isMassDeleteModalOpen }),
  setShowCalendar: (showCalendar: boolean) => set({ showCalendar }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  // Transform and save actions
  setSavedTransform: (savedTransform: string | null) => set({ savedTransform }),
  setSaveState: (saveState: SaveState) => set({ saveState }),

  // Ref actions
  setNodesRef: (nodesRef) => set({ nodesRef }),
  setLinksRef: (linksRef) => set({ linksRef }),
  setCalendarRef: (calendarRef) => set({ calendarRef }),
  setNodeEditorCenterRef: (nodeEditorCenterRef) => set({ nodeEditorCenterRef }),
  setTriggerUpdateRef: (triggerUpdateRef) => set({ triggerUpdateRef }),

  // Workspace management actions
  setWorkspaces: (workspaces: string[]) => set({ workspaces }),
  setWorkspaceData: (workspaceData: WorkspaceData[]) => set({ workspaceData }),
  setCurrentWid: (currentWid: string | null) => set({ currentWid }),
  setWidModeShared: (widModeShared: boolean) => set({ widModeShared }),
  handleWorkspacesUpdate: (updatedWorkspaces: WorkspaceData[]) => {
    const workspaceNames = updatedWorkspaces.map((ws) => ws.name);
    set({
      workspaceData: updatedWorkspaces,
      workspaces: workspaceNames,
    });
  },

  // Utility functions from workspace model
  generateWid,
  createExampleNodes,
  createExampleLinks,
}));
