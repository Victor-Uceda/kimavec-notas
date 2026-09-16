import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X, Sparkles, Network } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { buildGraphData, type GraphNode } from './graphBuilder';
import { GraphGuideCard } from './GraphGuideCard';

interface GraphCanvasProps {
  onClose?: () => void;
}

const GUIDE_DISMISSED_KEY = 'has_dismissed_graph_guide';

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ onClose }) => {
  const { notes, activeNoteId, selectNote, setNav, cleanEmptyNotes } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados de vista y controles
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_DISMISSED_KEY) !== 'true';
    } catch {
      return false;
    }
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const handleCloseGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem(GUIDE_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleToggleGuide = () => {
    setShowGuide((prev) => {
      const next = !prev;
      if (!next) {
        try {
          localStorage.setItem(GUIDE_DISMISSED_KEY, 'true');
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  // Referencias para simulación física fluida sin mutar estado de React
  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Filtrar notas con contenido real para un grafo limpio (excluyendo papelera)
  const validNotes = useMemo(() => {
    return notes.filter((n) => {
      if (n.deletedAt) return false;
      const hasTitle = n.title.trim().length > 0;
      const hasContent = n.content.replace(/<[^>]+>/g, '').trim().length > 0;
      return hasTitle || hasContent || n.id === activeNoteId;
    });
  }, [notes, activeNoteId]);

  const emptyNotesCount = notes.length - validNotes.length;

  // Construir modelo del grafo con la función pura
  const { initialNodes, initialLinks } = useMemo(() => {
    return buildGraphData(validNotes, activeNoteId);
  }, [validNotes, activeNoteId]);

  const nodesRef = useRef<GraphNode[]>(initialNodes);
  const linksRef = useRef(initialLinks);

  useEffect(() => {
    nodesRef.current = initialNodes;
    linksRef.current = initialLinks;
  }, [initialNodes, initialLinks]);

  // Ajuste automático de resolución del canvas para evitar estiramiento horizontal
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);
      if (newWidth > 0 && newHeight > 0) {
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
        }
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(() => updateDimensions());
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  // Bucle de renderizado Canvas 2D
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseOffset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      pulseOffset = (pulseOffset + 0.015) % 1;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Fondo con cuadrícula de puntos orgánica
      const dotSpacing = 36;
      const startX = Math.floor((-pan.x / zoom) / dotSpacing) * dotSpacing - dotSpacing;
      const endX = Math.ceil((width / zoom - pan.x / zoom) / dotSpacing) * dotSpacing + dotSpacing;
      const startY = Math.floor((-pan.y / zoom) / dotSpacing) * dotSpacing - dotSpacing;
      const endY = Math.ceil((height / zoom - pan.y / zoom) / dotSpacing) * dotSpacing + dotSpacing;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
      for (let gx = startX; gx <= endX; gx += dotSpacing) {
        for (let gy = startY; gy <= endY; gy += dotSpacing) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const dragged = draggedNodeRef.current;

      // 1. Repulsión física entre nodos
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 210) {
            const force = ((210 - dist) / 210) * 0.08;
            nodes[i].x -= (dx / dist) * force * 12;
            nodes[i].y -= (dy / dist) * force * 12;
            nodes[j].x += (dx / dist) * force * 12;
            nodes[j].y += (dy / dist) * force * 12;
          }
        }
      }

      // 2. Atracción por sinapsis (resortes)
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 140) * 0.025;

          if (sourceNode !== dragged) {
            sourceNode.x += (dx / dist) * force;
            sourceNode.y += (dy / dist) * force;
          }
          if (targetNode !== dragged) {
            targetNode.x -= (dx / dist) * force;
            targetNode.y -= (dy / dist) * force;
          }
        }
      });

      // 3. Dibujar Sinapsis y pulsos luminosos
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (sourceNode && targetNode) {
          const grad = ctx.createLinearGradient(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
          grad.addColorStop(0, 'rgba(148, 163, 184, 0.25)');
          grad.addColorStop(0.5, 'rgba(148, 163, 184, 0.55)');
          grad.addColorStop(1, 'rgba(148, 163, 184, 0.25)');

          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Pulso animado a lo largo de la línea
          const pulseX = sourceNode.x + (targetNode.x - sourceNode.x) * pulseOffset;
          const pulseY = sourceNode.y + (targetNode.y - sourceNode.y) * pulseOffset;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(79, 70, 229, 0.6)';
          ctx.fill();
        }
      });

      // 4. Dibujar Nodos (Esferas neuronales)
      nodes.forEach((node) => {
        const isHovered = hoveredNodeId === node.id;
        const isActiveNote = node.noteId === activeNoteId;

        // Halo de resplandor activo / hover
        if (isActiveNote || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 7, 0, Math.PI * 2);
          ctx.fillStyle = isActiveNote ? 'rgba(0, 0, 0, 0.08)' : 'rgba(79, 70, 229, 0.1)';
          ctx.fill();
        }

        // Esfera principal
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        if (node.type === 'note') {
          const nodeGrad = ctx.createRadialGradient(
            node.x - node.radius * 0.3,
            node.y - node.radius * 0.3,
            node.radius * 0.1,
            node.x,
            node.y,
            node.radius
          );
          if (isActiveNote) {
            nodeGrad.addColorStop(0, '#2D3748');
            nodeGrad.addColorStop(1, '#0D0D0D');
          } else {
            nodeGrad.addColorStop(0, '#4A5568');
            nodeGrad.addColorStop(1, '#1A202C');
          }
          ctx.fillStyle = nodeGrad;
          ctx.fill();
          ctx.lineWidth = isActiveNote ? 2.5 : 1.5;
          ctx.strokeStyle = isActiveNote ? '#718096' : '#2D3748';
          ctx.stroke();
        } else if (node.type === 'tag') {
          ctx.fillStyle = '#059669';
          ctx.fill();
        } else {
          ctx.fillStyle = '#6366F1';
          ctx.fill();
        }

        // Etiqueta tipográfica limpia
        ctx.font = node.type === 'note' ? '600 12px Inter, sans-serif' : '500 11px Inter, sans-serif';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 14);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [pan, zoom, hoveredNodeId, activeNoteId]);

  // Localizar nodo bajo el cursor
  const getNodeAtPos = (clientX: number, clientY: number): GraphNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (Math.hypot(node.x - x, node.y - y) <= node.radius + 6) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const node = getNodeAtPos(e.clientX, e.clientY);
    if (node) {
      draggedNodeRef.current = node;
    } else {
      isDraggingCanvas.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = (e.clientX - rect.left - pan.x) / zoom;
      draggedNodeRef.current.y = (e.clientY - rect.top - pan.y) / zoom;
    } else if (isDraggingCanvas.current) {
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    } else {
      const node = getNodeAtPos(e.clientX, e.clientY);
      setHoveredNodeId(node?.id || null);
      canvas.style.cursor = node ? 'pointer' : 'grab';
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingCanvas.current = false;
  };

  // Zoom fluido con la rueda del ratón centrado en el cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.08;
    const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(prevZoom * delta, 0.3), 3.0);
      setPan((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * (nextZoom / prevZoom),
        y: mouseY - (mouseY - prevPan.y) * (nextZoom / prevZoom),
      }));
      return nextZoom;
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const node = getNodeAtPos(e.clientX, e.clientY);
    if (node?.noteId) {
      selectNote(node.noteId);
      setNav('home');
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-app-editor rounded-sheet shadow-sheet overflow-hidden border border-black/[0.03] relative select-none">
      {/* Barra Flotante Superior en Liquid Glass */}
      <div className="absolute left-6 right-6 top-5 z-20 liquid-glass rounded-2xl px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-app-active-pill flex items-center justify-center text-app-text-primary shadow-2xs">
            <Network className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-body font-bold text-app-text-primary">Red de Conocimiento</h3>
            <span className="text-badge px-2 py-0.5 rounded-full bg-black/5 text-app-text-secondary font-medium">
              {validNotes.length} {validNotes.length === 1 ? 'nota' : 'notas'} • {initialLinks.length} sinapsis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleGuide}
            className={`liquid-glass-pill px-3 py-1 rounded-xl flex items-center gap-1.5 text-task font-medium transition-all ${
              showGuide
                ? 'bg-black/8 text-app-text-primary shadow-xs'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-white/90'
            }`}
            title="Ver cómo formar sinapsis y conectar notas"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showGuide ? 'Ocultar Guía' : '¿Cómo conectar?'}</span>
          </button>

          {emptyNotesCount > 0 && (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`¿Eliminar las ${emptyNotesCount} notas vacías?`)) {
                  await cleanEmptyNotes();
                }
              }}
              className="liquid-glass-pill px-3 py-1 rounded-xl flex items-center gap-1.5 text-badge font-medium text-red-600 bg-red-50/70 border-red-200/60 hover:bg-red-100/80 transition-colors"
              title="Limpiar notas vacías"
            >
              <Sparkles className="w-3 h-3 text-red-500" />
              <span>Limpiar {emptyNotesCount} vacías</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="liquid-glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-app-text-secondary hover:text-app-text-primary hover:bg-white/90 transition-colors"
            title="Volver al editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tarjeta Flotante Liquid Glass */}
      {showGuide && <GraphGuideCard onClose={handleCloseGuide} />}

      {/* Controles de Zoom Flotantes */}
      <div className="absolute right-6 bottom-6 z-20 liquid-glass-pill rounded-2xl p-1 flex items-center gap-0.5 text-app-text-secondary">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          className="p-1.5 hover:text-app-text-primary hover:bg-black/5 rounded-xl transition-colors"
          title="Acercar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          className="p-1.5 hover:text-app-text-primary hover:bg-black/5 rounded-xl transition-colors"
          title="Alejar"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 hover:text-app-text-primary hover:bg-black/5 rounded-xl transition-colors"
          title="Restablecer vista"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lienzo Canvas Fluido */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full bg-[#FAFBFD] cursor-grab active:cursor-grabbing absolute inset-0"
      />
    </div>
  );
};
