// Hook for creating nodes
import { generateNodeId } from '../../../entities/workspace/model';
import type { Node } from '../../../shared/store/types';

export const useCreateNode = () => {
  const createNode = (
    type: string,
    x: number,
    y: number,
    defaultContent?: Record<string, unknown>
  ): Node => {
    return {
      id: generateNodeId(),
      title: '',
      description: '',
      x,
      y,
      type,
      content: defaultContent || {},
    };
  };

  return { createNode };
};
