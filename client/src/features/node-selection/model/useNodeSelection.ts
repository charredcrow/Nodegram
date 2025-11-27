import { useState, useCallback } from 'react';

/**
 * Hook for managing node selection
 */
export const useNodeSelection = (initialSelectedNodes: number[] = []) => {
  const [selectedNodes, setSelectedNodes] = useState<number[]>(initialSelectedNodes);

  /**
   * Toggles node selection
   */
  const toggleNodeSelection = useCallback((nodeId: number, multiSelect = false) => {
    setSelectedNodes((prev) => {
      if (multiSelect) {
        // Multi-select: add or remove node
        return prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId];
      } else {
        // Single select: replace selection
        return prev.includes(nodeId) && prev.length === 1 ? [] : [nodeId];
      }
    });
  }, []);

  /**
   * Selects node
   */
  const selectNode = useCallback((nodeId: number, multiSelect = false) => {
    setSelectedNodes((prev) => {
      if (multiSelect) {
        return prev.includes(nodeId) ? prev : [...prev, nodeId];
      } else {
        return [nodeId];
      }
    });
  }, []);

  /**
   * Deselects node
   */
  const deselectNode = useCallback((nodeId: number) => {
    setSelectedNodes((prev) => prev.filter((id) => id !== nodeId));
  }, []);

  /**
   * Selects multiple nodes
   */
  const selectNodes = useCallback((nodeIds: number[]) => {
    setSelectedNodes(nodeIds);
  }, []);

  /**
   * Clears all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedNodes([]);
  }, []);

  /**
   * Checks if node is selected
   */
  const isNodeSelected = useCallback(
    (nodeId: number) => {
      return selectedNodes.includes(nodeId);
    },
    [selectedNodes]
  );

  return {
    selectedNodes,
    setSelectedNodes,
    toggleNodeSelection,
    selectNode,
    deselectNode,
    selectNodes,
    clearSelection,
    isNodeSelected,
  };
};
