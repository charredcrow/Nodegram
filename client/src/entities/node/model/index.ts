export * from './types';
export * from './config';

// Export all configurations for convenience
export {
  NODE_TYPE_NAMES as typeNodeName,
  NODE_TYPE_COLORS as typeColors,
  NODE_TYPE_WIDTHS as typeWidths,
  NODE_TYPE_DESCRIPTIONS as nodeDescription,
  NODE_DEFAULT_CONTENT as typeDefaultContent,
} from './types';
export { NODE_ICONS, NODE_ICONS as nodeIcons } from './config';
