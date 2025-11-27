// Utilities for working with workspaces
import { generateNodeId } from './types';
import type { Node, Link } from '../../../shared/store/types';

export const createExampleNodes = (): Node[] => {
  return [
    {
      id: generateNodeId(),
      title: 'Welcome to Nodegram',
      description: 'Open source node-based workspace playground',
      x: 100,
      y: 50,
      type: 'typeA',
      nodeColor: '#d62d7c', //#dc35d9
      content: {
        html_editor: `<h2>Welcome to Nodegram! 🎉</h2>
<p><strong>Nodegram</strong> is an open-source React application for managing nodes and their connections. This is a <strong>playground workspace</strong> for testing and experimentation.</p>

<h3>About the Project</h3>
<p>🌐 <strong>Open Source:</strong> Nodegram is freely available and open for contributions. The project is licensed under MIT, allowing anyone to use, modify, and distribute the code.</p>
<p>🔗 <strong>GitHub:</strong> <a href="https://github.com/charredcrow/nodegram" target="_blank" rel="noopener noreferrer">github.com/charredcrow/nodegram</a> - Visit our repository to view the source code, report issues, suggest features, or contribute to the project.</p>
<p>🧪 <strong>Playground:</strong> This workspace is designed for testing and exploring features. You can experiment with all functionality without any restrictions.</p>
<p>📐 <strong>Architecture:</strong> Built with React 18, TypeScript, Vite, Zustand for state management, D3.js for graph visualization, and follows Feature-Sliced Design (FSD) architecture principles for better code organization and scalability.</p>
<p>💻 <strong>Client-Side Only:</strong> All data is stored locally in your browser's localStorage. No backend server is required, making it easy to run and deploy.</p>

<h3>Features</h3>
<p><strong>Node Management:</strong> Create, edit, move, and delete nodes with ease. Each node can contain rich content including text, images, events, and more.</p>
<p><strong>Visual Connections:</strong> Connect nodes with visual links to create relationships and workflows. Drag from output circles to create connections between nodes.</p>
<p><strong>Multiple Node Types:</strong> Choose from various node types including rich text editor (HTML), calendar events, team management, file attachments, timelines, and more.</p>
<p><strong>Calendar Integration:</strong> Schedule and manage events directly in your workspace with built-in calendar functionality.</p>
<p><strong>Drag and Drop:</strong> Intuitively drag nodes to reposition them on the canvas. Select multiple nodes for batch operations.</p>
<p><strong>Interactive Modes:</strong> Switch between Select, Connect, and Pan modes using the toolbar for different interaction types.</p>
<p><strong>Rich Text Editing:</strong> Use the Quill editor to format text, add links, create lists, and apply styling to your node content.</p>
<p><strong>Zoom and Pan:</strong> Navigate large workspaces with smooth zoom and pan controls.</p>

<h3>Getting Started</h3>
<p>Click on nodes to edit them, drag to move, and use the toolbar to switch between modes (select, connect, pan). You can create new nodes by selecting a type from the toolbar and clicking on the workspace. Connect nodes by switching to "Connect" mode and dragging from the output circles.</p>

<p><em>Feel free to explore, experiment, and contribute to the project!</em></p>`,
      },
    },
    {
      id: generateNodeId(),
      title: 'GitHub Repository',
      description: 'Open source project on GitHub',
      x: 400,
      y: 100,
      type: 'typeA',
      nodeColor: '#7835dc', //
      content: {
        html_editor: `<h2>🔗 GitHub Repository</h2>

<p><strong>Nodegram</strong> is an open-source project hosted on GitHub.</p>

<h3>Repository</h3>
<p><a href="https://github.com/charredcrow/nodegram" target="_blank" rel="noopener noreferrer">https://github.com/charredcrow/nodegram</a></p>

<h3>What you can do:</h3>
<p>⭐ Star the repository</p>
<p>🐛 Report issues</p>
<p>💡 Suggest features</p>
<p>🔧 Submit pull requests</p>
<p>📖 Read documentation</p>
<p>🤝 Contribute to the project</p>

<h3>Project Status</h3>
<p>This is a <strong>playground/testing environment</strong> for the Nodegram project. Feel free to experiment and provide feedback!</p>

<p><em>Built with ❤️ by the open-source community</em></p>`,
      },
    },
  ];
};

export const createExampleLinks = (nodes: Node[]): Link[] => {
  if (nodes.length < 2) return [];
  // Create link between the welcome node and GitHub repository to show connection functionality
  return [{ source: nodes[0]!.id, target: nodes[1]!.id }];
};
