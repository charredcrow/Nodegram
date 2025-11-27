// Node configuration with icons
import { BsPlayFill } from 'react-icons/bs';
import {
  MdEvent,
  MdGroup,
  MdPerson,
  MdInventory,
  MdShoppingCart,
  MdAttachMoney,
  MdAccountTree,
  MdDescription,
  MdTimeline,
  MdTaskAlt,
  MdHistory,
  MdImage,
} from 'react-icons/md';
import { FaCircleNodes } from 'react-icons/fa6';
import type { ComponentType } from 'react';
import type { NodeType } from './types';

export const NODE_ICONS: Record<NodeType, ComponentType> = {
  typeA: BsPlayFill,
  typeB: MdEvent,
  typeC: MdGroup,
  typeD: MdPerson,
  typeE: MdInventory,
  typeF: MdShoppingCart,
  typeG: MdAttachMoney,
  typeH: MdAccountTree,
  typeI: MdDescription,
  typeK: MdTimeline,
  typeL: FaCircleNodes,
  typeM: MdDescription,
  typeN: MdTaskAlt,
  typeO: MdHistory,
  typeP: MdImage,
};

// Legacy export for backward compatibility
export const nodeIcons = NODE_ICONS;
