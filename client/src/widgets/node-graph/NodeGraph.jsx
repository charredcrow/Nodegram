import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { createRoot } from 'react-dom/client';
import { ConfirmationModal } from '../../shared/ui/confirmation-modal';
import { useNotification } from '../../app/providers/NotificationProvider';
import { formatNumberWithSpaces } from '../../shared/api/workspace';
import DOMPurify from 'dompurify';
import { ImageNodeRenderer, filterImageFiles } from '../../entities/node/ui/image-node-renderer';

export const NodeGraph = ({
  nodes,
  setNodes,
  mode,
  newNode,
  links,
  setLinks,
  typeColors,
  typeWidths,
  setNodeModal,
  typeNodeName,
  registerTrigger,
  typeDefaultContent,
  deleteNodeAndLinks,
  updateNodes,
  updateNodesRefOnly,
  nodeEditorCenterRef,
  savedTransform,
  selectedNodes,
  setSelectedNodes,
  isMassDeleteModalOpen,
  setIsMassDeleteModalOpen,
  currentWid,
  widModeShared,
  onModeChange,
  onWorkspaceChange,
}) => {
  const { showNotification } = useNotification();
  const [needsUpdate, setNeedsUpdate] = React.useState(true);
  const [graphTransform, setGraphTransform] = useState('translate(0,0) scale(1)');
  const lastTargetTransformRef = useRef(null);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const newNodeRef = useRef(newNode);
  useEffect(() => {
    newNodeRef.current = newNode;
    handleNewNode();
  }, [newNode]);
  // Register trigger function in parent component
  useEffect(() => {
    if (registerTrigger) {
      registerTrigger(() => setNeedsUpdate(true));
    }
  }, [registerTrigger]);
  useEffect(() => {
    if (needsUpdate) {
      setNeedsUpdate(false);
    }
  }, [needsUpdate]);

  // --- Moved hooks for drag optimization ---
  const dragNodeRef = useRef(null);
  const dragRAFRef = useRef(null);
  const selectMoveLastPointerRef = useRef(null);

  // Mobile detection
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window;
  const supportsForeignObject = (() => {
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      svg.appendChild(foreignObject);
      return true;
    } catch (e) {
      return false;
    }
  })();
  // Export current links to global for copy button in Toolbar
  useEffect(() => {
    try {
      window.__ng_links__ = Array.isArray(links)
        ? links.map((l) => ({ source: l.source, target: l.target }))
        : [];
    } catch {}
  }, [links]);

  // Constants for synapse
  const SYNAPSE_HEIGHT = 30; // Synapse height in pixels
  const SYNAPSE_RADIUS = SYNAPSE_HEIGHT / 2; // Circle radius equals half of height
  const SYNAPSE_Y_OFFSET = 0; // Top offset

  useEffect(() => {
    // Prevent default page scaling only for SVG
    const preventDefaultZoom = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.target.closest('#main-svg')) {
        e.preventDefault();
      }
    };

    // Prevent scaling only for SVG
    const preventPinchZoom = (e) => {
      if (e.target.closest('#main-svg')) {
        e.preventDefault();
      }
    };

    // Window resize handler
    const handleResize = () => {
      setNeedsUpdate(true);
    };

    // Add handlers
    window.addEventListener('wheel', preventDefaultZoom, { passive: false });
    document.addEventListener('touchmove', preventPinchZoom, { passive: false });
    document.addEventListener('gesturestart', preventPinchZoom, { passive: false });
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('wheel', preventDefaultZoom);
      document.removeEventListener('touchmove', preventPinchZoom);
      document.removeEventListener('gesturestart', preventPinchZoom);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function parseTransformString(transformStr) {
    // Sanitize input data
    const sanitizedStr = DOMPurify.sanitize(transformStr);
    if (!sanitizedStr || typeof sanitizedStr !== 'string') {
      showNotification('Something went wrong', 'warning', 3000);
      return d3.zoomIdentity;
    }

    const translateRegex = /translate\(([^,]+),\s*([^,\)]+)\)/;
    const scaleRegex = /scale\(([^,\)]+)\)/;

    const matchTranslate = sanitizedStr.match(translateRegex);
    const matchScale = sanitizedStr.match(scaleRegex);

    if (!matchTranslate || !matchScale) {
      showNotification('Something went wrong', 'warning', 3000);
      return d3.zoomIdentity;
    }

    const x = parseFloat(matchTranslate[1]);
    const y = parseFloat(matchTranslate[2]);
    const k = parseFloat(matchScale[1]);

    return d3.zoomIdentity.translate(x, y).scale(k);
  }

  const centerScreen = () => {
    const duration = 1000; // Animation duration in ms

    // If no nodes, show notification
    if (nodes.length === 0) {
      showNotification('No nodes to center on', 'info', 3000);
      return;
    }

    // Take first node
    const firstNode = nodes[0];

    // Calculate screen center
    const centerScreenX = window.innerWidth / 2;
    const centerScreenY = window.innerHeight / 2;

    // Calculate node center
    const nodeCenterX = firstNode.x + (typeWidths[firstNode.type] || 200) / 2;
    const nodeCenterY = firstNode.y + 15; // 15 is half of header height

    // Calculate required shift for centering
    const translateX = centerScreenX - nodeCenterX;
    const translateY = centerScreenY - nodeCenterY;

    // Select group that contains graph
    const svgGroup = d3.select('#workspace-container').select('svg').select('g#main_graph');
    if (svgGroup.empty()) {
      showNotification('Something went wrong', 'error', 3000);
      return;
    }

    svgGroup
      .transition()
      .duration(duration)
      .attr('transform', `translate(${translateX},${translateY}) scale(1)`)
      .on('end', () => {
        setGraphTransform(`translate(${translateX},${translateY}) scale(1)`);
        lastTargetTransformRef.current = { x: translateX, y: translateY, k: 1 };
        requestAnimationFrame(() => setNeedsUpdate(true));
      });
  };

  // Focus on node by id with pan/zoom (used by TopbarArrowDown → focusNodeById)
  const focusNode = (nodeId, options = {}) => {
    const { zoom = 1.2, duration = 500 } = options;

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) {
      showNotification('Node not found', 'warning', 2500);
      return;
    }

    // Node center coordinates
    const nodeCenterX =
      targetNode.x + (targetNode._nodeWidth || typeWidths[targetNode.type] || 200) / 2;
    const nodeCenterY = targetNode.y + 15;

    // Screen center
    const centerScreenX = window.innerWidth / 2;
    const centerScreenY = window.innerHeight / 2;

    const targetScale = Math.min(Math.max(zoom, 0.01), 4.0);
    const targetX = centerScreenX - nodeCenterX * targetScale;
    const targetY = centerScreenY - nodeCenterY * targetScale;

    // Animation from current transform to target
    const startTime = performance.now();
    const initial = parseTransformString(graphTransform);

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const currentX = initial.x * (1 - t) + targetX * t;
      const currentY = initial.y * (1 - t) + targetY * t;
      const currentK = initial.k * (1 - t) + targetScale * t;
      setGraphTransform(`translate(${currentX},${currentY}) scale(${currentK})`);
      // Save target transform on each frame for accurate restoration after rebuild
      lastTargetTransformRef.current = { x: currentX, y: currentY, k: currentK };
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Rebuild for new transform on next frame to avoid jitter
        requestAnimationFrame(() => setNeedsUpdate(true));
      }
    };
    requestAnimationFrame(animate);
  };

  // New scaling function (scale fit)
  const scaleFit = () => {
    if (nodes.length === 0) {
      showNotification('Something went wrong', 'info', 3000);
      return;
    }
    // Calculate minimum and maximum node coordinates
    const padding = 300; // Padding around all nodes
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + (typeWidths[n.type] || 260)));
    const maxY = Math.max(...nodes.map((n) => n.y + 300)); // Assume node height is 100
    const nodesWidth = maxX - minX;
    const nodesHeight = maxY - minY;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    // Calculate scale so all nodes fit with given padding
    const scaleX = containerWidth / (nodesWidth + padding);
    const scaleY = containerHeight / (nodesHeight + padding);
    const newScale = Math.min(scaleX, scaleY, 1); // Don't increase scale above 1 if needed
    // Calculate offset so node area is centered in container
    const newX = (containerWidth - nodesWidth * newScale) / 2 - minX * newScale;
    const newY = (containerHeight - nodesHeight * newScale) / 2 - minY * newScale;

    // Target transform as object
    const target = { x: newX, y: newY, k: newScale };

    // Animation: take current transform, parse it and smoothly interpolate to target
    const duration = 1000; // Animation duration in ms
    const startTime = performance.now();
    const initial = parseTransformString(graphTransform); // Object {x, y, k}

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1); // Normalize from 0 to 1
      // Linear interpolation
      const currentX = initial.x * (1 - t) + target.x * t;
      const currentY = initial.y * (1 - t) + target.y * t;
      const currentK = initial.k * (1 - t) + target.k * t;
      setGraphTransform(`translate(${currentX},${currentY}) scale(${currentK})`);
      lastTargetTransformRef.current = { x: currentX, y: currentY, k: currentK };
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        requestAnimationFrame(() => setNeedsUpdate(true));
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const svg = d3.select('#workspace-container').select('svg').select('g#main_graph');
    if (!svg.empty()) {
      svg.attr('transform', graphTransform);
    }
  }, [graphTransform]);

  // useEffect(() => {
  //   if (nodeEditorCenterRef) {
  //     nodeEditorCenterRef.current = centerScreen;
  //   }
  // }, [nodeEditorCenterRef, centerScreen]);
  useEffect(() => {
    if (nodeEditorCenterRef) {
      nodeEditorCenterRef.current = {
        centerScreen, // Centering function
        scaleFit, // Scaling function (fit to screen)
        focusNode, // Focus on specific node
      };
    }
  }, [nodeEditorCenterRef, centerScreen, scaleFit]);

  const handleNewNode = () => {
    if (newNodeRef.current) {
      // 1. Split string by '_' character
      // const parts = newNodeRef.current.split('_');
      // Validate input data
      const sanitizedNewNode = DOMPurify.sanitize(newNodeRef.current);
      const parts = sanitizedNewNode.split('_');
      if (parts.length < 2) {
        return;
      }
      const firstValue = parts[0];
      // const defaultTransform = { x: 100, y: 100, k: 1 };
      const currentTransform = parseTransformString(graphTransform);
      const translateX = currentTransform.x;
      const translateY = currentTransform.y;
      const scale = currentTransform.k;
      const nodeTitle = typeNodeName[firstValue];

      // 4. Calculate screen center in screen coordinates
      const centerScreenX = window.innerWidth / 2 - 50;
      const centerScreenY = window.innerHeight / 2 - 130;
      const uniqueId = Math.floor(Math.random() * (20 - 2 + 1)) + 5;
      // 5. Convert screen center to graph coordinates
      const newX = (centerScreenX - translateX) / scale + uniqueId;
      const newY = (centerScreenY - translateY) / scale + uniqueId;

      // 6. Determine new ID (auto-increment)
      const newId = nodes.length > 0 ? Math.max(...nodes.map((node) => node.id)) + 1 : 1;
      let newDescription;
      if (firstValue === 'typeG' || firstValue === 'typeK') {
        newDescription = ' '; // Space or empty string
      } else if (
        firstValue === 'typeH' ||
        firstValue === 'typeI' ||
        firstValue === 'typeB' ||
        firstValue === 'typeE' ||
        firstValue === 'typeF' ||
        firstValue === 'typeL' ||
        firstValue === 'typeM' ||
        firstValue === 'typeN' ||
        firstValue === 'typeO' ||
        firstValue === 'typeP'
      ) {
        newDescription = '';
      } else {
        newDescription = 'New description';
      }
      // 7. Create new node object
      const newNodeObj = {
        id: newId,
        title: 'New ' + nodeTitle,
        description: newDescription,
        x: newX,
        y: newY,
        type: firstValue,
        content: typeDefaultContent[firstValue],
      };

      // 8. Add new node to nodes array
      const updatedNodes = [...nodes, newNodeObj];
      updateNodes(updatedNodes);
      setNeedsUpdate(true);
    }
  };

  // Function for time calculations
  function getEventCountdown(node) {
    const now = Date.now();
    const { event_startTime, event_endTime } = node.content || {};

    if (event_startTime) {
      if (now < event_startTime) {
        // Before event start
        const timeRemaining = Math.ceil((event_startTime - now) / 1000);
        return `Starts in: ${formatTime(timeRemaining)}`;
      } else if (event_endTime && now < event_endTime) {
        // During event
        const timeRemaining = Math.ceil((event_endTime - now) / 1000);
        return `Ends in: ${formatTime(timeRemaining)}`;
      }
    }

    // If no data, return description
    return node.description || '';
  }

  // Time formatting function
  function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  }

  // Add new function to calculate maximum text width
  const calculateMaxTextWidth = (headerText, bodyText) => {
    // Create temporary SVG element for text measurement
    const tempSvg = d3
      .select('body')
      .append('svg')
      .style('visibility', 'hidden')
      .style('position', 'absolute');

    const tempText = tempSvg
      .append('text')
      .style('font-size', '16px') // Header font size
      .style('font-weight', '600');

    // Function to measure text width
    const measureTextWidth = (text) => {
      if (!text) return 0;
      const words = text.split(/\s+/);
      let maxWidth = 0;

      words.forEach((word) => {
        tempText.text(word);
        const width = tempText.node().getComputedTextLength();
        maxWidth = Math.max(maxWidth, width);
      });

      return maxWidth;
    };

    // Measure header and body text widths
    const headerMaxWidth = measureTextWidth(headerText);

    // Change font size for body text measurement
    tempText
      .style('font-size', '14px') // Body font size
      .style('font-weight', 'normal');
    const bodyMaxWidth = measureTextWidth(bodyText);

    // Clean up temporary SVG
    tempSvg.remove();

    // Return the maximum width plus padding
    return Math.max(headerMaxWidth, bodyMaxWidth) + 40; // 40px padding (20px on each side)
  };

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Remove extra SVG elements
    const svgContainer = d3.select('#workspace-container');
    const svgElements = svgContainer.selectAll('svg');

    if (needsUpdate) {
      // 1) Remove old svg if it exists
      svgElements.remove();

      // -- Instead of chaining .call(d3.zoom()) immediately --
      // Create <svg> (call it parentSvg, then append("g") and call it svg)
      const parentSvg = svgContainer
        .append('svg')
        .attr('id', 'main-svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      // 2) Create Zoom Behavior
      const zoomBehavior = d3
        .zoom()
        .scaleExtent([0.01, 4.0]) // Set scale limits
        .on('zoom', (event) => {
          // Limit scale
          const newScale = Math.min(Math.max(event.transform.k, 0.01), 4.0);
          const transform = d3.zoomIdentity
            .translate(event.transform.x, event.transform.y)
            .scale(newScale);

          setGraphTransform(transform.toString());
          svg.attr('transform', transform.toString());
          // Any user zoom/pan interaction invalidates last target transform
          lastTargetTransformRef.current = null;
        });

      // 3) Attach zoom to <svg>
      parentSvg.call(zoomBehavior);

      // 4) Create <g id="main_graph"> and save to svg variable
      //    (as in your code)
      const svg = parentSvg.append('g').attr('id', 'main_graph');

      // If there's target transform from animation — apply it precisely
      if (lastTargetTransformRef.current) {
        const { x, y, k } = lastTargetTransformRef.current;
        const precise = d3.zoomIdentity.translate(x, y).scale(k);
        parentSvg.call(zoomBehavior.transform, precise);
        svg.attr('transform', precise.toString());
        setGraphTransform(precise.toString());
        // Used precise transform once — clear to avoid sticking to it
        lastTargetTransformRef.current = null;
      } else if (graphTransform) {
        const parsedTransform = parseTransformString(graphTransform);
        parentSvg.call(zoomBehavior.transform, parsedTransform);
        svg.attr('transform', graphTransform);
      }

      // const limitedNodes = nodes.slice(0, 3);
      const limitedNodes = nodes;

      // Line generator
      const lineGenerator = d3
        .line()
        .curve(d3.curveBundle.beta(1.0)) // Use curveBundle.beta(1.0) curve
        .x((d) => d.x)
        .y((d) => d.y);

      // Add lines
      const linkElements = svg
        .selectAll('.link')
        .data(Array.isArray(links) && links.length > 0 ? links : [])
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('stroke', '#7aa2f7')
        .attr('stroke-width', 6)
        .attr('fill', 'none')
        .attr('class', 'link')
        .style('pointer-events', 'visibleStroke')
        .style('opacity', 0.6)
        .attr('d', (d) => {
          const sourceNode = nodes.find((node) => node.id === d.source);
          const targetNode = nodes.find((node) => node.id === d.target);

          if (sourceNode && targetNode) {
            const sourceCenterX = sourceNode.x + (typeWidths[sourceNode.type] || 200) / 2;
            const sourceCenterY = sourceNode.y + 15;
            const targetCenterX = targetNode.x + (typeWidths[targetNode.type] || 200) / 2;
            const targetCenterY = targetNode.y + 15;

            const points = [
              { x: sourceCenterX, y: sourceCenterY },
              {
                x: sourceCenterX + (targetCenterX - sourceCenterX) / 3,
                y: sourceCenterY,
              },
              {
                x: sourceCenterX + ((targetCenterX - sourceCenterX) * 2) / 3,
                y: targetCenterY,
              },
              { x: targetCenterX, y: targetCenterY },
            ];

            return lineGenerator(points);
          }
          return '';
        });

      linkElements.on('click', (event, linkData) => {
        if (modeRef.current === 'delete') {
          const currentLinks = Array.isArray(links) ? links : [];
          const updatedLinks = currentLinks.filter((l) => l !== linkData);
          setLinks(updatedLinks);
          setNeedsUpdate(true);
        }
      });

      // Add outputs (semi-transparent circles) for nodes
      const outputCircles = svg
        .selectAll('.output-circle')
        .data(limitedNodes) // limitedNodes = nodes
        .enter()
        .append('circle')
        .attr('class', 'output-circle')
        .attr('r', 11)
        .attr('fill', (d) => d.nodeColor || typeColors[d.type] || '#2383ed')
        .attr('cx', (d) => d.x + (d._nodeWidth || typeWidths[d.type] || 200))
        .attr('cy', (d) => d.y + 15)
        // By default make circles non-interactive, except in create mode
        .style('pointer-events', modeRef.current === 'create' ? 'auto' : 'none');

      // Add input circles (parallel to outputs)
      const inputCircles = svg
        .selectAll('.input-circle')
        .data(limitedNodes)
        .enter()
        .append('circle')
        .attr('class', 'input-circle')
        .attr('r', 6)
        .attr('fill', 'transparent')
        // Input circles are always non-interactive
        .style('pointer-events', 'none');

      // --- Function to update lines and circles for dragged node ---
      function updateLinksForNode(nodeId) {
        function getNode(id) {
          if (dragNodeRef.current && dragNodeRef.current.id === id) {
            return dragNodeRef.current;
          }
          return nodes.find((node) => node.id === id);
        }
        linkElements
          .filter((d) => d.source === nodeId || d.target === nodeId)
          .attr('d', (d) => {
            const sourceNode = getNode(d.source);
            const targetNode = getNode(d.target);
            // Update output circles
            outputCircles
              .filter((dd) => dd.id === d.source)
              .attr('cx', (d) => d.x + (d._nodeWidth || typeWidths[d.type] || 200))
              .attr('cy', (d) => d.y + 15);
            inputCircles
              .filter((dd) => dd.id === d.target)
              .attr('cx', (d) => d.x)
              .attr('cy', (d) => d.y + 15);
            if (sourceNode && targetNode) {
              const isSourceSynapse = sourceNode.type === 'typeL';
              const isTargetSynapse = targetNode.type === 'typeL';
              let sourceX, sourceY, targetX, targetY;
              if (isSourceSynapse) {
                sourceX = sourceNode.x + SYNAPSE_RADIUS;
                sourceY = sourceNode.y + SYNAPSE_RADIUS + SYNAPSE_Y_OFFSET;
              } else {
                sourceX =
                  sourceNode.x + (sourceNode._nodeWidth || typeWidths[sourceNode.type] || 200);
                sourceY = sourceNode.y + 15;
              }
              if (isTargetSynapse) {
                targetX = targetNode.x + SYNAPSE_RADIUS;
                targetY = targetNode.y + SYNAPSE_RADIUS + SYNAPSE_Y_OFFSET;
              } else {
                targetX = targetNode.x;
                targetY = targetNode.y + 15;
              }
              let points;
              if (isSourceSynapse && isTargetSynapse) {
                points = [
                  { x: sourceX, y: sourceY },
                  { x: targetX, y: targetY },
                ];
              } else {
                const offset = 30;
                points = [
                  { x: sourceX, y: sourceY },
                  { x: sourceX + (isSourceSynapse ? 0 : offset), y: sourceY },
                  { x: targetX - (isTargetSynapse ? 0 : offset), y: targetY },
                  { x: targetX, y: targetY },
                ];
              }
              return lineGenerator(points);
            }
            return '';
          });
        // Update output and input circles for dragged node
        outputCircles
          .filter((d) => d.id === nodeId)
          .attr('cx', (d) => d.x + (d._nodeWidth || typeWidths[d.type] || 200))
          .attr('cy', (d) => d.y + 15);
        inputCircles
          .filter((d) => d.id === nodeId)
          .attr('cx', (d) => d.x)
          .attr('cy', (d) => d.y + 15);
      }

      // Add nodes
      // Track touch positions for drag filter
      const touchPositions = new Map();
      
      // Create drag behavior with filter to prevent immediate activation on touch
      const dragBehavior = d3.drag()
        .filter(function(event) {
          // For touch events, allow drag only if there's movement
          if (event.type === 'touchstart' || event.sourceEvent?.type === 'touchstart') {
            const touch = event.touches?.[0] || event.sourceEvent?.touches?.[0];
            if (touch) {
              const nodeId = d3.select(this).datum()?.id;
              if (nodeId) {
                touchPositions.set(nodeId, {
                  x: touch.clientX,
                  y: touch.clientY,
                  time: Date.now()
                });
              }
              // Allow drag to start, but we'll check movement in dragstarted
              return true;
            }
          }
          // For mouse events, always allow
          return !event.button || event.button === 0;
        })
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);

      const nodeElements = svg
        .selectAll('.node')
        .data(limitedNodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
        .call(dragBehavior);

      // Main code for creating nodes
      const cornerRadius = 4; // Corner radius

      nodeElements.each(function (d) {
        const nodeHeader = d3.select(this).append('g').attr('transform', 'translate(0, 0)');

        // Calculate max width based on both header and body text
        const maxWidth = calculateMaxTextWidth(d.title, d.description || '');
        let nodeWidth = Math.max(maxWidth, typeWidths[d.type] || 200);

        // Special handling for typeP - consider custom width and minimum text width
        if (d.type === 'typeP') {
          const minTextWidth = maxWidth; // Minimum width based on text
          if (d.content?.headerWidth) {
            // Use maximum value between custom width and minimum text width
            nodeWidth = Math.max(d.content.headerWidth, minTextWidth);
          }
        }

        d._nodeWidth = nodeWidth; // Save width in node object

        if (d.type === 'typeL') {
          // Draw circle with unique class for typeL
          nodeHeader
            .append('circle')
            .attr('class', 'synapse-circle')
            .attr('cx', SYNAPSE_RADIUS)
            .attr('cy', SYNAPSE_RADIUS + SYNAPSE_Y_OFFSET)
            .attr('r', SYNAPSE_RADIUS)
            .attr('fill', d.nodeColor || typeColors[d.type] || '#2383ed');

          // Add text below circle
          const textElement = nodeHeader
            .append('text')
            .attr('x', SYNAPSE_RADIUS)
            .attr('y', SYNAPSE_RADIUS * 2 + SYNAPSE_Y_OFFSET + 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', 'var(--color-text-primary)')
            .text(d.title);

          // Update node width for correct link positioning
          d._nodeWidth = SYNAPSE_HEIGHT;
        } else {
          // Standard rendering for other types
          const headerText = nodeHeader
            .append('text')
            .attr('x', 10)
            .attr('y', 20)
            .attr('font-size', '16px')
            .attr('font-weight', '600')
            .attr('fill', 'white');

          const headerRects = nodeHeader
            .append('path')
            .attr('d', (d) => {
              const height = 30;
              return `M${cornerRadius},0 
                      H${nodeWidth - cornerRadius} 
                      Q${nodeWidth},0 ${nodeWidth},${cornerRadius} 
                      V${height} 
                      H0 
                      V${cornerRadius} 
                      Q0,0 ${cornerRadius},0 
                      Z`;
            })
            .attr('fill', (d) => d.nodeColor || typeColors[d.type] || '#2383ed');

          // For typeP use already calculated width from nodeWidth
          let blockWidth = nodeWidth;

          headerText.each(function (d, i) {
            const width = nodeWidth - 20;
            const height = wrapText(d3.select(this), d.title, width);

            // Update header shape considering text height
            headerRects
              .filter((_, j) => i === j)
              .attr('d', (d) => {
                const hasBody = !!d.description;
                if (!hasBody) {
                  return `M${cornerRadius},0 
                          H${blockWidth - cornerRadius} 
                          Q${blockWidth},0 ${blockWidth},${cornerRadius} 
                          V${height + 11 - cornerRadius + (d.type === 'typeP' ? cornerRadius : 0)} 
                          Q${blockWidth},${height + 11} ${blockWidth - cornerRadius},${height + 11} 
                          H${cornerRadius - (d.type === 'typeP' ? cornerRadius : 0)} 
                          Q0,${height + 11} 0,${height + 11 - cornerRadius} 
                          V${cornerRadius} 
                          Q0,0 ${cornerRadius},0 
                          Z`;
                } else {
                  return `M${cornerRadius},0 
                          H${blockWidth - cornerRadius} 
                          Q${blockWidth},0 ${blockWidth},${cornerRadius} 
                          V${height + 11} 
                          H0 
                          V${cornerRadius} 
                          Q0,0 ${cornerRadius},0 
                          Z`;
                }
              });

            headerText.raise();
          });

          const numLines = nodeHeader.selectAll('tspan').size();

          if (numLines > 1) {
            nodeHeader.attr('transform', `translate(0, ${-20 * (numLines - 1)})`);
          }

          // Handle node body
          const nodeBody = d3.select(this).append('g').attr('transform', `translate(0, 30)`);

          // Special handling for typeP - display images
          if (d.type === 'typeP') {
            // Check for image URL or files
            const imageUrl = d.content?.imageUrl;
            const imageFiles = filterImageFiles(d.content?.selectedFiles || []);
            const hasImage = imageUrl || imageFiles.length > 0;

            if (hasImage) {
              // Use custom sizes from content if available
              let optimalWidth = blockWidth; // Use blockWidth from header

              // Create bodyRects for image with new width
              const bodyRects = nodeBody
                .append('path')
                .attr('d', (d) => {
                  const imageHeight = 220; // Initial height, will be updated automatically
                  return `M0,0 
                          H${blockWidth} 
                          V${imageHeight} 
                          Q${blockWidth},${imageHeight + cornerRadius} ${blockWidth - cornerRadius},${imageHeight + cornerRadius} 
                          H${cornerRadius} 
                          Q0,${imageHeight + cornerRadius} 0,${imageHeight} 
                          Z`;
                })
                .attr('fill', 'var(--node-body-color)');

              // Create container for image
              const imageContainer = nodeBody
                .append('foreignObject')
                .attr('width', blockWidth)
                .attr('height', 200) // Initial height, will be updated automatically
                .attr('x', 0)
                .attr('y', 0);

              // Create React element for displaying image
              const imageElement = document.createElement('div');
              imageElement.className = 'image-node-foreign';

              // Mobile-specific inline styles to force proper positioning
              if (isMobile) {
                imageElement.style.cssText = `
                  position: static !important;
                  transform: none !important;
                  transform-origin: 0 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  z-index: auto !important;
                `;
              } else {
                imageElement.style.cssText = `
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                `;
              }

              // Function to update foreignObject height
              const updateForeignObjectHeight = (newHeight) => {
                // Height automatically adjusts to image proportions
                // Add small buffer to prevent clipping
                const totalHeight = Math.max(newHeight, 200) + 10; // Minimum 200px + 10px buffer
                imageContainer.attr('height', totalHeight);

                // Update body shape with new height
                bodyRects.attr('d', (d) => {
                  const newPath = `M0,0 
                          H${blockWidth} 
                          V${totalHeight} 
                          Q${blockWidth},${totalHeight + cornerRadius} ${blockWidth - cornerRadius},${totalHeight + cornerRadius} 
                          H${cornerRadius} 
                          Q0,${totalHeight + cornerRadius} 0,${totalHeight} 
                          Z`;
                  return newPath;
                });
              };

              // Function to update foreignObject width when headerWidth changes
              const updateForeignObjectWidth = (newWidth) => {
                imageContainer.attr('width', newWidth);

                // Update body shape with new width
                bodyRects.attr('d', (d) => {
                  const currentHeight = imageContainer.attr('height') || 200;
                  const newPath = `M0,0 
                          H${newWidth} 
                          V${currentHeight} 
                          Q${newWidth},${currentHeight + cornerRadius} ${newWidth - cornerRadius},${currentHeight + cornerRadius} 
                          H${cornerRadius} 
                          Q0,${currentHeight + cornerRadius} 0,${currentHeight} 
                          Z`;
                  return newPath;
                });
              };

              // Render React component
              const root = createRoot(imageElement);
              root.render(
                React.createElement(ImageNodeRenderer, {
                  nodeData: d,
                  nodeWidth: blockWidth - 20,
                  currentWid: currentWid,
                  widModeShared: widModeShared,
                  onHeightChange: updateForeignObjectHeight,
                })
              );

              imageContainer.node().appendChild(imageElement);

              // Simple width update when content changes
              const minTextWidthForUpdate = maxWidth; // Minimum width based on text
              const currentHeaderWidth = Math.max(
                d.content?.headerWidth || blockWidth,
                minTextWidthForUpdate
              );
              if (currentHeaderWidth !== blockWidth) {
                // Update _nodeWidth in node object
                d._nodeWidth = currentHeaderWidth;

                updateForeignObjectWidth(currentHeaderWidth);

                // Also update headerRects with new width
                headerRects
                  .filter((_, j) => i === j)
                  .attr('d', (d) => {
                    const hasBody = !!d.description;
                    if (!hasBody) {
                      return `M${cornerRadius},0 
                              H${currentHeaderWidth - cornerRadius} 
                              Q${currentHeaderWidth},0 ${currentHeaderWidth},${cornerRadius} 
                              V${height + 11 - cornerRadius} 
                              Q${currentHeaderWidth},${height + 11} ${currentHeaderWidth - cornerRadius},${height + 11} 
                              H${cornerRadius} 
                              Q0,${height + 11} 0,${height + 11 - cornerRadius} 
                              V${cornerRadius} 
                              Q0,0 ${cornerRadius},0 
                              Z`;
                    } else {
                      return `M${cornerRadius},0 
                              H${currentHeaderWidth - cornerRadius} 
                              Q${currentHeaderWidth},0 ${currentHeaderWidth},${cornerRadius} 
                              V${height + 11} 
                              H0 
                              V${cornerRadius} 
                              Q0,0 ${cornerRadius},0 
                              Z`;
                    }
                  });

                // Update outputCircles position for this node
                updateLinksForNode(d.id);

                // Also update nodeWidth for ImageNodeRenderer
                root.render(
                  React.createElement(ImageNodeRenderer, {
                    nodeData: d,
                    nodeWidth: currentHeaderWidth - 20,
                    currentWid: currentWid,
                    widModeShared: widModeShared,
                    onHeightChange: updateForeignObjectHeight,
                  })
                );
              }
              return; // Exit function without creating bodyText
            } else {
              // If no images, create placeholder
              const minTextWidth = maxWidth; // Minimum width based on text
              const placeholderWidth = Math.max(
                200,
                Math.min(800, Math.max(300 + 40, minTextWidth))
              ); // Width considering text

              const bodyRects = nodeBody
                .append('path')
                .attr('d', (d) => {
                  const placeholderHeight = 100;
                  return `M0,0 
                          H${placeholderWidth} 
                          V${placeholderHeight} 
                          Q${placeholderWidth},${placeholderHeight + cornerRadius} ${placeholderWidth - cornerRadius},${placeholderHeight + cornerRadius} 
                          H${cornerRadius} 
                          Q0,${placeholderHeight + cornerRadius} 0,${placeholderHeight} 
                          Z`;
                })
                .attr('fill', 'var(--node-body-color)')
                .attr('opacity', 0)
                .style('pointer-events', 'none');

              // Create placeholder for image
              const placeholderContainer = nodeBody
                .append('foreignObject')
                .attr('width', placeholderWidth)
                .attr('height', 80) // Initial height, will be updated
                .attr('x', 0)
                .attr('y', 0);

              const placeholderElement = document.createElement('div');
              placeholderElement.className = 'image-node-foreign';

              // Mobile-specific inline styles to force proper positioning
              if (isMobile) {
                placeholderElement.style.cssText = `
                  position: static !important;
                  transform: none !important;
                  transform-origin: 0 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  overflow: hidden !important;
                  z-index: auto !important;
                `;
              }

              // Function to update placeholder foreignObject height
              const updatePlaceholderHeight = (newHeight) => {
                const totalHeight = newHeight; // Add padding
                placeholderContainer.attr('height', totalHeight);

                // Update body shape with new height
                bodyRects.attr('d', (d) => {
                  return `M0,0 
                          H${placeholderWidth} 
                          V${totalHeight} 
                          Q${placeholderWidth},${totalHeight + cornerRadius} ${placeholderWidth - cornerRadius},${totalHeight + cornerRadius} 
                          H${cornerRadius} 
                          Q0,${totalHeight + cornerRadius} 0,${totalHeight} 
                          Z`;
                });
              };

              const root = createRoot(placeholderElement);
              root.render(
                React.createElement(ImageNodeRenderer, {
                  nodeData: d,
                  nodeWidth: placeholderWidth - 20,
                  currentWid: currentWid,
                  widModeShared: widModeShared,
                  onHeightChange: updatePlaceholderHeight,
                })
              );

              placeholderContainer.node().appendChild(placeholderElement);

              // Simple placeholder width update when content changes
              const minTextWidthForPlaceholder = maxWidth; // Minimum width based on text
              const currentHeaderWidth = Math.max(
                d.content?.headerWidth || placeholderWidth,
                minTextWidthForPlaceholder
              );
              if (currentHeaderWidth !== placeholderWidth) {
                // Update _nodeWidth in node object
                d._nodeWidth = currentHeaderWidth;

                placeholderContainer.attr('width', currentHeaderWidth);

                // Update body shape with new width
                bodyRects.attr('d', (d) => {
                  const currentHeight = placeholderContainer.attr('height') || 80;
                  return `M0,0 
                          H${currentHeaderWidth} 
                          V${currentHeight} 
                          Q${currentHeaderWidth},${currentHeight + cornerRadius} ${currentHeaderWidth - cornerRadius},${currentHeight + cornerRadius} 
                          H${cornerRadius} 
                          Q0,${currentHeight + cornerRadius} 0,${currentHeight} 
                          Z`;
                });

                // Update outputCircles position for this node
                updateLinksForNode(d.id);

                // Also update nodeWidth for ImageNodeRenderer
                root.render(
                  React.createElement(ImageNodeRenderer, {
                    nodeData: d,
                    nodeWidth: currentHeaderWidth - 20,
                    currentWid: currentWid,
                    widModeShared: widModeShared,
                    onHeightChange: updatePlaceholderHeight,
                  })
                );
              }

              return; // Exit function without creating bodyText
            }
          }

          // Standard handling for other types
          const bodyRects = nodeBody
            .append('path')
            .attr('d', (d) => {
              const height = 0;
              return `M0,0 
                      H${nodeWidth} 
                      V${height - cornerRadius} 
                      Q${nodeWidth},${height} ${nodeWidth - cornerRadius},${height} 
                      H${cornerRadius} 
                      Q0,${height} 0,${height - cornerRadius} 
                      Z`;
            })
            .attr('fill', 'var(--node-body-color)');
          const bodyText = nodeBody
            .append('text')
            .attr('x', 10)
            .attr('y', 20)
            .attr('font-size', '14px')
            .attr('fill', 'white');

          bodyText.each(function (d, i) {
            const width = nodeWidth - 20;

            const countdown = d.type === 'typeB' ? getEventCountdown(d) : null;
            const content = countdown || d.description || null;

            if (!content) {
              nodeBody.remove();
              return;
            }

            const height = wrapText(d3.select(this), content, width);

            bodyRects
              .filter((_, j) => i === j)
              .attr('d', (d) => {
                const adjustedHeight = height + 8;
                return `M0,0 
                        H${nodeWidth} 
                        V${adjustedHeight} 
                        Q${nodeWidth},${adjustedHeight + cornerRadius} ${nodeWidth - cornerRadius},${adjustedHeight + cornerRadius} 
                        H${cornerRadius} 
                        Q0,${adjustedHeight + cornerRadius} 0,${adjustedHeight} 
                        Z`;
              });

            if (d.type === 'typeB') {
              const textElement = d3.select(this);
              setInterval(() => {
                const updatedCountdown = getEventCountdown(d);
                const updatedContent = updatedCountdown || d.description || null;

                if (!updatedContent) {
                  nodeBody.remove();
                  return;
                }

                textElement.text(updatedContent);
                wrapText(textElement, updatedContent, width);
              }, 1000);
            }
            if (d.type === 'typeG') {
              const textElement = d3.select(this);
              const currentData = d3.select(this).datum();

              const preciseAdd = (a, b) => {
                const aDecimals = (a.toString().split('.')[1] || '').length;
                const bDecimals = (b.toString().split('.')[1] || '').length;
                const multiplier = Math.pow(10, Math.max(aDecimals, bDecimals));
                return (Math.round(a * multiplier) + Math.round(b * multiplier)) / multiplier;
              };

              let manualBalance = 0;
              if (currentData.content && Array.isArray(currentData.content)) {
                manualBalance = currentData.content.reduce((acc, tx) => {
                  if (tx.transfer_status === 'paid') {
                    const amount = parseFloat(tx.transfer_amount) || 0;
                    return tx.transfer_type === 'income'
                      ? preciseAdd(acc, amount)
                      : preciseAdd(acc, -amount);
                  }
                  return acc;
                }, 0);
              }

              const financeId = currentData.id;
              const connectedTargetIds = []
                .filter((link) => link.source === financeId)
                .map((link) => link.target);

              const connectedOrdersNodes = (nodes || []).filter(
                (node) => connectedTargetIds.includes(node.id) && node.type === 'typeF'
              );

              const ordersBalance = connectedOrdersNodes.reduce((acc, node) => {
                if (node.content && Array.isArray(node.content)) {
                  const deliveredOrders = node.content.filter(
                    (order) => order.order_status === 'Delivered'
                  );
                  const nodeBalance = deliveredOrders.reduce((acc2, order) => {
                    const orderValue =
                      preciseAdd(parseFloat(order.order_total) || 0, 0) *
                      (parseFloat(order.order_amount) || 0);
                    return preciseAdd(
                      acc2,
                      order.order_direction === 'incoming' ? -orderValue : orderValue
                    );
                  }, 0);
                  return preciseAdd(acc, nodeBalance);
                }
                return acc;
              }, 0);

              const totalBalance = preciseAdd(manualBalance, ordersBalance);
              const formattedBalance = formatNumberWithSpaces(Number(totalBalance).toFixed(2));
              const content = `${formattedBalance} ${currentData.currency || 'USD'}`;
              textElement.text(content);
              wrapText(textElement, content, width);
            }
            if (d.type === 'typeK') {
              const textElement = d3.select(this);
              const currentData = d3.select(this).datum();
              const items = currentData.content.timeline.items;
              const lastCompletedIndex = items.findIndex((item) => !item.completed);
              const lastCompletedItem = items[lastCompletedIndex];
              if (lastCompletedIndex !== -1) {
                const content = lastCompletedItem.title;
                textElement.text(content);
                const height = wrapText(textElement, content, width);

                // Update body shape with new height
                bodyRects
                  .filter((_, j) => i === j)
                  .attr('d', (d) => {
                    const adjustedHeight = height + 8;
                    return `M0,0 
                            H${nodeWidth} 
                            V${adjustedHeight} 
                            Q${nodeWidth},${adjustedHeight + cornerRadius} ${nodeWidth - cornerRadius},${adjustedHeight + cornerRadius} 
                            H${cornerRadius} 
                            Q0,${adjustedHeight + cornerRadius} 0,${adjustedHeight} 
                            Z`;
                  });
              } else {
                nodeBody.remove();
                headerRects
                  .filter((_, j) => i === j)
                  .attr('d', (d) => {
                    const blockWidth = typeWidths[d.type] || 200;
                    return `M${cornerRadius},0 
                            H${blockWidth - cornerRadius} 
                            Q${blockWidth},0 ${blockWidth},${cornerRadius} 
                            V${height + 11 - cornerRadius} 
                            Q${blockWidth},${height + 11} ${blockWidth - cornerRadius},${height + 11} 
                            H${cornerRadius} 
                            Q0,${height + 11} 0,${height + 11 - cornerRadius} 
                            V${cornerRadius} 
                            Q0,0 ${cornerRadius},0 
                            Z`;
                  });
              }
            }
          });
        }
      });

      // Add touch handlers for mobile tap support
      // Track touch start positions per node to detect taps vs drags
      const touchStartData = new Map();
      const nodeDragOccurred = new Map(); // Track if drag occurred for each node
      const tapTimers = new Map(); // Timers for delayed tap handling
      
      // Handle tap on nodes
      const handleNodeTap = function(d) {
        const touchStart = touchStartData.get(d.id);
        if (!touchStart) return false;
        
        const timePassed = Date.now() - touchStart.time;
        
        // Check if node position changed (indicating drag occurred)
        const nodeMoved = Math.abs(d.x - touchStart.initialX) > 1 || Math.abs(d.y - touchStart.initialY) > 1;
        const dragHappened = nodeDragOccurred.get(d.id) || nodeMoved;
        
        // Only handle as tap if no drag occurred and reasonable time passed
        if (!dragHappened && timePassed < 500) {
          // Trigger the same logic as dragended for tap
          if (modeRef.current === 'delete') {
            setNodeToDelete(d);
            setIsDeleteModalOpen(true);
          } else if (modeRef.current === 'select' || modeRef.current === 'create') {
            const uniqueId = Math.random().toString(36).substr(2, 9);
            const uniqueType = `${d.id}_${uniqueId}`;
            setNodeModal(uniqueType);
          } else if (modeRef.current === 'selectMove') {
            const nodeElement = touchStart.nodeElement;
            const current = d3.select(nodeElement);
            current.classed('selected', !current.classed('selected'));
            const selectedNodeIds = d3
              .selectAll('.node.selected')
              .data()
              .map((node) => node.id);
            setSelectedNodes(selectedNodeIds);
          }
          
          touchStartData.delete(d.id);
          nodeDragOccurred.delete(d.id);
          if (tapTimers.has(d.id)) {
            clearTimeout(tapTimers.get(d.id));
            tapTimers.delete(d.id);
          }
          return true;
        }
        
        return false;
      };
      
      // Apply touch handlers to all nodes (both new and existing)
      // Use capture phase to handle events before D3 drag intercepts them
      svg.selectAll('.node').each(function(d) {
        const nodeElement = this;
        
        // Add event listeners with capture phase
        nodeElement.addEventListener('touchstart', function(event) {
          // Clear any existing timer
          if (tapTimers.has(d.id)) {
            clearTimeout(tapTimers.get(d.id));
            tapTimers.delete(d.id);
          }
          
          const touch = event.touches[0];
          if (touch) {
            // Store initial node position to detect if it moved
            const initialX = d.x;
            const initialY = d.y;
            
            touchStartData.set(d.id, {
              x: touch.clientX,
              y: touch.clientY,
              time: Date.now(),
              nodeElement: nodeElement,
              initialX: initialX,
              initialY: initialY
            });
            nodeDragOccurred.set(d.id, false);
            
            // Set a timer to handle tap if drag doesn't start
            // This ensures tap is handled even if touchend is prevented by drag
            const timer = setTimeout(() => {
              if (touchStartData.has(d.id) && !nodeDragOccurred.get(d.id)) {
                handleNodeTap(d);
              }
              tapTimers.delete(d.id);
            }, 300); // Wait 300ms to see if drag starts
            
            tapTimers.set(d.id, timer);
          }
        }, { capture: true, passive: true });
      });

      svg.selectAll('.node').each(function(d) {
        const nodeElement = this;
        
        nodeElement.addEventListener('touchend', function(event) {
          // Clear the timer since touchend fired
          if (tapTimers.has(d.id)) {
            clearTimeout(tapTimers.get(d.id));
            tapTimers.delete(d.id);
          }
          
          const touchStart = touchStartData.get(d.id);
          if (!touchStart) return;
          
          const touch = event.changedTouches[0];
          if (!touch) {
            touchStartData.delete(d.id);
            nodeDragOccurred.delete(d.id);
            return;
          }

          const timePassed = Date.now() - touchStart.time;
          const dx = Math.abs(touch.clientX - touchStart.x);
          const dy = Math.abs(touch.clientY - touchStart.y);
          const hasMoved = dx > 10 || dy > 10;
          
          // Check if node position changed (indicating drag occurred)
          const nodeMoved = Math.abs(d.x - touchStart.initialX) > 1 || Math.abs(d.y - touchStart.initialY) > 1;
          const dragHappened = nodeDragOccurred.get(d.id) || nodeMoved;
          
          // Only handle as tap if no significant movement, short duration, and no drag occurred
          if (!hasMoved && !dragHappened && timePassed < 400) {
            event.preventDefault();
            event.stopPropagation();
            handleNodeTap(d);
          } else {
            touchStartData.delete(d.id);
            nodeDragOccurred.delete(d.id);
          }
        }, { capture: true });
        
        nodeElement.addEventListener('touchcancel', function(event) {
          if (tapTimers.has(d.id)) {
            clearTimeout(tapTimers.get(d.id));
            tapTimers.delete(d.id);
          }
          touchStartData.delete(d.id);
          nodeDragOccurred.delete(d.id);
        }, { capture: true });
      });

      let clickTime = null;
      let isDragging = false;
      let isGroupDragging = false; // flag for group dragging in selectMove
      let dragStartPos = null; // initial position to determine real drag

      function dragstarted(event, d) {
        // Cancel tap timer if drag started
        if (tapTimers.has(d.id)) {
          clearTimeout(tapTimers.get(d.id));
          tapTimers.delete(d.id);
        }
        
        clickTime = Date.now();
        isDragging = false;
        isGroupDragging = false;
        // Save initial position to determine real movement
        const src = event.sourceEvent || event;
        dragStartPos = {
          x: src?.touches?.[0]?.clientX ?? src?.clientX ?? 0,
          y: src?.touches?.[0]?.clientY ?? src?.clientY ?? 0,
        };
        if (modeRef.current === 'selectMove') {
          const currentElement = d3.select(this);
          if (currentElement.classed('selected')) {
            const src = event.sourceEvent || event;
            const clientX = src?.touches?.[0]?.clientX ?? src?.clientX ?? 0;
            const clientY = src?.touches?.[0]?.clientY ?? src?.clientY ?? 0;
            const rect = document.querySelector('#workspace-container')?.getBoundingClientRect();
            const mainGraph = document.querySelector('#main_graph');
            const tAttr = mainGraph?.getAttribute('transform') || graphTransform;
            const { x, y, k } = parseTransformString(tAttr);
            const graphX = (clientX - (rect?.left || 0) - (x || 0)) / (k || 1);
            const graphY = (clientY - (rect?.top || 0) - (y || 0)) / (k || 1);
            selectMoveLastPointerRef.current = { x: graphX, y: graphY };
          } else {
            selectMoveLastPointerRef.current = null;
          }
        }
      }

      // --- Optimized drag functions ---
      function dragged(event, d) {
        // Mark that drag occurred for this node (for touch event handling)
        nodeDragOccurred.set(d.id, true);
        
        if (modeRef.current === 'selectMove') {
          const currentElement = d3.select(this);
          if (currentElement.classed('selected')) {
            isGroupDragging = true;
            // Calculate offset based on screen coordinates converted to graph coordinates
            const src = event.sourceEvent || event;
            const clientX = src?.touches?.[0]?.clientX ?? src?.clientX ?? 0;
            const clientY = src?.touches?.[0]?.clientY ?? src?.clientY ?? 0;
            const rect = document.querySelector('#workspace-container')?.getBoundingClientRect();
            const mainGraph = document.querySelector('#main_graph');
            const tAttr = mainGraph?.getAttribute('transform') || graphTransform;
            const { x, y, k } = parseTransformString(tAttr);
            const graphX = (clientX - (rect?.left || 0) - (x || 0)) / (k || 1);
            const graphY = (clientY - (rect?.top || 0) - (y || 0)) / (k || 1);
            const last = selectMoveLastPointerRef.current || { x: graphX, y: graphY };
            const dx = graphX - last.x;
            const dy = graphY - last.y;
            const updatedNodes = [...nodes];
            d3.selectAll('.node.selected').each(function (selectedData) {
              selectedData.x += dx;
              selectedData.y += dy;
              d3.select(this).attr('transform', `translate(${selectedData.x}, ${selectedData.y})`);
              const nodeIndex = updatedNodes.findIndex((n) => n.id === selectedData.id);
              if (nodeIndex !== -1) {
                updatedNodes[nodeIndex] = { ...selectedData };
              }
            });
            selectMoveLastPointerRef.current = { x: graphX, y: graphY };
            // --- Update links for all selected nodes ---
            const selectedNodeIds = d3
              .selectAll('.node.selected')
              .data()
              .map((node) => node.id);
            if (!dragRAFRef.current) {
              dragRAFRef.current = requestAnimationFrame(() => {
                selectedNodeIds.forEach((id) => updateLinksForNode(id));
                dragRAFRef.current = null;
              });
            }
            // Draft notification called only when dragging ends
            // DON'T call setNodes here!
          }
        } else {
          // Check if there was real movement (more than 5 pixels)
          const src = event.sourceEvent || event;
          const currentX = src?.touches?.[0]?.clientX ?? src?.clientX ?? 0;
          const currentY = src?.touches?.[0]?.clientY ?? src?.clientY ?? 0;
          if (dragStartPos) {
            const dx = Math.abs(currentX - dragStartPos.x);
            const dy = Math.abs(currentY - dragStartPos.y);
            if (dx > 5 || dy > 5) {
              isDragging = true;
            }
          }
          d.x = event.x;
          d.y = event.y;
          d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
          dragNodeRef.current = d;
          if (!dragRAFRef.current) {
            dragRAFRef.current = requestAnimationFrame(() => {
              updateLinksForNode(d.id);
              dragRAFRef.current = null;
            });
          }
          // Draft notification called only when dragging ends
          // DON'T call setNodes here!
        }
      }
      function dragended(event, d) {
        // Cancel tap timer if drag ended
        if (tapTimers.has(d.id)) {
          clearTimeout(tapTimers.get(d.id));
          tapTimers.delete(d.id);
        }
        
        // Check if there was actual movement (more than 5 pixels) or time passed
        const src = event.sourceEvent || event;
        const currentX = src?.touches?.[0]?.clientX ?? src?.changedTouches?.[0]?.clientX ?? src?.clientX ?? 0;
        const currentY = src?.touches?.[0]?.clientY ?? src?.changedTouches?.[0]?.clientY ?? src?.clientY ?? 0;
        const timePassed = Date.now() - (clickTime || Date.now());
        
        // For touch events, use longer time threshold
        const isTouch = src?.type?.startsWith('touch') || event.type?.startsWith('touch');
        const timeThreshold = isTouch ? 400 : 200;
        
        // Use different thresholds for touch vs mouse
        const moveThreshold = isTouch ? 10 : 5;
        const hasMoved =
          dragStartPos &&
          (Math.abs(currentX - dragStartPos.x) > moveThreshold || Math.abs(currentY - dragStartPos.y) > moveThreshold);
        
        // For touch events, also check if node position changed (indicating drag occurred)
        // For mouse events, rely on hasMoved and isDragging flags
        const touchStart = touchStartData.get(d.id);
        let dragHappened = false;
        if (isTouch && touchStart) {
          const nodeMoved = Math.abs(d.x - touchStart.initialX) > 1 || Math.abs(d.y - touchStart.initialY) > 1;
          dragHappened = nodeDragOccurred.get(d.id) || nodeMoved;
        }

        if (!isDragging && !isGroupDragging && !hasMoved && !dragHappened && timePassed < timeThreshold) {
          if (modeRef.current === 'delete') {
            setNodeToDelete(d);
            setIsDeleteModalOpen(true);
          } else if (modeRef.current === 'select' || modeRef.current === 'create') {
            const uniqueId = Math.random().toString(36).substr(2, 9);
            const uniqueType = `${d.id}_${uniqueId}`;
            setNodeModal(uniqueType);
          } else if (modeRef.current === 'selectMove') {
            const current = d3.select(this);
            current.classed('selected', !current.classed('selected'));
            const selectedNodeIds = d3
              .selectAll('.node.selected')
              .data()
              .map((node) => node.id);
            setSelectedNodes(selectedNodeIds);
          }
          
          // Clean up touch data
          touchStartData.delete(d.id);
          nodeDragOccurred.delete(d.id);
        }
        if (isDragging) {
          const updatedNodes = nodes.map((node) =>
            node.id === d.id ? { ...node, x: d.x, y: d.y } : node
          );
          // Update ref immediately for correct draft snapshot
          try {
            updateNodesRefOnly && updateNodesRefOnly(updatedNodes);
          } catch {}
          updateNodes(updatedNodes);
          try {
            onWorkspaceChange && onWorkspaceChange();
          } catch {}
        }
        if (modeRef.current === 'selectMove') {
          if (isGroupDragging) {
            // Commit coordinates of all selected nodes to state to avoid rollbacks on mode change
            const positions = new Map();
            d3.selectAll('.node.selected').each(function (nd) {
              positions.set(nd.id, { x: nd.x, y: nd.y });
            });
            const newNodes = nodes.map((n) =>
              positions.has(n.id) ? { ...n, ...positions.get(n.id) } : n
            );
            try {
              updateNodesRefOnly && updateNodesRefOnly(newNodes);
            } catch {}
            updateNodes(newNodes);
            try {
              onWorkspaceChange && onWorkspaceChange();
            } catch {}
          }
          d3.selectAll('.node.selected').each(function () {
            d3.select(this).classed('dragging', false);
          });
        }
        selectMoveLastPointerRef.current = null;
        isGroupDragging = false;
        isDragging = false;
        dragStartPos = null;
      }

      function updateLinks() {
        linkElements.attr('d', (d) => {
          const sourceNode = nodes.find((node) => node.id === d.source);
          const targetNode = nodes.find((node) => node.id === d.target);

          // Update output circles
          outputCircles
            .attr('cx', (d) => d.x + (d._nodeWidth || typeWidths[d.type] || 200))
            .attr('cy', (d) => d.y + 15);

          // Update input circles
          inputCircles.attr('cx', (d) => d.x).attr('cy', (d) => d.y + 15);

          if (sourceNode && targetNode) {
            // Determine if node is synapse
            const isSourceSynapse = sourceNode.type === 'typeL';
            const isTargetSynapse = targetNode.type === 'typeL';

            // Calculate coordinates for line start and end
            let sourceX, sourceY, targetX, targetY;

            if (isSourceSynapse) {
              // For synapse take circle center
              sourceX = sourceNode.x + SYNAPSE_RADIUS;
              sourceY = sourceNode.y + SYNAPSE_RADIUS + SYNAPSE_Y_OFFSET;
            } else {
              // For regular node use right side
              sourceX =
                sourceNode.x + (sourceNode._nodeWidth || typeWidths[sourceNode.type] || 200);
              sourceY = sourceNode.y + 15;
            }

            if (isTargetSynapse) {
              // For synapse take circle center
              targetX = targetNode.x + SYNAPSE_RADIUS;
              targetY = targetNode.y + SYNAPSE_RADIUS + SYNAPSE_Y_OFFSET;
            } else {
              // For regular node use left side
              targetX = targetNode.x;
              targetY = targetNode.y + 15;
            }

            // Determine control points for curve
            let points;
            if (isSourceSynapse && isTargetSynapse) {
              // If both nodes are synapses, draw straight line
              points = [
                { x: sourceX, y: sourceY },
                { x: targetX, y: targetY },
              ];
            } else {
              // For mixed connections use curve
              const offset = 30; // Offset for curve
              points = [
                { x: sourceX, y: sourceY },
                { x: sourceX + (isSourceSynapse ? 0 : offset), y: sourceY },
                { x: targetX - (isTargetSynapse ? 0 : offset), y: targetY },
                { x: targetX, y: targetY },
              ];
            }

            return lineGenerator(points);
          }
          return '';
        });
      }

      function wrapText(textElement, text, width) {
        // Clear all previous tspan elements and main text
        textElement.selectAll('tspan').remove();
        textElement.text('');

        const words = text.split(/\s+/);
        let lines = [];
        let currentLine = [];

        words.forEach((word) => {
          currentLine.push(word);
          const testText = currentLine.join(' ');

          // Create temporary tspan to measure width
          const tempTspan = textElement.append('tspan').attr('x', 10).attr('y', 20).text(testText);

          if (tempTspan.node().getComputedTextLength() > width) {
            // Remove last word and save current line
            currentLine.pop();
            if (currentLine.length > 0) {
              lines.push(currentLine.join(' '));
            }
            currentLine = [word];
          }

          // Remove temporary tspan
          tempTspan.remove();
        });

        // Add last line
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }

        // Create tspan elements for each line
        lines.forEach((line, index) => {
          textElement
            .append('tspan')
            .attr('x', 10)
            .attr('y', 20 + index * 20)
            .text(line);
        });

        return lines.length * 20;
      }

      updateLinks();
      setNeedsUpdate(false);
    }
  }, [nodes, setNodes, links, mode, needsUpdate, graphTransform, modeRef]);

  useEffect(() => {
    if (mode !== 'selectMove') {
      d3.selectAll('.node.selected').classed('selected', false);
    }
  }, [mode]);

  useEffect(() => {
    const svgContainer = d3.select('#workspace-container').select('svg');
    const svg = svgContainer.select('g'); // This is group for all nodes and graphics
    const mainSvg = svgContainer.node(); // The SVG container itself

    if (svg.empty()) return; // If SVG not found, exit

    const height = mainSvg ? mainSvg.getBoundingClientRect().height : window.innerHeight;

    let isDraggingLine = false; // Flag for drawing line
    let tempLine = null; // Temporary line
    let startNodeId = null; // ID of starting node
    let zoomTransform = d3.zoomIdentity; // Initial transformation (no scale and offset)

    // Define zoom
    const zoom = d3
      .zoom()
      .scaleExtent([0.01, 4.0]) // Same scale limits
      .on('zoom', (event) => {
        const newScale = Math.min(Math.max(event.transform.k, 0.01), 4.0);
        const transform = d3.zoomIdentity
          .translate(event.transform.x, event.transform.y)
          .scale(newScale);

        setGraphTransform(transform.toString());
        zoomTransform = event.transform; // Save current transformation state
        svg.attr('transform', transform); // Apply transformation to group
      });

    // Apply zoom if not already set
    svgContainer.call(zoom);

    // Function to extract translate and scale parameters from transform string
    const extractTransformParams = (transformString) => {
      if (!transformString) return { translateX: 0, translateY: 0, scale: 1 }; // Return default values

      const translateRegex = /translate\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/;
      const scaleRegex = /scale\((-?\d+\.?\d*)\)/;

      const translateMatch = transformString.match(translateRegex);
      const scaleMatch = transformString.match(scaleRegex);

      const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
      const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
      const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

      return { translateX, translateY, scale };
    };

    if (mode === 'create') {
      svg.selectAll('circle').style('opacity', 1);
      // Allow interaction only with output circles in create mode
      svg.selectAll('.output-circle').style('pointer-events', 'auto');

      // Disable zooming and panning for the group
      svgContainer.on('.zoom', null);

      // Handler for starting line drawing
      svg
        .selectAll('.output-circle')
        .on('mousedown', (event, d) => {
          isDraggingLine = true;
          startNodeId = d.id;
          // Get width for current element type (dynamic)
          const blockWidth = d._nodeWidth || typeWidths[d.type] || 220;

          // Line start is the center of output circle
          const startX = d.x + blockWidth;
          const startY = d.y + 15;

          const transformString = svg.attr('transform');
          const { translateX, translateY, scale } = extractTransformParams(transformString);

          const transformedStartX =
            scale === null || scale === 1 ? startX + translateX : startX * scale + translateX;

          const transformedStartY =
            scale === null || scale === 1 ? startY + translateY : startY * scale + translateY;

          tempLine = svgContainer
            .append('line')
            .attr('class', 'temporary-line')
            .attr('x1', transformedStartX)
            .attr('y1', transformedStartY)
            .attr('x2', transformedStartX)
            .attr('y2', transformedStartY)
            .attr('stroke', '#2383ed')
            .attr('stroke-dasharray', '5,5')
            .attr('stroke-width', 2)
            .style('pointer-events', 'none');
        })
        .on('touchstart', (event, d) => {
          isDraggingLine = true;
          startNodeId = d.id;
          // Get width for current element type (dynamic)
          const blockWidth = d._nodeWidth || typeWidths[d.type] || 220;

          // Line start is the center of output circle
          const startX = d.x + blockWidth;
          const startY = d.y + 15;

          const transformString = svg.attr('transform');
          const { translateX, translateY, scale } = extractTransformParams(transformString);

          const transformedStartX =
            scale === null || scale === 1 ? startX + translateX : startX * scale + translateX;

          const transformedStartY =
            scale === null || scale === 1 ? startY + translateY : startY * scale + translateY;

          tempLine = svgContainer
            .append('line')
            .attr('class', 'temporary-line')
            .attr('x1', transformedStartX)
            .attr('y1', transformedStartY)
            .attr('x2', transformedStartX)
            .attr('y2', transformedStartY)
            .attr('stroke', '#2383ed')
            .attr('stroke-dasharray', '5,5')
            .attr('stroke-width', 2)
            .style('pointer-events', 'none');

          // Prevent default behavior for touch events
          if (event.type === 'touchstart') {
            event.preventDefault();
          }
        });

      // Temporary line movement following cursor/finger
      svgContainer.on('mousemove touchmove', (event) => {
        if (isDraggingLine && tempLine) {
          // Get mouse/finger coordinates
          const [mouseX, mouseY] =
            event.type === 'touchmove'
              ? d3.pointer(event.touches[0], event.currentTarget)
              : d3.pointer(event);

          const transformString = svg.attr('transform');
          const { translateX, translateY, scale } = extractTransformParams(transformString);

          const transformedMouseX = mouseX;
          const transformedMouseY = mouseY;

          tempLine.attr('x2', transformedMouseX).attr('y2', transformedMouseY);

          // Предотвращаем стандартное поведение для touch-событий
          if (event.type === 'touchmove') {
            event.preventDefault();
          }
        }
      });

      // Завершение рисования линии при отпускании мыши/пальца
      svgContainer.on('mouseup touchend', (event) => {
        if (isDraggingLine) {
          isDraggingLine = false;

          const mainSvg = svgContainer.node();
          if (!mainSvg) {
            showNotification('Something went wrong. Please refresh the page.', 'error', 5000);
            return;
          }

          // Получаем координаты события
          const point = mainSvg.createSVGPoint();
          if (event.type === 'touchend') {
            const touch = event.changedTouches[0];
            point.x = touch.clientX;
            point.y = touch.clientY;
          } else {
            point.x = event.clientX;
            point.y = event.clientY;
          }

          const svgPoint = point.matrixTransform(mainSvg.getScreenCTM().inverse());

          const targetNode = svg
            .selectAll('.node')
            .filter(function (d) {
              const localPoint = point.matrixTransform(this.getScreenCTM().inverse());
              const bbox = this.getBBox();
              return (
                localPoint.x >= 0 &&
                localPoint.x <= bbox.width &&
                localPoint.y >= 0 &&
                localPoint.y <= bbox.height
              );
            })
            .data()[0];

          if (targetNode) {
            if (startNodeId !== targetNode.id) {
              const currentLinks = Array.isArray(links) ? links : [];
              const linkExists = currentLinks.some(
                (link) =>
                  (link.source === startNodeId && link.target === targetNode.id) ||
                  (link.source === targetNode.id && link.target === startNodeId)
              );

              if (!linkExists) {
                const updatedLinks = [
                  ...currentLinks,
                  { source: startNodeId, target: targetNode.id },
                ];
                setLinks(updatedLinks);
                setNeedsUpdate(true);
              }
            }
          }

          if (tempLine) {
            tempLine.remove();
            tempLine = null;
          }
        }
      });

      // Handle drag cancellation when leaving the area
      svgContainer.on('mouseleave touchcancel', () => {
        if (isDraggingLine) {
          isDraggingLine = false;
          if (tempLine) {
            tempLine.remove();
            tempLine = null;
          }
        }
      });
    } else if (mode === 'selectMove') {
      // Block pan/zoom, prepare rectangular selection
      svg.selectAll('circle').style('opacity', 0);
      svg.selectAll('.output-circle').style('pointer-events', 'none');
      svgContainer.on('.zoom', null);

      let isSelecting = false;
      let selectionStart = { x: 0, y: 0 };
      let selectionRect = null;

      const startSelection = (event) => {
        // Start selection only when clicking/touching empty space, not a node
        if (event?.target && event.target.closest && event.target.closest('.node')) {
          return;
        }
        isSelecting = true;
        const containerNode = svgContainer.node();
        const [x, y] = event.type?.startsWith('touch')
          ? d3.pointer(event.touches[0], containerNode)
          : d3.pointer(event, containerNode);
        selectionStart = { x, y };
        if (selectionRect) selectionRect.remove();
        selectionRect = svgContainer
          .append('rect')
          .attr('class', 'selection-rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', 0)
          .attr('height', 0)
          .attr('fill', 'rgba(35,131,237,0.15)')
          .attr('stroke', '#2383ed')
          .attr('stroke-dasharray', '4,3')
          .attr('stroke-width', 1)
          .style('pointer-events', 'none');
        if (event.type?.startsWith('touch')) event.preventDefault();
      };

      const moveSelection = (event) => {
        if (!isSelecting || !selectionRect) return;
        const containerNode = svgContainer.node();
        const [x, y] = event.type?.startsWith('touch')
          ? d3.pointer(event.touches[0], containerNode)
          : d3.pointer(event, containerNode);
        const x0 = Math.min(selectionStart.x, x);
        const y0 = Math.min(selectionStart.y, y);
        const w = Math.abs(x - selectionStart.x);
        const h = Math.abs(y - selectionStart.y);
        selectionRect.attr('x', x0).attr('y', y0).attr('width', w).attr('height', h);
        if (event.type?.startsWith('touch')) event.preventDefault();
      };

      const endSelection = (event) => {
        if (!isSelecting) return;
        isSelecting = false;
        const rectNode = selectionRect && selectionRect.node();
        if (!rectNode) return cleanupSelection();

        const rect = {
          x: parseFloat(selectionRect.attr('x')),
          y: parseFloat(selectionRect.attr('y')),
          width: parseFloat(selectionRect.attr('width')),
          height: parseFloat(selectionRect.attr('height')),
        };
        // Protection against click without real area (stay in selection mode)
        if (!isFinite(rect.x) || !isFinite(rect.y) || rect.width < 2 || rect.height < 2) {
          cleanupSelection();
          return;
        }
        // Compare in screen coordinates for reliability (accounting for all SVG transformations)
        const containerRect = svgContainer.node().getBoundingClientRect();
        const selLeft = containerRect.left + rect.x;
        const selTop = containerRect.top + rect.y;
        const selRight = selLeft + rect.width;
        const selBottom = selTop + rect.height;

        const intersectsScreen = (a, b) =>
          !(a.left > b.right || a.right < b.left || a.top > b.bottom || a.bottom < b.top);

        const selectionScreenRect = {
          left: selLeft,
          top: selTop,
          right: selRight,
          bottom: selBottom,
        };
        const newlySelectedIds = [];
        svg.selectAll('.node').each(function (d) {
          const r = this.getBoundingClientRect();
          if (!r || !isFinite(r.left) || !isFinite(r.top)) return;
          const nodeRect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
          const inside = intersectsScreen(selectionScreenRect, nodeRect);
          d3.select(this).classed('selected', inside);
          if (inside) newlySelectedIds.push(d.id);
        });

        if (newlySelectedIds.length > 0) {
          setSelectedNodes(newlySelectedIds);
          cleanupSelection();
          setShowSelectMoveHint(false);
          // Enable pan/zoom and remove frame handlers until next activation
          svgContainer.call(zoom);
          detach();
        } else {
          // Nothing selected — continue selection step
          setSelectedNodes([]);
          cleanupSelection();
          setShowSelectMoveHint(true);
        }
      };

      const cleanupSelection = () => {
        if (selectionRect) {
          selectionRect.remove();
          selectionRect = null;
        }
      };

      svgContainer
        .on('mousedown', startSelection)
        .on('touchstart', startSelection)
        .on('mousemove', moveSelection)
        .on('touchmove', moveSelection)
        .on('mouseup', endSelection)
        .on('touchend', endSelection)
        .on('mouseleave', endSelection)
        .on('touchcancel', endSelection);

      // Cleanup on mode change/unmount
      const detach = () => {
        cleanupSelection();
        svgContainer
          .on('mousedown', null)
          .on('touchstart', null)
          .on('mousemove', null)
          .on('touchmove', null)
          .on('mouseup', null)
          .on('touchend', null)
          .on('mouseleave', null)
          .on('touchcancel', null);
      };

      // Return detach function to general cleanup below via closure
      // Use return at end of effect, so just add to general cleanup
      // via array of functions
      // Save in closure
      // eslint-disable-next-line no-unused-vars
      var __cleanupSelectMove = detach;
    } else {
      svg.selectAll('circle').style('opacity', 0);
      // Completely disable interaction with output circles
      svg
        .selectAll('.output-circle')
        .style('pointer-events', 'none')
        .on('mousedown', null)
        .on('touchstart', null);
      // Restore zoom and panning
      svgContainer.call(zoom);

      // Remove event handlers set in create mode
      svg.selectAll('.output-circle').on('mousedown', null).on('touchstart', null);
      svgContainer.on('mousemove', null);
      svgContainer.on('mouseup', null);
    }

    return () => {
      // Cleanup handlers on component unmount
      svgContainer.on('mousemove', null);
      svgContainer.on('mouseup', null);
      // If selectMove was active, remove its handlers
      svgContainer
        .on('mousedown', null)
        .on('touchstart', null)
        .on('touchmove', null)
        .on('touchend', null)
        .on('mouseleave', null)
        .on('touchcancel', null);
    };
  }, [mode, setLinks, needsUpdate, setNeedsUpdate]);

  // Add new states for modal window
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);

  // Add functions to handle delete confirmation/cancellation
  const handleConfirmDelete = () => {
    if (nodeToDelete) {
      try {
        // 1. Remove node from nodes
        const updatedNodes = nodes.filter((node) => node.id !== nodeToDelete.id);
        updateNodes(updatedNodes);

        // 2. Remove all links associated with this node
        const currentLinks = Array.isArray(links) ? links : [];
        const updatedLinks = currentLinks.filter(
          (link) => link.source !== nodeToDelete.id && link.target !== nodeToDelete.id
        );
        setLinks(updatedLinks);

        deleteNodeAndLinks(nodeToDelete.id);
        // 3. Set update flag for graph re-rendering
        setNeedsUpdate(true);
        showNotification('Node deleted successfully', 'success', 3000);
      } catch (error) {
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Failed to delete node';
        showNotification(errorMessage, 'error', 5000);
      }
    }
    // Close modal window and clear nodeToDelete
    setIsDeleteModalOpen(false);
    setNodeToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setNodeToDelete(null);
  };

  // Add ref to track first load
  const isFirstLoadRef = useRef(true);
  // Hint for selectMove
  const [showSelectMoveHint, setShowSelectMoveHint] = useState(false);

  // Modify useEffect to apply transform
  useEffect(() => {
    if (savedTransform && !needsUpdate && isFirstLoadRef.current) {
      const svgContainer = d3.select('#workspace-container').select('svg');
      const svg = svgContainer.select('g#main_graph');

      if (!svg.empty()) {
        const parsedTransform = parseTransformString(savedTransform);
        svgContainer.call(d3.zoom().transform, parsedTransform);
        svg.attr('transform', savedTransform);
        setGraphTransform(savedTransform);
        // Set flag that first load has already occurred
        isFirstLoadRef.current = false;
      }
    }
  }, [savedTransform, needsUpdate]);

  // Manage hint when mode changes
  useEffect(() => {
    if (mode === 'selectMove') {
      setShowSelectMoveHint(true);
    } else {
      setShowSelectMoveHint(false);
    }
  }, [mode]);

  useEffect(() => {
    if (modeRef.current === 'selectMove') {
      const selectedNodeIds = d3
        .selectAll('.node.selected')
        .data()
        .map((node) => node.id);
      setSelectedNodes(selectedNodeIds);
    } else {
      setSelectedNodes([]);
    }
  }, [mode, setSelectedNodes]);

  const handleMassConfirmDelete = () => {
    if (selectedNodes && selectedNodes.length > 0) {
      try {
        // Save number of nodes to delete before clearing
        const nodesToDeleteCount = selectedNodes.length;

        // 1. Remove nodes from nodes
        const updatedNodes = nodes.filter((node) => !selectedNodes.includes(node.id));
        updateNodes(updatedNodes);

        // 2. Remove all links associated with these nodes
        const currentLinks = Array.isArray(links) ? links : [];
        const updatedLinks = currentLinks.filter(
          (link) =>
            !selectedNodes.includes(Number(link.source)) &&
            !selectedNodes.includes(Number(link.target))
        );
        setLinks(updatedLinks);

        // 3. Clear selected nodes
        setSelectedNodes([]);

        // 4. Set update flag for graph re-rendering
        setNeedsUpdate(true);
        showNotification(`${nodesToDeleteCount} nodes deleted successfully`, 'success', 3000);
      } catch (error) {
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Failed to delete nodes';
        showNotification(errorMessage, 'error', 5000);
      }
    }
    setIsMassDeleteModalOpen(false);
  };

  const handleMassCancelDelete = () => {
    setIsMassDeleteModalOpen(false);
  };

  return (
    <>
      <div
        id="workspace-container"
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'var(--color-background-primary)',
          touchAction: 'none',
        }}
      >
        {/* {mode === 'create' && (
          <>
            <div className="create-mode-border-top"></div>
            <div className="create-mode-border-right"></div>
            <div className="create-mode-border-bottom"></div>
            <div className="create-mode-border-left"></div>
          </>
        )} */}
        <style>
          {`
          body {
            margin: 0;
            overflow: hidden;
            touch-action: none;
          }
          * {
            user-select: none;
          }
          #main-svg {
            touch-action: none;
          }
          .node text {
            user-select: text; /* Allow text selection only in nodes */
          }
          .node {
            cursor: pointer;
          }
          .output-circle {
            cursor: move;
            transition: fill 0.2s;
            fill-opacity: var(--output-circle-opacity);
          }
          .synapse-circle {
            cursor: pointer;
            transition: fill 0.2s;
            opacity: 1 !important;
          }
          .node.selected .synapse-circle {
            fill: var(--main-color-primary) !important;
            fill-opacity: 1;
            stroke: var(--stroke-selected-node);
            stroke-width: 2px;
          }
          .output-circle:hover {
            fill: var(--color-output-circle-hover);
          }
          .temporary-line {
            stroke-dasharray: 5, 5; /* Dashed line */
            transition: stroke 0.2s;
            opacity: 0.6;
            stroke: #7aa2f7;
            stroke-width: 4;
          }
          #workspace-container {
            position: relative;
            z-index: 1;
          }
          /* Selection of entire node (header + body) without shadows/effects */
          .node.selected path {
            fill: var(--main-color-primary) !important;
            fill-opacity: 0.3;
            stroke: var(--stroke-selected-node);
            stroke-width: 1px;
          }
          .image-node-foreign {
            width: 100%;
            height: auto;
            overflow: visible;
            min-height: 100%;
          }
          .image-node-foreign * {
            user-select: none;
          }
          
          /* Mobile-specific fixes for foreignObject positioning */
          @media (max-width: 768px), (pointer: coarse) {
            .image-node-foreign {
              position: static !important;
              transform: none !important;
              transform-origin: 0 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              z-index: auto !important;
            }
            
            .image-node-foreign * {
              position: static !important;
              transform: none !important;
              transform-origin: 0 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            foreignObject {
              position: static !important;
              transform: none !important;
              transform-origin: 0 0 !important;
            }
          }
        `}
        </style>
      </div>

      {showSelectMoveHint && (
        <div className="topbar_role_notification">
          <span>
            Screen <strong>movement</strong> is locked. Drag to select nodes.
          </span>
        </div>
      )}

      {mode === 'selectMove' && (selectedNodes?.length || 0) > 0 && (
        <div
          className="topbar_role_notification"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '0 16px',
          }}
        >
          <span>Nodes selected.</span>
          <button
            onClick={() => onModeChange && onModeChange('select')}
            style={{
              background: 'var(--main-color-primary)',
              color: 'var(--color-node-title)',
              border: 'none',
              padding: '0 20px',
              height: '22px',
              margin: '6px',
              borderRadius: '8px',
              marginRight: '-10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Apply
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        message={`Are you sure you want to delete this node?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ConfirmationModal
        isOpen={isMassDeleteModalOpen}
        message={`Are you sure you want to delete ${selectedNodes?.length || 0} selected nodes?`}
        onConfirm={handleMassConfirmDelete}
        onCancel={handleMassCancelDelete}
      />
      {modeRef.current === 'create' && (
        <div className="topbar_role_notification">
          <span>
            Screen <strong>movement</strong> is locked
          </span>
        </div>
      )}
    </>
  );
};
