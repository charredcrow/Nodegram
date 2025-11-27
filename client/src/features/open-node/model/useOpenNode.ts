// Hook for opening nodes
import type { Node } from '../../../shared/store/types';

export const useOpenNode = () => {
  const openNode = (nodeId: number, nodes: Node[]): Node | null => {
    const node = nodes.find((n) => Number(n.id) === Number(nodeId));
    return node || null;
  };

  return { openNode };
};
