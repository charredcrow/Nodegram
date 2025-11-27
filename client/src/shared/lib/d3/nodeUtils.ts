import * as d3 from 'd3';
import type { Node } from '../../../store/types';

interface CalculateLinkPointsOptions {
  typeWidths?: Record<string, number>;
  synapseYOffset?: number;
}

/**
 * Calculates maximum text width for node
 */
export const calculateMaxTextWidth = (headerText: string, bodyText = ''): number => {
  // Create temporary SVG for text measurement
  const tempSvg = d3
    .select('body')
    .append('svg')
    .attr('width', 1)
    .attr('height', 1)
    .style('position', 'absolute')
    .style('visibility', 'hidden');

  const tempText = tempSvg.append('text');

  // Function to measure text width
  const measureTextWidth = (text: string): number => {
    if (!text) return 0;
    tempText.text(text);
    const bbox = tempText.node()?.getBBox();
    return bbox ? bbox.width : 0;
  };

  // Measure header width
  tempText.style('font-size', '16px').style('font-weight', 'bold');
  const headerMaxWidth = measureTextWidth(headerText);

  // Measure body width
  tempText.style('font-size', '14px').style('font-weight', 'normal');
  const bodyMaxWidth = measureTextWidth(bodyText);

  // Remove temporary SVG
  tempSvg.remove();

  // Return maximum width plus padding
  return Math.max(headerMaxWidth, bodyMaxWidth) + 40; // 40px padding (20px each side)
};

/**
 * Creates line generator for links between nodes
 */
export const createLineGenerator = (
  curveType = 'curveBundle',
  beta = 1.0
): d3.Line<[number, number]> => {
  const curveMap: Record<string, d3.CurveFactory> = {
    curveBundle: d3.curveBundle.beta(beta),
    curveLinear: d3.curveLinear,
    curveBasis: d3.curveBasis,
    curveCardinal: d3.curveCardinal,
    curveMonotone: d3.curveMonotone,
  };

  return d3
    .line<[number, number]>()
    .curve(curveMap[curveType] || curveMap.curveBundle)
    .x((d) => d[0])
    .y((d) => d[1]);
};

/**
 * Calculates coordinates for link between two nodes
 */
export const calculateLinkPoints = (
  sourceNode: Node & { _nodeWidth?: number },
  targetNode: Node & { _nodeWidth?: number },
  options: CalculateLinkPointsOptions = {}
): Array<{ x: number; y: number }> => {
  const { typeWidths = {}, synapseYOffset = 0 } = options;

  const sourceWidth = sourceNode._nodeWidth || typeWidths[sourceNode.type] || 180;
  const targetWidth = targetNode._nodeWidth || typeWidths[targetNode.type] || 180;

  const sourceX = sourceNode.x + sourceWidth / 2;
  const sourceY = sourceNode.y + 100 + synapseYOffset; // 100 - node height
  const targetX = targetNode.x + targetWidth / 2;
  const targetY = targetNode.y + synapseYOffset;

  return [
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
  ];
};
