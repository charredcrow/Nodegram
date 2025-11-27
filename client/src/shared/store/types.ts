// Workspace mode types
export type WorkspaceMode = 'select' | 'connect' | 'pan';

// Save state types
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// Node type
export interface Node {
  id: number;
  type: string;
  x: number;
  y: number;
  title?: string;
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

// Link type
export interface Link {
  source: number;
  target: number;
  [key: string]: unknown;
}

// Calendar item type
export interface CalendarItem {
  id: string | number;
  date: string;
  [key: string]: unknown;
}

// Workspace data type
export interface WorkspaceData {
  name: string;
  wid: string;
  [key: string]: unknown;
}

// Transform type for saved transform state
export interface Transform {
  x: number;
  y: number;
  scale: number;
}

// Workspace state interface
export interface WorkspaceState {
  // Mode and UI state
  mode: WorkspaceMode;
  isLoading: boolean;
  initialLoading: boolean;
  isFading: boolean;

  // Workspace data
  nodes: Node[];
  links: Link[];
  calendar: CalendarItem[];

  // Node management
  addNode: string;
  nodeId: number | undefined;
  nodeData: (Node & { node?: Node; nodeColor?: string }) | null;
  updateNodeData: (Node & { node?: Node; nodeColor?: string }) | null;
  selectedNodes: number[];

  // Modal state
  isModalOpen: boolean;
  isMassDeleteModalOpen: boolean;
  showCalendar: boolean;

  // Transform and save state
  savedTransform: string | null;
  saveState: SaveState;

  // Refs (stored as objects with current property for compatibility)
  nodesRef: { current: Node[] } | null;
  linksRef: { current: Link[] } | null;
  calendarRef: { current: CalendarItem[] } | null;
  nodeEditorCenterRef: { current: { x: number; y: number } | null } | null;
  triggerUpdateRef: { current: (() => void) | null } | null;
}

// Workspace management state interface
export interface WorkspaceManagementState {
  workspaces: string[];
  workspaceData: WorkspaceData[];
  currentWid: string | null;
  widModeShared: boolean;
  userRole: string;
}

// Combined store state
export interface AppState extends WorkspaceState, WorkspaceManagementState {}

// Actions interface
export interface WorkspaceActions {
  // Mode actions
  setMode: (mode: WorkspaceMode) => void;

  // Loading actions
  setIsLoading: (loading: boolean) => void;
  setInitialLoading: (loading: boolean) => void;
  setIsFading: (fading: boolean) => void;

  // Data actions
  setNodes: (nodes: Node[]) => void;
  setLinks: (links: Link[]) => void;
  setCalendar: (calendar: CalendarItem[]) => void;

  // Node actions
  setAddNode: (type: string) => void;
  setNodeModal: (nodeId: number | undefined) => void;
  setNodeData: (data: (Node & { nodeColor?: string }) | null) => void;
  setUpdateNodeData: (data: (Node & { node?: Node; nodeColor?: string }) | null) => void;
  setSelectedNodes: (nodes: number[]) => void;

  // Modal actions
  setModalOpen: (open: boolean) => void;
  setIsMassDeleteModalOpen: (open: boolean) => void;
  setShowCalendar: (show: boolean) => void;
  openModal: () => void;
  closeModal: () => void;

  // Transform and save actions
  setSavedTransform: (transform: string | null) => void;
  setSaveState: (state: SaveState) => void;

  // Ref actions
  setNodesRef: (ref: { current: Node[] } | null) => void;
  setLinksRef: (ref: { current: Link[] } | null) => void;
  setCalendarRef: (ref: { current: CalendarItem[] } | null) => void;
  setNodeEditorCenterRef: (ref: { current: { x: number; y: number } | null } | null) => void;
  setTriggerUpdateRef: (ref: { current: (() => void) | null } | null) => void;
}

export interface WorkspaceManagementActions {
  setWorkspaces: (workspaces: string[]) => void;
  setWorkspaceData: (data: WorkspaceData[]) => void;
  setCurrentWid: (wid: string | null) => void;
  setWidModeShared: (shared: boolean) => void;
  handleWorkspacesUpdate: (updatedWorkspaces: WorkspaceData[]) => void;
  generateWid: () => string;
  createExampleNodes: () => Node[];
  createExampleLinks: (nodes: Node[]) => Link[];
}

export type AppStore = AppState & WorkspaceActions & WorkspaceManagementActions;
