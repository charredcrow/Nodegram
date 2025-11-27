import { useState, useCallback } from 'react';
import type { Node } from '../../../shared/store/types';

interface UseNodeDeletionOptions {
  nodes?: Node[];
  setNodes?: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  links?: Array<{ source: number; target: number }>;
  setLinks?: (
    links:
      | Array<{ source: number; target: number }>
      | ((
          prev: Array<{ source: number; target: number }>
        ) => Array<{ source: number; target: number }>)
  ) => void;
  onNodeDeleted?: (nodeId: number) => void;
}

/**
 * Hook for managing node deletion
 */
export const useNodeDeletion = (options: UseNodeDeletionOptions = {}) => {
  const { setNodes, setLinks, onNodeDeleted } = options;
  // nodes and links are not used directly, they are accessed via callbacks

  const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /**
   * Deletes node and all related connections
   */
  const deleteNode = useCallback(
    (nodeId: number) => {
      // Delete node
      if (setNodes) {
        setNodes((prevNodes: Node[]) => prevNodes.filter((node) => node.id !== nodeId));
      }

      // Delete all connections related to this node
      if (setLinks) {
        setLinks((prevLinks: Array<{ source: number; target: number }>) =>
          prevLinks.filter((link) => link.source !== nodeId && link.target !== nodeId)
        );
      }

      if (onNodeDeleted) {
        onNodeDeleted(nodeId);
      }
    },
    [setNodes, setLinks, onNodeDeleted]
  );

  /**
   * Deletes multiple nodes and all related connections
   */
  const deleteNodes = useCallback(
    (nodeIds: number[]) => {
      if (!nodeIds || nodeIds.length === 0) return;

      // Delete nodes
      if (setNodes) {
        setNodes((prevNodes: Node[]) => prevNodes.filter((node) => !nodeIds.includes(node.id)));
      }

      // Delete all connections related to these nodes
      if (setLinks) {
        setLinks((prevLinks: Array<{ source: number; target: number }>) =>
          prevLinks.filter(
            (link) => !nodeIds.includes(link.source) && !nodeIds.includes(link.target)
          )
        );
      }

      if (onNodeDeleted) {
        nodeIds.forEach((nodeId) => onNodeDeleted(nodeId));
      }
    },
    [setNodes, setLinks, onNodeDeleted]
  );

  /**
   * Opens confirmation modal for deletion
   */
  const requestDeleteNode = useCallback((node: Node) => {
    setNodeToDelete(node);
    setIsDeleteModalOpen(true);
  }, []);

  /**
   * Confirms node deletion
   */
  const confirmDeleteNode = useCallback(() => {
    if (nodeToDelete) {
      deleteNode(nodeToDelete.id);
      setNodeToDelete(null);
      setIsDeleteModalOpen(false);
    }
  }, [nodeToDelete, deleteNode]);

  /**
   * Cancels node deletion
   */
  const cancelDeleteNode = useCallback(() => {
    setNodeToDelete(null);
    setIsDeleteModalOpen(false);
  }, []);

  /**
   * Confirms mass deletion of nodes
   */
  const confirmMassDelete = useCallback(
    (nodeIds: number[]) => {
      if (nodeIds && nodeIds.length > 0) {
        deleteNodes(nodeIds);
      }
    },
    [deleteNodes]
  );

  return {
    nodeToDelete,
    isDeleteModalOpen,
    deleteNode,
    deleteNodes,
    requestDeleteNode,
    confirmDeleteNode,
    cancelDeleteNode,
    confirmMassDelete,
    setIsDeleteModalOpen,
  };
};
