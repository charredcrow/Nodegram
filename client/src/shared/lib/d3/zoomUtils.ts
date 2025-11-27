import * as d3 from 'd3';
import {
  parseTransformString,
  createTransformString,
  interpolateTransform,
} from './transformUtils';
import type { TransformParams } from './transformUtils';
import type { ZoomTransform } from 'd3-zoom';
import type { Node } from '../../../store/types';

interface CreateZoomBehaviorOptions {
  scaleExtentMin?: number;
  scaleExtentMax?: number;
  onZoom?: (transform: ZoomTransform, event: d3.D3ZoomEvent<Element, unknown>) => void;
}

interface AnimateTransformOptions {
  currentTransform: string;
  targetTransform: TransformParams;
  duration?: number;
  onUpdate?: (transformString: string, interpolated: TransformParams) => void;
  onComplete?: (transformString: string, interpolated: TransformParams) => void;
}

interface CalculateCenterTransformOptions {
  node: Node & { _nodeWidth?: number };
  nodeWidth?: number;
  zoom?: number;
}

interface CalculateScaleFitTransformOptions {
  nodes: Array<Node & { _nodeWidth?: number }>;
  typeWidths?: Record<string, number>;
  padding?: number;
  maxScale?: number;
}

/**
 * Creates zoom behavior with specified parameters
 */
export const createZoomBehavior = (
  options: CreateZoomBehaviorOptions = {}
): d3.ZoomBehavior<Element, unknown> => {
  const { scaleExtentMin = 0.01, scaleExtentMax = 4.0, onZoom = () => {} } = options;

  return d3
    .zoom<Element, unknown>()
    .scaleExtent([scaleExtentMin, scaleExtentMax])
    .on('zoom', (event: d3.D3ZoomEvent<Element, unknown>) => {
      const newScale = Math.min(Math.max(event.transform.k, scaleExtentMin), scaleExtentMax);
      const transform = d3.zoomIdentity
        .translate(event.transform.x, event.transform.y)
        .scale(newScale);

      onZoom(transform, event);
    });
};

/**
 * Animates transition to target transform
 */
export const animateTransform = (options: AnimateTransformOptions): void => {
  const { currentTransform, targetTransform, duration = 1000, onUpdate, onComplete } = options;

  const startTime = performance.now();
  const initial = parseTransformString(currentTransform);

  const animate = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    const interpolated = interpolateTransform(
      { x: initial.x, y: initial.y, k: initial.k },
      targetTransform,
      t
    );
    const transformString = createTransformString(interpolated.x, interpolated.y, interpolated.k);

    if (onUpdate) {
      onUpdate(transformString, interpolated);
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      if (onComplete) {
        onComplete(transformString, interpolated);
      }
    }
  };

  requestAnimationFrame(animate);
};

/**
 * Calculates transform for centering node on screen
 */
export const calculateCenterTransform = (
  options: CalculateCenterTransformOptions
): TransformParams => {
  const { node, nodeWidth = 200, zoom = 1 } = options;

  const nodeCenterX = node.x + (node._nodeWidth || nodeWidth) / 2;
  const nodeCenterY = node.y + 15; // Half of header height

  const centerScreenX = window.innerWidth / 2;
  const centerScreenY = window.innerHeight / 2;

  const targetScale = Math.min(Math.max(zoom, 0.01), 4.0);
  const targetX = centerScreenX - nodeCenterX * targetScale;
  const targetY = centerScreenY - nodeCenterY * targetScale;

  return { x: targetX, y: targetY, k: targetScale };
};

/**
 * Calculates transform for scaling all nodes (scale fit)
 */
export const calculateScaleFitTransform = (
  options: CalculateScaleFitTransformOptions
): TransformParams => {
  const { nodes, typeWidths = {}, padding = 300, maxScale = 1 } = options;

  if (!nodes || nodes.length === 0) {
    return { x: 0, y: 0, k: 1 };
  }

  const minX = Math.min(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxX = Math.max(...nodes.map((n) => n.x + (n._nodeWidth || typeWidths[n.type] || 260)));
  const maxY = Math.max(...nodes.map((n) => n.y + 300)); // Node height

  const nodesWidth = maxX - minX;
  const nodesHeight = maxY - minY;
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  const scaleX = containerWidth / (nodesWidth + padding);
  const scaleY = containerHeight / (nodesHeight + padding);
  const newScale = Math.min(scaleX, scaleY, maxScale);

  const newX = (containerWidth - nodesWidth * newScale) / 2 - minX * newScale;
  const newY = (containerHeight - nodesHeight * newScale) / 2 - minY * newScale;

  return { x: newX, y: newY, k: newScale };
};
