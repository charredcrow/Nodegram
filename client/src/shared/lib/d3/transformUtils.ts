import * as d3 from 'd3';
import DOMPurify from 'dompurify';
import type { ZoomTransform } from 'd3-zoom';

export interface TransformParams {
  x: number;
  y: number;
  k: number;
}

/**
 * Parses transform string into d3.zoomIdentity object
 */
export const parseTransformString = (transformStr: string): ZoomTransform => {
  // Sanitize input data
  const sanitizedStr = DOMPurify.sanitize(transformStr);
  if (!sanitizedStr || typeof sanitizedStr !== 'string') {
    return d3.zoomIdentity;
  }

  const translateRegex = /translate\(([^,]+),\s*([^,\)]+)\)/;
  const scaleRegex = /scale\(([^,\)]+)\)/;

  const matchTranslate = sanitizedStr.match(translateRegex);
  const matchScale = sanitizedStr.match(scaleRegex);

  if (!matchTranslate || !matchScale) {
    return d3.zoomIdentity;
  }

  const x = parseFloat(matchTranslate[1]);
  const y = parseFloat(matchTranslate[2]);
  const k = parseFloat(matchScale[1]);

  if (isNaN(x) || isNaN(y) || isNaN(k)) {
    return d3.zoomIdentity;
  }

  return d3.zoomIdentity.translate(x, y).scale(k);
};

/**
 * Creates transform string from parameters
 */
export const createTransformString = (x: number, y: number, k: number): string => {
  return `translate(${x},${y}) scale(${k})`;
};

/**
 * Interpolates between two transform objects
 */
export const interpolateTransform = (
  start: TransformParams,
  end: TransformParams,
  t: number
): TransformParams => {
  return {
    x: start.x * (1 - t) + end.x * t,
    y: start.y * (1 - t) + end.y * t,
    k: start.k * (1 - t) + end.k * t,
  };
};
