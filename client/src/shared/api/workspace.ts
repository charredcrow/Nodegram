// Local function for getting workspace (without backend)
// Data is stored only in localStorage
import type { Node, Link, CalendarItem } from '../store/types';

export interface WorkspaceResponse {
  status: 'success' | 'error';
  workspace?: {
    nodes: Node[];
    links: Link[];
    calendar: CalendarItem[];
    transform?: string;
  };
  message?: string;
}

export interface ClipboardData {
  nodes: Node[];
  links: Link[];
}

export const fetchUserWorkspace = async (wid: string): Promise<WorkspaceResponse> => {
  try {
    // Small delay to simulate loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Load data from localStorage
    const storageKey = `_ng_workspace_${wid}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          status: 'success',
          workspace: parsed,
        };
      } catch (e) {
        // If data is corrupted, return empty workspace
      }
    }

    // If no data, return empty workspace
    return {
      status: 'success',
      workspace: {
        nodes: [],
        links: [],
        calendar: [],
        transform: 'translate(0,0) scale(1)',
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Error loading workspace',
    };
  }
};

// Clipboard for copying nodes between workspaces
const CLIPBOARD_KEY = '_ng_nodes_clip';

export const setNodesClipboard = (value: Node[] | ClipboardData | null | undefined): void => {
  try {
    let payload: ClipboardData;
    if (Array.isArray(value)) {
      payload = { nodes: value, links: [] };
    } else if (value && Array.isArray(value.nodes)) {
      payload = {
        nodes: value.nodes,
        links: Array.isArray(value.links) ? value.links : [],
      };
    } else {
      payload = { nodes: [], links: [] };
    }
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload));
  } catch {
    // Ignore errors
  }
};

export const getNodesClipboard = (): ClipboardData => {
  try {
    const raw = localStorage.getItem(CLIPBOARD_KEY);
    if (!raw) return { nodes: [], links: [] };
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return { nodes: data, links: [] };
    }
    return {
      nodes: Array.isArray(data?.nodes) ? data.nodes : [],
      links: Array.isArray(data?.links) ? data.links : [],
    };
  } catch {
    return { nodes: [], links: [] };
  }
};

export const clearNodesClipboard = (): void => {
  try {
    localStorage.removeItem(CLIPBOARD_KEY);
  } catch {
    // Ignore errors
  }
};

// Utility for formatting numbers with spaces every 3 digits
export const formatNumberWithSpaces = (number: number | null | undefined): string => {
  if (number === null || number === undefined) return '0';
  const numStr = number.toString();
  const [integerPart, decimalPart] = numStr.split('.');
  if (!integerPart) return '0';
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimalPart) {
    if (decimalPart === '00') {
      return formattedInteger;
    }
    if (decimalPart.length === 1) {
      return `${formattedInteger}.${decimalPart}0`;
    }
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
};
