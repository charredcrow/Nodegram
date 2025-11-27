import { useState, useCallback, useRef } from 'react';
import type { Selection } from 'd3-selection';
import type { Link } from '../../../shared/store/types';

interface UseNodeConnectionOptions {
  links?: Link[];
  setLinks?: (links: Link[] | ((prev: Link[]) => Link[])) => void;
  onConnectionCreated?: (link: Link) => void;
}

/**
 * Hook for managing node connections
 */
export const useNodeConnection = (options: UseNodeConnectionOptions = {}) => {
  const { links = [], setLinks, onConnectionCreated } = options;

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStartNode, setConnectionStartNode] = useState<number | null>(null);
  const temporaryLineRef = useRef<Selection<SVGLineElement, unknown, null, undefined> | null>(null);

  /**
   * Starts connection creation from specified node
   */
  const startConnection = useCallback((nodeId: number) => {
    setIsConnecting(true);
    setConnectionStartNode(nodeId);
  }, []);

  /**
   * Cancels connection creation
   */
  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setConnectionStartNode(null);
    if (temporaryLineRef.current) {
      temporaryLineRef.current.remove();
      temporaryLineRef.current = null;
    }
  }, []);

  /**
   * Creates connection between two nodes
   * @returns true if connection created, false if already exists
   */
  const createConnection = useCallback(
    (sourceId: number, targetId: number): boolean => {
      // Check if connection already exists
      const connectionExists = links.some(
        (link) => link.source === sourceId && link.target === targetId
      );

      if (connectionExists || sourceId === targetId) {
        return false;
      }

      // Create new connection
      const newLink: Link = {
        source: sourceId,
        target: targetId,
      };

      if (setLinks) {
        setLinks((prevLinks: Link[]) => [...prevLinks, newLink]);
      }

      if (onConnectionCreated) {
        onConnectionCreated(newLink);
      }

      setIsConnecting(false);
      setConnectionStartNode(null);
      return true;
    },
    [links, setLinks, onConnectionCreated]
  );

  /**
   * Finishes connection creation
   */
  const finishConnection = useCallback(
    (targetId: number) => {
      if (connectionStartNode && connectionStartNode !== targetId) {
        createConnection(connectionStartNode, targetId);
      } else {
        cancelConnection();
      }
    },
    [connectionStartNode, createConnection, cancelConnection]
  );

  /**
   * Removes connection between two nodes
   */
  const removeConnection = useCallback(
    (sourceId: number, targetId: number) => {
      if (setLinks) {
        setLinks((prevLinks: Link[]) =>
          prevLinks.filter((link) => !(link.source === sourceId && link.target === targetId))
        );
      }
    },
    [setLinks]
  );

  /**
   * Removes all connections related to node
   */
  const removeNodeConnections = useCallback(
    (nodeId: number) => {
      if (setLinks) {
        setLinks((prevLinks: Link[]) =>
          prevLinks.filter((link) => link.source !== nodeId && link.target !== nodeId)
        );
      }
    },
    [setLinks]
  );

  /**
   * Creates temporary line for visualizing connection creation process
   */
  const createTemporaryLine = useCallback(
    (svg: Selection<SVGSVGElement, unknown, null, undefined>, startX: number, startY: number) => {
      if (temporaryLineRef.current) {
        temporaryLineRef.current.remove();
      }

      temporaryLineRef.current = svg
        .append('line')
        .attr('class', 'temporary-line')
        .attr('x1', startX)
        .attr('y1', startY)
        .attr('x2', startX)
        .attr('y2', startY)
        .attr('stroke', '#7aa2f7')
        .attr('stroke-width', 4)
        .attr('stroke-dasharray', '5,5')
        .style('opacity', 0.6) as Selection<SVGLineElement, unknown, null, undefined>;
    },
    []
  );

  /**
   * Updates temporary line
   */
  const updateTemporaryLine = useCallback((endX: number, endY: number) => {
    if (temporaryLineRef.current) {
      temporaryLineRef.current.attr('x2', endX).attr('y2', endY);
    }
  }, []);

  /**
   * Removes temporary line
   */
  const removeTemporaryLine = useCallback(() => {
    if (temporaryLineRef.current) {
      temporaryLineRef.current.remove();
      temporaryLineRef.current = null;
    }
  }, []);

  return {
    isConnecting,
    connectionStartNode,
    startConnection,
    cancelConnection,
    createConnection,
    finishConnection,
    removeConnection,
    removeNodeConnections,
    createTemporaryLine,
    updateTemporaryLine,
    removeTemporaryLine,
  };
};
