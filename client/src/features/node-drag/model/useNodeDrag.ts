import { useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { parseTransformString } from '../../../shared/lib/d3';
import type { Node } from '../../../shared/store/types';

interface UseNodeDragOptions {
  onNodeDragStart?: (event: d3.D3DragEvent<SVGGElement, Node, unknown>, d: Node) => void;
  onNodeDrag?: (event: d3.D3DragEvent<SVGGElement, Node, unknown>, d: Node) => void;
  onNodeDragEnd?: (
    event: d3.D3DragEvent<SVGGElement, Node, unknown>,
    d: Node,
    wasDragging: boolean,
    clickTime: number | null
  ) => void;
  onGroupDragStart?: (event: d3.D3DragEvent<SVGGElement, Node, unknown>, d: Node) => void;
  onGroupDrag?: (
    event: d3.D3DragEvent<SVGGElement, Node, unknown>,
    d: Node,
    dx: number,
    dy: number
  ) => void;
  onGroupDragEnd?: (
    event: d3.D3DragEvent<SVGGElement, Node, unknown>,
    d: Node,
    wasDragging: boolean,
    clickTime: number | null
  ) => void;
}

/**
 * Hook for managing node dragging
 */
export const useNodeDrag = (options: UseNodeDragOptions = {}) => {
  const {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragEnd,
    onGroupDragStart,
    onGroupDrag,
    onGroupDragEnd,
  } = options;

  const dragNodeRef = useRef<Node | null>(null);
  const dragRAFRef = useRef<number | null>(null);
  const selectMoveLastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const clickTimeRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const isGroupDraggingRef = useRef(false);

  /**
   * Creates D3 drag behavior for single node
   */
  const createNodeDragBehavior = useCallback(
    (updateLinksForNode?: (nodeId: number) => void) => {
      return d3
        .drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          clickTimeRef.current = Date.now();
          isDraggingRef.current = false;
          dragNodeRef.current = d;

          if (onNodeDragStart) {
            onNodeDragStart(event, d);
          }
        })
        .on('drag', (event, d) => {
          isDraggingRef.current = true;
          d.x = event.x;
          d.y = event.y;

          // Update visual position
          const target = event.sourceEvent?.target as HTMLElement;
          const nodeElement = target?.closest('.node') as SVGGElement;
          if (nodeElement) {
            d3.select(nodeElement).attr('transform', `translate(${d.x}, ${d.y})`);
          }

          // Update links via RAF for optimization
          if (!dragRAFRef.current && updateLinksForNode) {
            dragRAFRef.current = requestAnimationFrame(() => {
              if (updateLinksForNode) {
                updateLinksForNode(d.id);
              }
              dragRAFRef.current = null;
            });
          }

          if (onNodeDrag) {
            onNodeDrag(event, d);
          }
        })
        .on('end', (event, d) => {
          if (onNodeDragEnd) {
            onNodeDragEnd(event, d, isDraggingRef.current, clickTimeRef.current);
          }

          isDraggingRef.current = false;
          dragNodeRef.current = null;
          clickTimeRef.current = null;
        });
    },
    [onNodeDragStart, onNodeDrag, onNodeDragEnd]
  );

  /**
   * Creates D3 drag behavior for group of nodes
   */
  const createGroupDragBehavior = useCallback(
    (
      _selectedNodes: Node[],
      updateLinksForNode?: (nodeId: number) => void,
      graphTransform = ''
    ) => {
      return d3
        .drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          clickTimeRef.current = Date.now();
          isGroupDraggingRef.current = false;

          const target = event.sourceEvent?.target as HTMLElement;
          const currentElement = d3.select(target?.closest('.node') as SVGGElement);
          if (currentElement.classed('selected')) {
            const src = event.sourceEvent || event;
            const touchEvent = src as TouchEvent;
            const mouseEvent = src as MouseEvent;
            const clientX = touchEvent?.touches?.[0]?.clientX ?? mouseEvent?.clientX ?? 0;
            const clientY = touchEvent?.touches?.[0]?.clientY ?? mouseEvent?.clientY ?? 0;
            const rect = document.querySelector('#workspace-container')?.getBoundingClientRect();
            const mainGraph = document.querySelector('#main_graph');
            const tAttr = mainGraph?.getAttribute('transform') || graphTransform;
            const { x, y, k } = parseTransformString(tAttr);
            const graphX = (clientX - (rect?.left || 0) - (x || 0)) / (k || 1);
            const graphY = (clientY - (rect?.top || 0) - (y || 0)) / (k || 1);
            selectMoveLastPointerRef.current = { x: graphX, y: graphY };
          } else {
            selectMoveLastPointerRef.current = null;
          }

          if (onGroupDragStart) {
            onGroupDragStart(event, d);
          }
        })
        .on('drag', (event, d) => {
          const target = event.sourceEvent?.target as HTMLElement;
          const currentElement = d3.select(target?.closest('.node') as SVGGElement);
          if (currentElement.classed('selected')) {
            isGroupDraggingRef.current = true;

            const src = event.sourceEvent || event;
            const touchEvent = src as TouchEvent;
            const mouseEvent = src as MouseEvent;
            const clientX = touchEvent?.touches?.[0]?.clientX ?? mouseEvent?.clientX ?? 0;
            const clientY = touchEvent?.touches?.[0]?.clientY ?? mouseEvent?.clientY ?? 0;
            const rect = document.querySelector('#workspace-container')?.getBoundingClientRect();
            const mainGraph = document.querySelector('#main_graph');
            const tAttr = mainGraph?.getAttribute('transform') || graphTransform;
            const { x, y, k } = parseTransformString(tAttr);
            const graphX = (clientX - (rect?.left || 0) - (x || 0)) / (k || 1);
            const graphY = (clientY - (rect?.top || 0) - (y || 0)) / (k || 1);
            const last = selectMoveLastPointerRef.current || { x: graphX, y: graphY };
            const dx = graphX - last.x;
            const dy = graphY - last.y;

            // Update positions of all selected nodes
            d3.selectAll('.node.selected').each(function (selectedData: unknown) {
              const node = selectedData as Node;
              node.x += dx;
              node.y += dy;
              d3.select(this).attr('transform', `translate(${node.x}, ${node.y})`);
            });

            selectMoveLastPointerRef.current = { x: graphX, y: graphY };

            // Update links via RAF
            const selectedNodeIds = d3
              .selectAll('.node.selected')
              .data()
              .map((node: unknown) => (node as Node).id);
            if (!dragRAFRef.current && updateLinksForNode) {
              dragRAFRef.current = requestAnimationFrame(() => {
                selectedNodeIds.forEach((id) => {
                  if (updateLinksForNode) {
                    updateLinksForNode(id);
                  }
                });
                dragRAFRef.current = null;
              });
            }

            if (onGroupDrag) {
              onGroupDrag(event, d, dx, dy);
            }
          }
        })
        .on('end', (event, d) => {
          if (onGroupDragEnd) {
            onGroupDragEnd(event, d, isGroupDraggingRef.current, clickTimeRef.current);
          }

          selectMoveLastPointerRef.current = null;
          isGroupDraggingRef.current = false;
          clickTimeRef.current = null;
        });
    },
    [onGroupDragStart, onGroupDrag, onGroupDragEnd]
  );

  return {
    createNodeDragBehavior,
    createGroupDragBehavior,
    dragNodeRef,
    dragRAFRef,
    selectMoveLastPointerRef,
  };
};
