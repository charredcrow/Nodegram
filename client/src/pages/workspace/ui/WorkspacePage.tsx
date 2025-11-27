import { useEffect, useRef } from 'react';

import { NodeGraph } from '../../../widgets/node-graph';
import { WorkspaceToolbar } from '../../../widgets/workspace-toolbar';
import { WorkspaceCalendar } from '../../../widgets/workspace-calendar';
import { NodeModal } from '../../../widgets/node-modal';

import {
  getNodesClipboard,
  clearNodesClipboard,
  fetchUserWorkspace,
} from '../../../shared/api/workspace';
import { PageLoader } from '../../../shared/ui';
import { useNotification } from '../../../app/providers/NotificationProvider';

import { useWorkspaceStore } from '../../../shared/store';
import { useWorkspaceManagement } from '../../../features/workspace-management';
import { useNodeManagement } from '../../../features/node-management';
import { useWorkspaceImportExport } from '../../../features/workspace-import-export';
import { FiDownload, FiUpload } from 'react-icons/fi';
import {
  typeNodeName,
  typeColors,
  typeWidths,
  nodeDescription,
  typeDefaultContent,
  nodeIcons,
} from '../../../entities/node/model';
import type { Node, Link, CalendarItem } from '../../../shared/store/types';

import './WorkspaceTransition.css';
import './WorkspaceIOButtons.css';

const DRAFT_KEY_PREFIX = '_ng_draft_';

interface WorkspaceState {
  nodes: Node[];
  links: Link[];
  calendar: CalendarItem[];
  transform: string;
}

