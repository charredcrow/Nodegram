// Hook for managing nodes
import { useCallback } from 'react';
import { useWorkspaceStore } from '../../../shared/store';
import type { Node } from '../../../shared/store/types';

export const useNodeManagement = () => {
  const { nodes, setNodes, links, setLinks, nodesRef } = useWorkspaceStore();

  const updateNodes = useCallback(
    (updatedNodes: Node[]) => {
      const normalized = Array.isArray(updatedNodes)
        ? updatedNodes.map((n) => ({ ...n, id: Number(n.id) }))
        : [];

      setNodes(normalized);
    },
    [setNodes]
  );

  const updateNodesRefOnly = useCallback(
    (updatedNodes: Node[]) => {
      const normalized = Array.isArray(updatedNodes)
        ? updatedNodes.map((n) => ({ ...n, id: Number(n.id) }))
        : [];
      if (nodesRef) {
        nodesRef.current = normalized;
      }
    },
    [nodesRef]
  );

  const deleteNodeAndLinks = useCallback(
    (nodeId: number) => {
      const updatedNodes = nodes.filter((node) => node.id !== nodeId);
      setNodes(updatedNodes);

      const updatedLinks = links.filter((link) => link.source !== nodeId && link.target !== nodeId);
      setLinks(updatedLinks);
    },
    [nodes, links, setNodes, setLinks]
  );

  return {
    updateNodes,
    updateNodesRefOnly,
    deleteNodeAndLinks,
  };
};
