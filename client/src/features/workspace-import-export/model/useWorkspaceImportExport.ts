import { useWorkspaceStore } from '@/shared/store';
import { useNotification } from '@/app/providers/NotificationProvider';
import type { Node, Link, CalendarItem } from '@/shared/store/types';

export interface WorkspaceExportData {
  nodes: Node[];
  links: Link[];
  calendar: CalendarItem[];
  transform?: string;
  exportedAt: string;
  version: string;
}

export const useWorkspaceImportExport = () => {
  const { showNotification } = useNotification();
  const nodes = useWorkspaceStore((state) => state.nodes);
  const links = useWorkspaceStore((state) => state.links);
  const calendar = useWorkspaceStore((state) => state.calendar);
  const savedTransform = useWorkspaceStore((state) => state.savedTransform);
  const setNodes = useWorkspaceStore((state) => state.setNodes);
  const setLinks = useWorkspaceStore((state) => state.setLinks);
  const setCalendar = useWorkspaceStore((state) => state.setCalendar);
  const setSavedTransform = useWorkspaceStore((state) => state.setSavedTransform);
  const currentWid = useWorkspaceStore((state) => state.currentWid);
  const nodesRef = useWorkspaceStore((state) => state.nodesRef);
  const linksRef = useWorkspaceStore((state) => state.linksRef);
  const calendarRef = useWorkspaceStore((state) => state.calendarRef);
  const triggerUpdateRef = useWorkspaceStore((state) => state.triggerUpdateRef);

  /**
   * Export current workspace data to JSON file
   */
  const exportWorkspace = () => {
    try {
      const exportData: WorkspaceExportData = {
        nodes: nodes || [],
        links: links || [],
        calendar: calendar || [],
        transform: savedTransform || undefined,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nodegram-workspace-${currentWid || 'export'}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('Workspace exported successfully', 'success', 3000);
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export workspace', 'error', 5000);
    }
  };

  /**
   * Import workspace data from JSON file
   */
  const importWorkspace = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text) as WorkspaceExportData;

        // Validate imported data structure
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Invalid file format');
        }

        // Validate nodes
        let validNodes: Node[] = [];
        if (importedData.nodes && Array.isArray(importedData.nodes)) {
          validNodes = importedData.nodes
            .filter(
              (node) =>
                node && typeof node === 'object' && (typeof node.id === 'number' || typeof node.id === 'string')
            )
            .map((node) => ({
              ...node,
              id: Number(node.id),
              x: typeof node.x === 'number' ? node.x : 0,
              y: typeof node.y === 'number' ? node.y : 0,
            }));
        }
        setNodes(validNodes);
        if (nodesRef) {
          nodesRef.current = validNodes;
        }

        // Validate links
        let validLinks: Link[] = [];
        if (importedData.links && Array.isArray(importedData.links)) {
          validLinks = importedData.links.filter(
            (link) =>
              link &&
              typeof link === 'object' &&
              (typeof link.source === 'number' || typeof link.source === 'string') &&
              (typeof link.target === 'number' || typeof link.target === 'string')
          );
        }
        setLinks(validLinks);
        if (linksRef) {
          linksRef.current = validLinks;
        }

        // Validate calendar
        const validCalendar = importedData.calendar && Array.isArray(importedData.calendar) ? importedData.calendar : [];
        setCalendar(validCalendar);
        if (calendarRef) {
          calendarRef.current = validCalendar;
        }

        // Import transform if available
        const transformToSet =
          importedData.transform && typeof importedData.transform === 'string'
            ? importedData.transform
            : 'translate(0,0) scale(1)';
        setSavedTransform(transformToSet);

        // Save to localStorage
        if (currentWid) {
          const storageKey = `_ng_workspace_${currentWid}`;
          const dataToSave = {
            nodes: validNodes,
            links: validLinks,
            calendar: validCalendar,
            transform: transformToSet,
          };
          localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        }

        // Trigger graph update first
        if (triggerUpdateRef && triggerUpdateRef.current) {
          try {
            triggerUpdateRef.current();
          } catch (error) {
            console.error('Error triggering graph update:', error);
          }
        }

        // Apply transform to graph after graph update
        // Use a retry mechanism to wait for SVG to be ready
        const applyTransform = (retryCount = 0) => {
          const maxRetries = 10;
          const retryDelay = 100;

          const svgContainer = document.querySelector('#workspace-container');
          const svg = svgContainer?.querySelector('svg');
          const mainGraph = svg?.querySelector('#main_graph');

          if (svg && mainGraph && transformToSet) {
            try {
              // Import d3 dynamically
              import('d3').then((d3Module) => {
                const d3 = d3Module.default || d3Module;
                
                // Parse transform string
                const translateMatch = transformToSet.match(/translate\(([^,]+),\s*([^,\)]+)\)/);
                const scaleMatch = transformToSet.match(/scale\(([^,\)]+)\)/);

                if (translateMatch && scaleMatch && translateMatch[1] && translateMatch[2] && scaleMatch[1]) {
                  const x = parseFloat(translateMatch[1]);
                  const y = parseFloat(translateMatch[2]);
                  const k = parseFloat(scaleMatch[1]);

                  // Apply transform using d3.zoom
                  const d3SvgContainer = d3.select(svg as Element);
                  const zoomBehavior = d3.zoom().scaleExtent([0.01, 4.0]);
                  const zoomIdentity = d3.zoomIdentity.translate(x, y).scale(k);

                  // Check if zoom is already attached
                  if (d3SvgContainer.property('__zoom')) {
                    d3SvgContainer.call(zoomBehavior.transform, zoomIdentity);
                  } else {
                    d3SvgContainer.call(zoomBehavior);
                    d3SvgContainer.call(zoomBehavior.transform, zoomIdentity);
                  }
                  
                  d3.select(mainGraph as Element).attr('transform', transformToSet);
                }
              }).catch((error) => {
                console.error('Error loading d3:', error);
                // Fallback: apply transform directly via DOM
                if (mainGraph && transformToSet) {
                  (mainGraph as SVGElement).setAttribute('transform', transformToSet);
                }
              });
            } catch (error) {
              console.error('Error applying transform:', error);
            }
          } else if (retryCount < maxRetries) {
            // Retry after delay if SVG is not ready yet
            setTimeout(() => applyTransform(retryCount + 1), retryDelay);
          }
        };

        // Start applying transform after initial delay
        setTimeout(() => applyTransform(), 100);

        showNotification('Workspace imported successfully', 'success', 3000);
      } catch (error) {
        console.error('Import error:', error);
        showNotification(
          error instanceof Error ? error.message : 'Failed to import workspace. Invalid file format.',
          'error',
          5000
        );
      }
    };

    reader.onerror = () => {
      showNotification('Failed to read file', 'error', 5000);
    };

    reader.readAsText(file);
  };

  /**
   * Handle file input change event
   */
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importWorkspace(file);
      }
    };
    input.click();
  };

  return {
    exportWorkspace,
    importWorkspace,
    handleImportClick,
  };
};

