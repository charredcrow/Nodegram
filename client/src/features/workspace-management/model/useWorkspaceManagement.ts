// Hook for managing workspaces (wrapper around store)
import { useWorkspaceStore } from '../../../shared/store';

export const useWorkspaceManagement = () => {
  const {
    workspaces,
    setWorkspaces,
    workspaceData,
    setWorkspaceData,
    currentWid,
    setCurrentWid,
    widModeShared,
    setWidModeShared,
    userRole,
    handleWorkspacesUpdate,
    generateWid,
    createExampleNodes,
    createExampleLinks,
  } = useWorkspaceStore();

  return {
    workspaces,
    setWorkspaces,
    workspaceData,
    setWorkspaceData,
    currentWid,
    setCurrentWid,
    widModeShared,
    setWidModeShared,
    userRole,
    handleWorkspacesUpdate,
    generateWid,
    createExampleNodes,
    createExampleLinks,
  };
};
