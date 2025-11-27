# Nodegram Architecture

This document describes the architecture of the Nodegram **web client application** (`client/`), which follows the Feature-Sliced Design (FSD) methodology.

## Overview

The Nodegram web client is built using React 18 with TypeScript, following the Feature-Sliced Design architecture pattern. This architecture promotes scalability, maintainability, and clear separation of concerns.

> **Note:** This document describes the architecture of the web application located in the `client/` directory. For information about the overall project structure, see [README.md](./README.md).

## Feature-Sliced Design (FSD)

FSD is a methodology for organizing frontend code that emphasizes:
- **Slicing by features** - Code is organized by business features
- **Layering by abstraction** - Code is layered by level of abstraction
- **Isolation** - Each slice is independent and can be developed/tested separately

## Project Structure

The web client source code is located in `client/src/`:

```
client/src/
├── app/                    # Application layer
│   ├── App.tsx            # Root component
│   └── providers/         # Context providers
│       └── NotificationProvider.tsx
│
├── pages/                  # Pages layer
│   └── workspace/
│       └── ui/
│           └── WorkspacePage.tsx
│
├── widgets/               # Widgets layer
│   ├── node-graph/       # Graph visualization widget
│   ├── node-modal/       # Node editing modal
│   ├── workspace-calendar/ # Calendar widget
│   └── workspace-toolbar/  # Toolbar widget
│
├── features/             # Features layer
│   ├── create-node/      # Node creation feature
│   ├── node-connection/  # Node connection feature
│   ├── node-deletion/    # Node deletion feature
│   ├── node-drag/        # Node dragging feature
│   ├── node-management/  # Node management feature
│   ├── node-selection/   # Node selection feature
│   ├── open-node/        # Node opening feature
│   ├── workspace-management/ # Workspace management
│   └── workspace-state/  # Workspace state (deprecated, use store)
│
├── entities/             # Entities layer
│   ├── node/            # Node entity
│   │   ├── model/       # Node models and types
│   │   └── ui/          # Node UI components
│   └── workspace/       # Workspace entity
│       └── model/       # Workspace models and types
│
├── shared/              # Shared layer
│   ├── api/            # API utilities
│   ├── config/         # Configuration
│   ├── lib/            # Third-party library wrappers
│   │   └── d3/        # D3.js utilities
│   ├── store/          # Zustand store
│   │   ├── types.ts    # Store types
│   │   ├── workspaceStore.ts # Main store
│   │   └── index.ts    # Store exports
│   └── ui/             # Shared UI components
│
└── utils/              # Utility functions
    └── disableInspect.ts
```

## Layer Descriptions

### App Layer (`app/`)

The application layer contains:
- Application initialization
- Root component setup
- Global providers (notifications, themes, etc.)
- Routing configuration

**Responsibilities:**
- Initialize the application
- Set up global providers
- Configure routing

### Pages Layer (`pages/`)

Pages are top-level route components that compose widgets and features.

**Responsibilities:**
- Compose widgets and features into pages
- Handle page-level state and routing
- Coordinate between widgets

### Widgets Layer (`widgets/`)

Widgets are complex UI compositions that combine multiple features and entities.

**Examples:**
- `NodeGraph` - Visual graph with D3.js
- `WorkspaceToolbar` - Toolbar with workspace controls
- `NodeModal` - Modal for editing nodes

**Responsibilities:**
- Compose features and entities into complex UI
- Handle widget-level state
- Coordinate between features

### Features Layer (`features/`)

Features represent user actions and business logic.

**Examples:**
- `create-node` - Creating a new node
- `node-connection` - Connecting nodes
- `node-deletion` - Deleting nodes

**Structure:**
```
feature-name/
├── index.ts          # Public API
└── model/
    └── useFeatureName.ts  # Feature logic
```

**Responsibilities:**
- Implement user actions
- Handle feature-specific state
- Interact with entities and store

### Entities Layer (`entities/`)

Entities represent business entities and their models.

**Examples:**
- `node` - Node entity with types and configurations
- `workspace` - Workspace entity

**Structure:**
```
entity-name/
├── model/           # Models, types, utilities
└── ui/              # Entity-specific UI (optional)
```

**Responsibilities:**
- Define entity types and interfaces
- Provide entity utilities
- Entity-specific UI components

### Shared Layer (`shared/`)

Shared resources used across the application.

**Subdirectories:**
- `api/` - API utilities and functions
- `config/` - Configuration files
- `lib/` - Third-party library wrappers
- `store/` - Global state management (Zustand)
- `ui/` - Reusable UI components

**Responsibilities:**
- Provide reusable utilities
- Manage global state
- Share UI components
- API communication

## State Management

### Zustand Store

The application uses Zustand for state management. The main store is located in `shared/store/workspaceStore.ts`.

**Store Structure:**
- Workspace state (nodes, links, calendar)
- UI state (modals, loading states)
- Workspace management (current workspace, workspaces list)

**Usage:**
```typescript
import { useWorkspaceStore } from '@/shared/store';

const MyComponent = () => {
  const nodes = useWorkspaceStore((state) => state.nodes);
  const setNodes = useWorkspaceStore((state) => state.setNodes);
  // ...
};
```

## Data Flow

1. **User Action** → Feature
2. **Feature** → Updates Store or Entity
3. **Store Change** → Triggers Re-render
4. **Components** → Read from Store
5. **UI Updates** → User sees changes

## Import Rules

Following FSD principles:

- ✅ **Allowed:**
  - Lower layers can import from upper layers
  - Features can import from entities and shared
  - Widgets can import from features, entities, and shared
  - Pages can import from widgets, features, entities, and shared

- ❌ **Not Allowed:**
  - Upper layers cannot import from lower layers
  - Features cannot import from widgets or pages
  - Entities cannot import from features, widgets, or pages

## TypeScript

The project uses TypeScript for type safety:

- All new code should be in TypeScript
- Types are defined in `types.ts` files
- Shared types are in `shared/store/types.ts`
- Entity types are in `entities/*/model/types.ts`

## Best Practices

1. **Keep layers isolated** - Don't break FSD rules
2. **Use the store** - For global state, use Zustand store
3. **Type everything** - Avoid `any`, use proper types
4. **Follow naming conventions** - See CONTRIBUTING.md
5. **Write comments in English** - For international collaboration
6. **Keep components small** - Single responsibility principle
7. **Use index files** - For clean public APIs

## Examples

### Creating a New Feature

1. Create feature directory: `features/my-feature/`
2. Create `model/useMyFeature.ts` with logic
3. Create `index.ts` for exports
4. Use in widgets or pages

### Adding a New Entity

1. Create entity directory: `entities/my-entity/`
2. Define types in `model/types.ts`
3. Add utilities in `model/utils.ts`
4. Export from `model/index.ts`

### Using the Store

```typescript
import { useWorkspaceStore } from '@/shared/store';

const MyComponent = () => {
  const { nodes, setNodes } = useWorkspaceStore();
  // Use nodes and setNodes
};
```

## Migration Notes

The project was migrated from JavaScript to TypeScript and from React hooks to Zustand store. Some legacy code may still use hooks, but new code should use the store.

## Resources

- [Feature-Sliced Design Documentation](https://feature-sliced.design/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

