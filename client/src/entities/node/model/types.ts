// Node types and their configuration
export const NODE_TYPES = {
  TYPE_A: 'typeA',
  TYPE_B: 'typeB',
  TYPE_C: 'typeC',
  TYPE_D: 'typeD',
  TYPE_E: 'typeE',
  TYPE_F: 'typeF',
  TYPE_G: 'typeG',
  TYPE_H: 'typeH',
  TYPE_I: 'typeI',
  TYPE_K: 'typeK',
  TYPE_L: 'typeL',
  TYPE_M: 'typeM',
  TYPE_N: 'typeN',
  TYPE_O: 'typeO',
  TYPE_P: 'typeP',
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

export const NODE_TYPE_NAMES: Record<NodeType, string> = {
  typeA: 'Begin Node',
  typeB: 'Event',
  typeC: 'Team',
  typeD: 'Person',
  typeE: 'Inventory',
  typeF: 'Orders',
  typeG: 'Finance',
  typeH: 'Branch',
  typeI: 'Document',
  typeK: 'Timeline',
  typeL: 'Synapse',
  typeM: 'Documentation',
  typeN: 'Tasks',
  typeO: 'Chronology',
  typeP: 'Big Image',
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  typeA: '#dc3545',
  typeB: '#2383ed',
  typeC: '#5628a7',
  typeD: '#9f36cc',
  typeE: '#a74e28',
  typeF: '#d0751e',
  typeG: '#28a745',
  typeH: '#414141',
  typeI: '#c4165f',
  typeK: '#4e1aba',
  typeL: '#5f2db6',
  typeM: '#163ccf',
  typeN: '#a35dfd',
  typeO: '#e6551b',
  typeP: '#d06016',
};

export const NODE_TYPE_WIDTHS: Record<NodeType, number> = {
  typeA: 220,
  typeB: 200,
  typeC: 180,
  typeD: 180,
  typeE: 160,
  typeF: 160,
  typeG: 180,
  typeH: 160,
  typeI: 170,
  typeK: 280,
  typeL: 10,
  typeM: 180,
  typeN: 180,
  typeO: 180,
  typeP: 340,
};

export const NODE_TYPE_DESCRIPTIONS: Record<NodeType, string> = {
  typeA: 'Start point of your workspace',
  typeB: 'Schedule events and meetings',
  typeC: 'Manage team members and roles',
  typeD: 'Contact information and details',
  typeE: 'Track inventory and assets',
  typeF: 'Process orders',
  typeG: 'Financial records and budgets',
  typeH: 'Separate category branch',
  typeI: 'Store and manage documents',
  typeK: 'Project timeline and milestones',
  typeL: 'Connect nodes in a network',
  typeM: 'Documentation and knowledge base',
  typeN: 'Focus and productivity tracking',
  typeO: 'Records of actions',
  typeP: 'Visualize image in workspace',
};

export const NODE_DEFAULT_CONTENT: Record<NodeType, Record<string, unknown>> = {
  typeA: { html_editor: '' },
  typeB: { event_startTime: '', event_endTime: '' },
  typeC: {},
  typeD: {},
  typeE: {},
  typeF: {},
  typeG: {},
  typeH: {},
  typeI: {},
  typeK: {
    timeline: {
      items: [
        {
          id: 1,
          title: 'Timeline 1',
          description: 'New description',
          completed: false,
          timestamp: '2025-04-02T16:35:08.054Z',
        },
      ],
      lastUpdated: '2025-04-02T16:35:08.054Z',
    },
  },
  typeL: {},
  typeM: {},
  typeN: {},
  typeO: {},
  typeP: {},
};

// Legacy exports for backward compatibility
export const typeNodeName = NODE_TYPE_NAMES;
export const typeColors = NODE_TYPE_COLORS;
export const typeWidths = NODE_TYPE_WIDTHS;
export const nodeDescription = NODE_TYPE_DESCRIPTIONS;
export const typeDefaultContent = NODE_DEFAULT_CONTENT;