export const WorkspacePage = () => {
  const { showNotification } = useNotification();

  // Use Zustand store for state management
  const {
    mode,
    setMode,
    nodes,
    setNodes,
    links,
    setLinks,
    calendar,
    setCalendar,
    addNode,
    setAddNode,
    isLoading,
    setIsLoading,
    nodeId,
    setNodeModal,
    nodeData,
    setNodeData,
    updateNodeData,
    setUpdateNodeData,
    isModalOpen,
    setModalOpen,
    showCalendar,
    setShowCalendar,
    selectedNodes,
    setSelectedNodes,
    isMassDeleteModalOpen,
    setIsMassDeleteModalOpen,
    isFading,
    setIsFading,
    initialLoading,
    setInitialLoading,
    savedTransform,
    setSavedTransform,
    // saveState, // Not used currently
    // setSaveState, // Not used currently
    nodesRef,
    linksRef,
    calendarRef,
    nodeEditorCenterRef,
    triggerUpdateRef,
    openModal,
    closeModal,
  } = useWorkspaceStore();

  const {
    // workspaces, // Not used currently
    setWorkspaces,
    // workspaceData, // Not used currently
    setWorkspaceData,
    currentWid,
    setCurrentWid,
    widModeShared,
    setWidModeShared,
    userRole,
    // handleWorkspacesUpdate, // Not used currently
    generateWid,
    createExampleNodes,
    createExampleLinks,
  } = useWorkspaceManagement();

  const { updateNodes, deleteNodeAndLinks } = useNodeManagement();
  // updateNodesRefOnly is not used in this component

  const { exportWorkspace, handleImportClick } = useWorkspaceImportExport();

  // Trigger for updating NodeEditor screen after editing node information
  const triggerNodeEditorUpdate = () => {
    if (triggerUpdateRef && triggerUpdateRef.current) {
      triggerUpdateRef.current();
    }
  };

  // Refs for autosave (not used, but needed for compatibility)
  const draggingRef = useRef(false);
  const lastTransformRef = useRef('');
  const isDirtyRef = useRef(false);
  const lastSavedSignatureRef = useRef('');
  const lastSavedStateRef = useRef<WorkspaceState | null>(null);
  const blockAutosaveRef = useRef(false);

  // Function to compute state signature (for tracking changes)
  const computeSignature = (state: WorkspaceState): string => {
    try {
      return JSON.stringify({
        nodes: state.nodes || [],
        links: state.links || [],
        calendar: state.calendar || [],
        transform: state.transform || '',
      });
    } catch {
      return '';
    }
  };

  // Function for deep cloning state
  const deepCloneState = (state: WorkspaceState): WorkspaceState => {
    try {
      return JSON.parse(
        JSON.stringify({
          nodes: state.nodes || [],
          links: state.links || [],
          calendar: state.calendar || [],
          transform: state.transform || '',
        })
      );
    } catch {
      return {
        nodes: [],
        links: [],
        calendar: [],
        transform: '',
      };
    }
  };

  const handleScaleFit = () => {
    if (nodeEditorCenterRef?.current && 'scaleFit' in nodeEditorCenterRef.current) {
      (nodeEditorCenterRef.current as { scaleFit: () => void }).scaleFit();
    }
  };

  // Function to show calendar - change state to show component
  const handleCalendar = () => {
    setShowCalendar(true);
  };

  // Stubs for save functions (disabled, working only locally)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSaveWorkspace = async () => {
    // Saving disabled - data stored only in memory
    return { status: 'success' };
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _performSaveWithState = async () => {
    // Saving disabled - data stored only in memory
    showNotification('Data is stored only in memory', 'info', 2000);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _resetChangeCounters = () => {
    // Counters not used
  };

  const updateChangeCounters = (_changeType: string, _count = 1) => {
    // Counters not used
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _scheduleAutosave = () => {
    // Autosave disabled
  };

  // Track pointer events on main graph (autosave disabled)
  useEffect(() => {
    const mainGraph = document.querySelector('#main_graph');
    if (!mainGraph) return;
    const onPointerDown = () => {
      draggingRef.current = true;
      // Autosave disabled in selectMove mode
    };
    const onPointerUp = () => {
      draggingRef.current = false;
      // Autosave disabled in selectMove mode
    };
    mainGraph.addEventListener('pointerdown', onPointerDown);
    mainGraph.addEventListener('pointerup', onPointerUp);
    mainGraph.addEventListener('pointercancel', onPointerUp);
    return () => {
      mainGraph.removeEventListener('pointerdown', onPointerDown);
      mainGraph.removeEventListener('pointerup', onPointerUp);
      mainGraph.removeEventListener('pointercancel', onPointerUp);
    };
  }, [currentWid, initialLoading, isLoading, isFading]);

  // Trigger changes from child components (move/group shift, etc.)
  const notifyWorkspaceChanged = () => {
    // Changes tracked only in memory
  };

  // Stubs for draft functions (disabled)
  // These functions are kept for potential future use
  const saveDraft = (_force = false) => {
    // Draft saving disabled
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _saveDraftThrottled = () => {
    // Draft saving disabled
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _loadDraft = (_wid: string) => {
    // Draft loading disabled
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _mergeWorkspaceWithDraft = (_serverData: WorkspaceState) => {
    // Merging not used
    return { nodes: [], links: [], calendar: [], transform: '' };
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _applyDiffDraftToServer = (_serverData: WorkspaceState) => {
    // Diff application not used
    return { nodes: [], links: [], calendar: [], transform: '' };
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _buildMergedFromServer = (_serverData: WorkspaceState) => {
    // Simply return data as is (without merging with draft)
    return {
      nodes: [],
      links: [],
      calendar: [],
      transform: 'translate(0,0) scale(1)',
    };
  };

  const tryRestoreDraftIntoState = (_serverData: WorkspaceState) => {
    // Draft restoration disabled
    // If local draft is empty - don't send anything to server
    try {
      const rd = localStorage.getItem(DRAFT_KEY_PREFIX + currentWid);
      if (rd) {
        const parsed = JSON.parse(rd);
        const d = parsed?.data || {};
        const del = parsed?.deleted || {};
        const draftEmpty =
          !d.transform &&
          Array.isArray(d.nodes) &&
          d.nodes.length === 0 &&
          Array.isArray(d.links) &&
          d.links.length === 0 &&
          Array.isArray(d.calendar) &&
          d.calendar.length === 0 &&
          Array.isArray(del.nodes) &&
          del.nodes.length === 0 &&
          Array.isArray(del.links) &&
          del.links.length === 0 &&
          Array.isArray(del.calendar) &&
          del.calendar.length === 0;
        if (draftEmpty) {
          return { status: 'noop' };
        }
      }
    } catch {
      // Ignore errors
    }
  };

  // Add handler for workspace selection
  // This function is kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleWorkspaceSelect = async (_wid: string) => {
    if (currentWid === _wid) return;

    // Start fade out
    setIsFading(true);

    // Wait for fade out animation to complete (300ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Save current workspace
      // if (currentWid) {
      //     await handleSaveWorkspace();
      // }

      // Reset states
      setMode('select');
      setAddNode('');
      setNodeModal(undefined);
      setNodeData(null);
      setUpdateNodeData(null);

      // Set new wid
      setCurrentWid(_wid);
      setWidModeShared(false);

      localStorage.setItem('_sn_c', _wid + '_ng_hwl');

      // For local workspaces create new example data
      const exampleNodes = createExampleNodes();
      const exampleLinks = createExampleLinks(exampleNodes);

      setNodes(exampleNodes);
      setLinks(exampleLinks);
      setCalendar([]);
      if (nodesRef) {
        nodesRef.current = exampleNodes;
      }
      setSavedTransform('translate(0,0) scale(1)');

      if (triggerUpdateRef && triggerUpdateRef.current) {
        try {
          triggerUpdateRef.current();
        } catch {
          // Ignore errors
        }
      }

      // Wait 50ms before fade in
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Do fade in
      setIsFading(false);
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (error as { message?: string })?.message ||
        'Failed to switch workspace';
      showNotification(errorMessage, 'error', 5000);

      await new Promise((resolve) => setTimeout(resolve, 50));

      setIsFading(false);
    }
  };

  // Add handler for invited workspace selection
  // This function is kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleWorkspaceSelectInvited = async (_wid: string) => {
    if (currentWid === _wid) return;

    // Start fade out
    setIsFading(true);

    // Wait for fade out animation to complete (300ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Save current workspace
      // if (currentWid) {
      //     await handleSaveWorkspace();
      // }

      // Reset states
      setMode('select');
      setAddNode('');
      setNodeModal(undefined);
      setNodeData(null);
      setUpdateNodeData(null);

      // Set new wid
      setCurrentWid(_wid);
      setWidModeShared(true);

      localStorage.setItem('_sn_c', _wid + '_ng_hwli');

      // For local workspaces create new example data
      const exampleNodes = createExampleNodes();
      const exampleLinks = createExampleLinks(exampleNodes);

      setNodes(exampleNodes);
      setLinks(exampleLinks);
      setCalendar([]);
      if (nodesRef) {
        nodesRef.current = exampleNodes;
      }
      setSavedTransform('translate(0,0) scale(1)');

      if (triggerUpdateRef && triggerUpdateRef.current) {
        try {
          triggerUpdateRef.current();
        } catch {
          // Ignore errors
        }
      }

      // Wait 50ms before fade in
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Do fade in
      setIsFading(false);
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (error as { message?: string })?.message ||
        'Failed to switch workspace';
      showNotification(errorMessage, 'error', 5000);

      await new Promise((resolve) => setTimeout(resolve, 50));

      setIsFading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setIsFading(true);

      try {
        // Create local workspaces (stored only in memory)
        const localWorkspaces = [
          {
            wid: generateWid(),
            name: 'My Workspace',
          },
        ];

        setWorkspaceData(localWorkspaces);
        setWorkspaces(localWorkspaces.map((ws) => ws.name));

        // Set initial wid
        const savedWid = localStorage.getItem('_sn_c');
        const firstWorkspace = localWorkspaces[0];
        if (!firstWorkspace) {
          throw new Error('No workspaces available');
        }
        let initialWid = savedWid ? savedWid.split('_ng_')[0] : firstWorkspace.wid;

        // Check if saved wid exists
        const workspaceExists = localWorkspaces.find((ws) => ws.wid === initialWid);
        if (!workspaceExists) {
          initialWid = firstWorkspace.wid;
        }

        setCurrentWid(initialWid || null);
        if (initialWid) {
          localStorage.setItem('_sn_c', initialWid + '_ng_hwl');
        }

        // Create example nodes and links
        const exampleNodes = createExampleNodes();
        const exampleLinks = createExampleLinks(exampleNodes);

        // Save default nodes to localStorage if not already there
        const storageKey = `_ng_workspace_${initialWid}`;
        const existingData = localStorage.getItem(storageKey);
        if (!existingData) {
          const workspaceDataToSave = {
            nodes: exampleNodes,
            links: exampleLinks,
            calendar: [],
            transform: 'translate(0,0) scale(1)',
          };
          localStorage.setItem(storageKey, JSON.stringify(workspaceDataToSave));
        }

        setNodes(exampleNodes);
        setLinks(exampleLinks);
        setCalendar([]);
        if (nodesRef) {
          nodesRef.current = exampleNodes;
        }
        setSavedTransform('translate(0,0) scale(1)');

        if (triggerUpdateRef && triggerUpdateRef.current) {
          try {
            triggerUpdateRef.current();
          } catch {
            // Ignore errors
          }
        }

        // Wait a bit before fade in
        await new Promise((resolve) => setTimeout(resolve, 50));
        setIsFading(false);
      } catch (error) {
        const errorMessage =
          (error as { message?: string })?.message || 'Error during initialization';
        showNotification(errorMessage, 'error', 5000);
      } finally {
        setIsLoading(false);
        setInitialLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update refs for links and calendar
  useEffect(() => {
    if (Array.isArray(links) && linksRef) {
      linksRef.current = [...links];
    }
    if (Array.isArray(calendar) && calendarRef) {
      calendarRef.current = [...calendar];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links, calendar]);

  // Observe transform changes on #main_graph for smart autosave
  useEffect(() => {
    const mainGraph = document.querySelector('#main_graph');
    if (!mainGraph) return;
    lastTransformRef.current = mainGraph.getAttribute('transform') || '';
    const observer = new MutationObserver(() => {
      const t = mainGraph.getAttribute('transform') || '';
      if (t !== lastTransformRef.current) {
        lastTransformRef.current = t;
        if (!currentWid) return;
        if (initialLoading || isLoading || isFading) return;
        if (widModeShared && userRole === 'viewer') return;
        // Use smart autosave only if NOT dragging
        if (!draggingRef.current) {
          updateChangeCounters('transform');
        }
        isDirtyRef.current = true;
      }
    });
    observer.observe(mainGraph, { attributes: true, attributeFilter: ['transform'] });
    return () => observer.disconnect();
  }, [currentWid, initialLoading, isLoading, isFading, widModeShared, userRole, mode]);

  // Update useEffect for loading workspace data
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (currentWid) {
        setIsLoading(true);

        const workspaceData = await fetchUserWorkspace(currentWid);

        if (workspaceData.status === 'success' && workspaceData.workspace) {
          setNodes([]);
          setLinks([]);
          setCalendar([]);
          if (nodesRef) {
            nodesRef.current = [];
          }

          const wsNodes = (workspaceData.workspace.nodes || []).map((n) => ({
            ...n,
            id: Number(n.id),
          }));
          setNodes(wsNodes);

          setLinks(workspaceData.workspace.links || []);
          setCalendar(workspaceData.workspace.calendar || []);
          if (nodesRef) {
            nodesRef.current = wsNodes;
          }

          // If there are copied nodes in clipboard - insert them here with new ids
          const clipboard = getNodesClipboard();

          if (clipboard.nodes && clipboard.nodes.length > 0) {
            const existing = wsNodes || [];

            const maxId = existing.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);

            let nextId = maxId + 1;

            // Calculate visible area in graph coordinates from saved transform
            const parseTransform = (t: string) => {
              if (!t || typeof t !== 'string') return { tx: 0, ty: 0, k: 1 };

              const mt = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(t);
              const ms = /scale\(([-\d.]+)\)/.exec(t);

              return {
                tx: mt && mt[1] ? parseFloat(mt[1]) : 0,
                ty: mt && mt[2] ? parseFloat(mt[2]) : 0,
                k: ms && ms[1] ? parseFloat(ms[1]) : 1,
              };
            };

            const workspaceTransform =
              (workspaceData.workspace as { transform?: string }).transform ||
              'translate(0,0) scale(1)';
            const { tx, ty, k } = parseTransform(workspaceTransform);

            const vw = window.innerWidth || 0;

            const viewLeftGX = -tx / (k || 1);
            const viewTopGY = -ty / (k || 1);
            const viewCenterGX = (-tx + vw / 2) / (k || 1);

            // Bounding box of copied nodes
            const srcNodes = clipboard.nodes;

            const minX = Math.min(...srcNodes.map((n) => Number(n.x) || 0));
            const minY = Math.min(...srcNodes.map((n) => Number(n.y) || 0));
            const maxX = Math.max(...srcNodes.map((n) => Number(n.x) || 0));
            const maxY = Math.max(...srcNodes.map((n) => Number(n.y) || 0));

            const groupWidth = Math.max(0, maxX - minX);
            const groupHeight = Math.max(0, maxY - minY);

            // Bounding box of existing nodes to avoid intersections
            const exMinX = existing.length ? Math.min(...existing.map((n) => Number(n.x) || 0)) : 0;
            const exMaxX = existing.length ? Math.max(...existing.map((n) => Number(n.x) || 0)) : 0;
            const exMinY = existing.length ? Math.min(...existing.map((n) => Number(n.y) || 0)) : 0;

            const exCenterX = existing.length ? (exMinX + exMaxX) / 2 : viewCenterGX;

            // Align group to center of screen on X, and to top edge of visible area on Y
            const targetLeftGX = Math.max(viewLeftGX + 20, 0);

            // On X - center relative to existing distribution (or screen)
            const baseX = exCenterX - groupWidth / 2 - minX;

            // On Y - place above all existing nodes with large offset
            const aboveExistingY = exMinY - groupHeight - 500 - minY;

            const baseY = isFinite(aboveExistingY) ? aboveExistingY : viewTopGY + 500 - minY;

            const adjustX = isFinite(baseX) ? baseX : targetLeftGX - minX;
            const adjustY = isFinite(baseY) ? baseY : viewTopGY + 500 - minY;

            // Save mapping of old id to new
            const idMap = new Map<number, number>();

            const reid = srcNodes.map((n) => {
              const nid = nextId++;
              idMap.set(Number(n.id), nid);
              return {
                ...n,
                id: nid,
                x: (Number(n.x) || 0) + adjustX,
                y: (Number(n.y) || 0) + adjustY,
              };
            });

            // Transfer valid links, only if both sides are in idMap
            const srcLinks = Array.isArray(clipboard.links) ? clipboard.links : [];

            const remappedLinks = srcLinks
              .filter((l) => idMap.has(Number(l.source)) && idMap.has(Number(l.target)))
              .map((l) => ({
                source: idMap.get(Number(l.source))!,
                target: idMap.get(Number(l.target))!,
              }));

            const merged = [...existing, ...reid];

            setNodes(merged);
            if (nodesRef) {
              nodesRef.current = merged;
            }

            // Add links to current set of links
            setLinks([...(workspaceData.workspace.links || []), ...remappedLinks]);

            clearNodesClipboard();
          }

          // Set saved transform
          setSavedTransform(workspaceData.workspace.transform || '');

          // Fix server state signature as last saved
          lastSavedSignatureRef.current = computeSignature({
            nodes: workspaceData.workspace.nodes || [],
            links: workspaceData.workspace.links || [],
            calendar: workspaceData.workspace.calendar || [],
            transform: workspaceData.workspace.transform || '',
          });
          lastSavedStateRef.current = deepCloneState({
            nodes: workspaceData.workspace.nodes || [],
            links: workspaceData.workspace.links || [],
            calendar: workspaceData.workspace.calendar || [],
            transform: workspaceData.workspace.transform || '',
          });
          isDirtyRef.current = false;

          // Try to restore unsaved local changes on top of server data
          tryRestoreDraftIntoState({
            nodes: workspaceData.workspace.nodes || [],
            links: workspaceData.workspace.links || [],
            calendar: workspaceData.workspace.calendar || [],
            transform: workspaceData.workspace.transform || '',
          });
        }

        setIsLoading(false);
      }
    };

    loadWorkspaceData();
  }, [currentWid, setIsLoading, setNodes, setLinks, setCalendar, setSavedTransform, nodesRef]);

  // Save draft on tab close/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft(true);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveDraft(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentWid, links, calendar]);

  useEffect(() => {
    if (nodeId) {
      const getNodeId = nodeId.toString().split('_')[0];

      const node = nodes.find((n) => Number(n.id) === Number(getNodeId));

      if (node) {
        const nodeColor =
          (node as Node & { nodeColor?: string }).nodeColor || 
          typeColors[node.type as keyof typeof typeColors] ||
          '#2383ed';

        const newNodeData = {
          ...node,
          node: {
            ...node,
            nodeColor: nodeColor,
          },
          nodeColor: nodeColor,
        };

        // Only update if nodeData is different or null
        if (!nodeData || (nodeData as Node & { node?: Node }).node?.id !== node.id) {
          setNodeData(newNodeData as Node & { node?: Node; nodeColor: string });
        }
      }
    } else {
      // Clear nodeData when nodeId is cleared
      if (nodeData) {
        setNodeData(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, nodes]);

  useEffect(() => {
    if (nodeData && !isModalOpen) {
      openModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeData]);

  useEffect(() => {
    if (updateNodeData) {
      // Create updated array of nodes
      const currentNodes = nodesRef?.current || nodes;
      const updatedNodes = currentNodes.map((node) =>
        Number(node.id) === Number((updateNodeData as Node & { node: Node }).node.id)
          ? {
              ...(updateNodeData as Node & { node: Node; nodeColor: string }).node,
              nodeColor: (updateNodeData as Node & { nodeColor: string }).nodeColor,
            }
          : node
      );

      // If node is new, add it
      const isNewNode = !currentNodes.some(
        (node) => Number(node.id) === Number((updateNodeData as Node & { node: Node }).node.id)
      );

      if (isNewNode) {
        updatedNodes.push({
          ...(updateNodeData as Node & { node: Node }).node,
          nodeColor: (updateNodeData as Node & { nodeColor: string }).nodeColor,
        });
      }

      // Update node state and ref
      updateNodes(updatedNodes);

      // Clear updateNodeData to prevent infinite loop
      setUpdateNodeData(null);

      triggerNodeEditorUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateNodeData]);

  const openNodeModal = (nodeId: number | string) => {
    // First close current modal
    closeModal();

    // Small delay for smooth transition
    setTimeout(() => {
      const node = nodes.find((n) => Number(n.id) === Number(nodeId));

      if (node) {
        const nodeColor =
          (node as Node & { nodeColor?: string }).nodeColor ||
          typeColors[node.type as keyof typeof typeColors] ||
          '#2383ed';

        const newNodeData = { ...node, node, nodeColor };

        setNodeData(newNodeData as Node & { node?: Node; nodeColor: string });
        setModalOpen(true);
      }
    }, 100);
  };

  const handleMassDelete = () => {
    setIsMassDeleteModalOpen(true);
  };

  // Function for importing workspace
  const handleImportWorkspace = async (importData: {
    nodes?: Node[];
    links?: Link[];
    calendar?: CalendarItem[];
    transform?: string;
  }) => {
    if (!currentWid) {
      showNotification('No active workspace to import into', 'error', 3000);
      return;
    }

    try {
      // Additional security check on frontend
      if (!importData || typeof importData !== 'object') {
        throw new Error('Invalid import data');
      }

      // Check data sizes (protection against too large imports)
      const totalSize = JSON.stringify(importData).length;
      if (totalSize > 5 * 1024 * 1024) {
        // 5MB limit
        throw new Error('Import data too large (max 5MB)');
      }

      // Check node count (protection against overflow)
      if (Array.isArray(importData.nodes) && importData.nodes.length > 1000) {
        throw new Error('Too many nodes (max 1000)');
      }

      // Check link count
      if (Array.isArray(importData.links) && importData.links.length > 2000) {
        throw new Error('Too many links (max 2000)');
      }

      // Check calendar event count
      if (Array.isArray(importData.calendar) && importData.calendar.length > 500) {
        throw new Error('Too many calendar events (max 500)');
      }

      // Normalize import data
      const normalizedData = {
        nodes: Array.isArray(importData.nodes) ? importData.nodes : [],
        links: Array.isArray(importData.links) ? importData.links : [],
        calendar: Array.isArray(importData.calendar) ? importData.calendar : [],
        transform: importData.transform || 'translate(0,0) scale(1)',
      };

      // Check node ID uniqueness
      const nodeIds = new Set<number>();
      const duplicateIds: number[] = [];
      normalizedData.nodes.forEach((node) => {
        if (nodeIds.has(Number(node.id))) {
          duplicateIds.push(Number(node.id));
        } else {
          nodeIds.add(Number(node.id));
        }
      });

      if (duplicateIds.length > 0) {
        throw new Error(
          `Duplicate node IDs found: ${duplicateIds.slice(0, 5).join(', ')}${
            duplicateIds.length > 5 ? '...' : ''
          }`
        );
      }

      // Check link correctness
      const validNodeIds = new Set(normalizedData.nodes.map((n) => Number(n.id)));
      const invalidLinks: string[] = [];
      normalizedData.links.forEach((link) => {
        if (!validNodeIds.has(Number(link.source)) || !validNodeIds.has(Number(link.target))) {
          invalidLinks.push(`${link.source}->${link.target}`);
        }
      });

      if (invalidLinks.length > 0) {
        throw new Error(
          `Invalid links found: ${invalidLinks.slice(0, 5).join(', ')}${
            invalidLinks.length > 5 ? '...' : ''
          }`
        );
      }

      // Show import start notification
      showNotification('Importing workspace...', 'info', 2000);

      // Apply imported data
      setNodes(normalizedData.nodes);
      if (nodesRef) {
        nodesRef.current = normalizedData.nodes;
      }
      setLinks(normalizedData.links);
      setCalendar(normalizedData.calendar);
      setSavedTransform(normalizedData.transform);

      // Remove autosave lock after import
      blockAutosaveRef.current = false;

      // Update state as "dirty" for autosave
      isDirtyRef.current = true;

      // Update base state for diff save
      lastSavedStateRef.current = deepCloneState({
        nodes: normalizedData.nodes,
        links: normalizedData.links,
        calendar: normalizedData.calendar,
        transform: normalizedData.transform,
      });

      // Update last saved state signature
      lastSavedSignatureRef.current = computeSignature({
        nodes: normalizedData.nodes,
        links: normalizedData.links,
        calendar: normalizedData.calendar,
        transform: normalizedData.transform,
      });

      // Save imported data to draft
      if (currentWid) {
        // First clear old draft
        try {
          localStorage.removeItem(DRAFT_KEY_PREFIX + currentWid);
        } catch {
          // Ignore errors
        }
        // Then save new data as draft
        saveDraft(true);
      }

      // Update NodeEditor if needed
      if (triggerUpdateRef && triggerUpdateRef.current) {
        try {
          triggerUpdateRef.current();
        } catch {
          // Ignore errors
        }
      }

      showNotification('Workspace imported successfully', 'success', 3000);
    } catch (error) {
      const errorMessage = (error as { message?: string })?.message || 'Failed to import workspace';
      showNotification(errorMessage, 'error', 5000);
      // Error logged via notification
    }
  };

  // Function for searching nodes
  const handleNodeSearchChange = (_searchTerm: string) => {
    // TODO: Implement node search
  };

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className={`workspace-content ${isFading ? 'fade-out' : 'fade-in'}`}>
            {/* Import/Export buttons in top right */}
            {(userRole === 'admin' || userRole === 'editor') && (
              <div className="workspace-import-export-buttons">
                <button
                  className="workspace-io-button"
                  onClick={handleImportClick}
                  title="Import Workspace"
                  aria-label="Import Workspace"
                >
                  <FiUpload />
                  <span>Import</span>
                </button>
                <button
                  className="workspace-io-button"
                  onClick={exportWorkspace}
                  title="Export Workspace"
                  aria-label="Export Workspace"
                >
                  <FiDownload />
                  <span>Export</span>
                </button>
              </div>
            )}

            {(userRole === 'admin' || userRole === 'editor') && (
              <WorkspaceToolbar
                onModeChange={setMode}
                mode={mode}
                onTypeSelect={setAddNode}
                typeColors={typeColors}
                typeWidths={typeWidths}
                typeNodeName={typeNodeName}
                nodeIcons={nodeIcons}
                nodesData={nodesRef?.current || []}
                links={links}
                nodeDescription={nodeDescription}
                triggerScaleFit={handleScaleFit}
                selectedNodes={selectedNodes}
                onDeleteSelectedNodes={handleMassDelete}
                triggerCalendar={handleCalendar}
              />
            )}

            <NodeGraph
              nodes={nodes}
              setNodes={setNodes}
              mode={mode}
              newNode={addNode}
              links={links}
              setLinks={setLinks}
              typeColors={typeColors}
              typeWidths={typeWidths}
              setNodeModal={setNodeModal}
              typeNodeName={typeNodeName}
              registerTrigger={(trigger: () => void) => {
                if (triggerUpdateRef) {
                  triggerUpdateRef.current = trigger;
                }
              }}
              typeDefaultContent={typeDefaultContent}
              deleteNodeAndLinks={deleteNodeAndLinks}
              updateNodes={updateNodes}
              nodeEditorCenterRef={nodeEditorCenterRef}
              savedTransform={savedTransform}
              selectedNodes={selectedNodes}
              setSelectedNodes={setSelectedNodes}
              isMassDeleteModalOpen={isMassDeleteModalOpen}
              setIsMassDeleteModalOpen={setIsMassDeleteModalOpen}
              currentWid={currentWid}
              widModeShared={widModeShared}
              onModeChange={setMode}
              onWorkspaceChange={notifyWorkspaceChanged}
            />

            <NodeModal
              nodeData={nodeData}
              nodesData={nodesRef?.current || []}
              links={links}
              isOpen={isModalOpen}
              onClose={() => {
                closeModal();
                // Clear nodeData and nodeId after a small delay to prevent reopening
                setTimeout(() => {
                  setNodeData(null);
                  setNodeModal(undefined);
                }, 100);
              }}
              updateNodeData={setUpdateNodeData}
              currentWid={currentWid}
              openNodeModal={openNodeModal}
              widModeShared={widModeShared}
            />

            {showCalendar && (
              <WorkspaceCalendar
                events={calendar}
                onClose={() => setShowCalendar(false)}
                nodes={nodes}
                onCalendarChange={setCalendar}
              />
            )}
          </div>
        </>
      )}
    </>
  );
};
