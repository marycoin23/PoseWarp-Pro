
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pin, WarpSettings, Point, Layer } from './types';
import Toolbar from './components/Toolbar';
import ControlPanel from './components/ControlPanel';
import LayersPanel from './components/LayersPanel';
import { calculateDeformedPoint, generateMesh } from './services/warpEngine';
import { PhotoIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<Layer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [settings, setSettings] = useState<WarpSettings>({
    meshDensity: 1.0,
    pinInfluence: 8.0,
    showMesh: true,
    lockPins: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingPinId = useRef<string | null>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId) || null;
  const selectedPin = activeLayer?.pins.find(p => p.id === activeLayer.selectedPinId) || null;

  const calculateFitScale = useCallback((imgW: number, imgH: number): number => {
    if (!containerRef.current) return 1.0;
    const padding = 80; // Margin from edges
    const targetW = containerRef.current.clientWidth - padding;
    const targetH = containerRef.current.clientHeight - padding;
    const scale = Math.min(targetW / imgW, targetH / imgH, 1.0);
    return Math.max(0.1, scale);
  }, []);

  const handleAddImageLayer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Auto-calculate initial scale to fit the canvas
          const initialScale = calculateFitScale(img.width, img.height);
          
          const newLayer: Layer = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, ""),
            image: img,
            pins: [],
            selectedPinId: null,
            visible: true,
            opacity: 1.0,
            scale: initialScale
          };
          const newLayers = [...layers, newLayer];
          setLayers(newLayers);
          setActiveLayerId(newLayer.id);
          pushHistory(newLayers);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFitActiveLayer = useCallback(() => {
    if (!activeLayer || !activeLayer.image) return;
    const fitScale = calculateFitScale(activeLayer.image.width, activeLayer.image.height);
    updateActiveLayer({ scale: fitScale });
  }, [activeLayer, calculateFitScale]);

  const pushHistory = useCallback((newLayers: Layer[]) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      const snapshot = newLayers.map(l => ({
        ...l,
        pins: l.pins.map(p => ({ ...p }))
      }));
      nextHistory.push(snapshot);
      return nextHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setLayers(prev.map(l => ({ ...l, pins: l.pins.map(p => ({ ...p })) })));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setLayers(next.map(l => ({ ...l, pins: l.pins.map(p => ({ ...p })) })));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    layers.forEach(layer => {
      if (!layer.visible || !layer.image) return;

      const mesh = generateMesh(layer.image.width, layer.image.height, settings.meshDensity);
      const deformedVertices = mesh.vertices.map(v => 
        calculateDeformedPoint(v, layer.pins, settings.pinInfluence)
      );

      const scaledW = layer.image.width * layer.scale;
      const scaledH = layer.image.height * layer.scale;
      const offsetX = (canvas.width - scaledW) / 2;
      const offsetY = (canvas.height - scaledH) / 2;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      mesh.indices.forEach(triangle => {
        const [i1, i2, i3] = triangle;
        const v1 = mesh.vertices[i1], v2 = mesh.vertices[i2], v3 = mesh.vertices[i3];
        const d1 = deformedVertices[i1], d2 = deformedVertices[i2], d3 = deformedVertices[i3];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(d1.x * layer.scale + offsetX, d1.y * layer.scale + offsetY);
        ctx.lineTo(d2.x * layer.scale + offsetX, d2.y * layer.scale + offsetY);
        ctx.lineTo(d3.x * layer.scale + offsetX, d3.y * layer.scale + offsetY);
        ctx.closePath();
        ctx.clip();

        const x0 = v1.x, y0 = v1.y, x1 = v2.x, y1 = v2.y, x2 = v3.x, y2 = v3.y;
        const u0 = d1.x * layer.scale + offsetX, v0 = d1.y * layer.scale + offsetY;
        const u1 = d2.x * layer.scale + offsetX, v1_ = d2.y * layer.scale + offsetY;
        const u2 = d3.x * layer.scale + offsetX, v2_ = d3.y * layer.scale + offsetY;

        const delta = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
        if (Math.abs(delta) > 0.0001) {
          const a = ((u1 - u0) * (y2 - y0) - (u2 - u0) * (y1 - y0)) / delta;
          const b = ((v1_ - v0) * (y2 - y0) - (v2_ - v0) * (y1 - y0)) / delta;
          const c = ((u2 - u0) * (x1 - x0) - (u1 - u0) * (x2 - x0)) / delta;
          const d_ = ((v2_ - v0) * (x1 - x0) - (v1_ - v0) * (x2 - x0)) / delta;
          const e_ = u0 - a * x0 - c * y0;
          const f_ = v0 - b * x0 - d_ * y0;

          ctx.setTransform(a, b, c, d_, e_, f_);
          ctx.drawImage(layer.image!, 0, 0);
        }
        ctx.restore();
      });

      if (settings.showMesh && activeLayerId === layer.id) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        mesh.indices.forEach(triangle => {
          const [i1, i2, i3] = triangle;
          ctx.beginPath();
          ctx.moveTo(deformedVertices[i1].x * layer.scale + offsetX, deformedVertices[i1].y * layer.scale + offsetY);
          ctx.lineTo(deformedVertices[i2].x * layer.scale + offsetX, deformedVertices[i2].y * layer.scale + offsetY);
          ctx.lineTo(deformedVertices[i3].x * layer.scale + offsetX, deformedVertices[i3].y * layer.scale + offsetY);
          ctx.closePath();
          ctx.stroke();
        });
      }

      if (activeLayerId === layer.id) {
        layer.pins.forEach(pin => {
          const isSelected = pin.id === layer.selectedPinId;
          const px = pin.x * layer.scale + offsetX;
          const py = pin.y * layer.scale + offsetY;
          
          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 8 : 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#3b82f6' : '#fff';
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.stroke();

          if (isSelected) {
            ctx.beginPath();
            ctx.arc(px, py, 18, 0, Math.PI * 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      ctx.restore();
    });
  }, [layers, activeLayerId, settings]);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        draw();
      }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getEventPos = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent): Point & { rawX: number; rawY: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, rawX: 0, rawY: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        return { x: 0, y: 0, rawX: 0, rawY: 0 };
      }
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    if (!activeLayer || !activeLayer.image) return { x: rawX, y: rawY, rawX, rawY };

    const scaledW = activeLayer.image.width * activeLayer.scale;
    const scaledH = activeLayer.image.height * activeLayer.scale;
    const offsetX = (canvas.width - scaledW) / 2;
    const offsetY = (canvas.height - scaledH) / 2;
    
    return {
      x: (rawX - offsetX) / activeLayer.scale,
      y: (rawY - offsetY) / activeLayer.scale,
      rawX,
      rawY
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeLayer || !activeLayer.image) return;
    const pos = getEventPos(e);
    const hitThreshold = 20 / activeLayer.scale; 
    const hitPin = activeLayer.pins.find(p => Math.hypot(p.x - pos.x, p.y - pos.y) < hitThreshold);

    if (hitPin) {
      if (!settings.lockPins) {
        draggingPinId.current = hitPin.id;
        updateActiveLayer({ selectedPinId: hitPin.id });
      }
    } else {
      const newPin: Pin = {
        id: Math.random().toString(36).substr(2, 9),
        x: pos.x, y: pos.y,
        originalX: pos.x, originalY: pos.y,
        depth: 0,
        rotation: 0,
        rotationMode: 'Auto'
      };
      const newPins = [...activeLayer.pins, newPin];
      updateActiveLayer({ pins: newPins, selectedPinId: newPin.id });
      pushHistory(layers.map(l => l.id === activeLayerId ? { ...l, pins: newPins } : l));
    }
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingPinId.current || !activeLayerId) return;
    if (e.cancelable) e.preventDefault();
    
    const pos = getEventPos(e);
    setLayers(prev => prev.map(l => 
      l.id === activeLayerId 
        ? { ...l, pins: l.pins.map(p => p.id === draggingPinId.current ? { ...p, x: pos.x, y: pos.y } : p) } 
        : l
    ));
  }, [activeLayerId, activeLayer]);

  const handleEnd = useCallback(() => {
    if (draggingPinId.current) {
      pushHistory(layers);
      draggingPinId.current = null;
    }
  }, [layers, pushHistory]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleMove, handleEnd]);

  const updateActiveLayer = (updates: Partial<Layer>) => {
    if (!activeLayerId) return;
    setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, ...updates } : l));
  };

  const handleUpdatePin = (updates: Partial<Pin>) => {
    if (!activeLayer || !activeLayer.selectedPinId) return;
    const newPins = activeLayer.pins.map(p => 
      p.id === activeLayer.selectedPinId ? { ...p, ...updates } : p
    );
    updateActiveLayer({ pins: newPins });
    pushHistory(layers.map(l => l.id === activeLayerId ? { ...l, pins: newPins } : l));
  };

  const handleDeletePin = () => {
    if (activeLayer?.selectedPinId) {
      const newPins = activeLayer.pins.filter(p => p.id !== activeLayer.selectedPinId);
      updateActiveLayer({ pins: newPins, selectedPinId: null });
      pushHistory(layers.map(l => l.id === activeLayerId ? { ...l, pins: newPins } : l));
    }
  };

  const handleResetPose = () => {
    if (!activeLayer) return;
    const newPins = activeLayer.pins.map(p => ({ ...p, x: p.originalX, y: p.originalY }));
    updateActiveLayer({ pins: newPins });
    pushHistory(layers.map(l => l.id === activeLayerId ? { ...l, pins: newPins } : l));
  };

  const handleExport = () => {
    if (layers.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    layers.forEach(layer => {
      if (!layer.visible || !layer.image) return;
      
      const mesh = generateMesh(layer.image.width, layer.image.height, settings.meshDensity);
      const deformed = mesh.vertices.map(v => calculateDeformedPoint(v, layer.pins, settings.pinInfluence));
      
      const scaledW = layer.image.width * layer.scale;
      const scaledH = layer.image.height * layer.scale;
      const offsetX = (canvas.width - scaledW) / 2;
      const offsetY = (canvas.height - scaledH) / 2;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      mesh.indices.forEach(triangle => {
        const [i1, i2, i3] = triangle;
        const v1 = mesh.vertices[i1], v2 = mesh.vertices[i2], v3 = mesh.vertices[i3];
        const d1 = deformed[i1], d2 = deformed[i2], d3 = deformed[i3];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(d1.x * layer.scale + offsetX, d1.y * layer.scale + offsetY);
        ctx.lineTo(d2.x * layer.scale + offsetX, d2.y * layer.scale + offsetY);
        ctx.lineTo(d3.x * layer.scale + offsetX, d3.y * layer.scale + offsetY);
        ctx.closePath();
        ctx.clip();

        const x0 = v1.x, y0 = v1.y, x1 = v2.x, y1 = v2.y, x2 = v3.x, y2 = v3.y;
        const u0 = d1.x * layer.scale + offsetX, v0 = d1.y * layer.scale + offsetY;
        const u1 = d2.x * layer.scale + offsetX, v1_ = d2.y * layer.scale + offsetY;
        const u2 = d3.x * layer.scale + offsetX, v2_ = d3.y * layer.scale + offsetY;

        const delta = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
        if (Math.abs(delta) > 0.0001) {
          const a = ((u1 - u0) * (y2 - y0) - (u2 - u0) * (y1 - y0)) / delta;
          const b = ((v1_ - v0) * (y2 - y0) - (v2_ - v0) * (y1 - y0)) / delta;
          const c = ((u2 - u0) * (x1 - x0) - (u1 - u0) * (x2 - x0)) / delta;
          const d_ = ((v2_ - v0) * (x1 - x0) - (v1_ - v0) * (x2 - x0)) / delta;
          const e_ = u0 - a * x0 - c * y0;
          const f_ = v0 - b * x0 - d_ * y0;
          ctx.setTransform(a, b, c, d_, e_, f_);
          ctx.drawImage(layer.image!, 0, 0);
        }
        ctx.restore();
      });
      ctx.restore();
    });

    const link = document.createElement('a');
    link.download = 'posed_character_design.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const deleteLayer = (id: string) => {
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (activeLayerId === id) setActiveLayerId(newLayers[0]?.id || null);
    pushHistory(newLayers);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1a1a] text-gray-200 font-sans">
      <Toolbar 
        onLoadImage={handleAddImageLayer} 
        onReset={handleResetPose}
        onDeletePin={handleDeletePin}
        onExport={handleExport}
        showMesh={settings.showMesh}
        setShowMesh={(val) => setSettings({ ...settings, showMesh: val })}
        showControlPanel={showControlPanel}
        setShowControlPanel={setShowControlPanel}
        selectedPin={selectedPin}
        onUpdatePin={handleUpdatePin}
        activeLayerScale={activeLayer?.scale || null}
        onUpdateScale={(sc) => updateActiveLayer({ scale: Math.max(0.1, sc) })}
        onFitToView={handleFitActiveLayer}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div 
          ref={containerRef}
          className="flex-1 relative checkerboard overflow-hidden group touch-none"
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{ touchAction: 'none' }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
          
          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 flex-col gap-6 pointer-events-none p-12 text-center">
              <div className="w-24 h-24 border-2 border-dashed border-gray-700 rounded-3xl flex items-center justify-center opacity-40 animate-pulse">
                <PhotoIcon className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold tracking-tight text-gray-400">Character Posing Studio</p>
                <p className="text-sm max-w-xs opacity-70">Import character components as separate transparent PNGs to begin warping and posing.</p>
              </div>
              <label className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-xl shadow-blue-900/40 border border-blue-500/50">
                Import First Component
                <input type="file" className="hidden" accept="image/*" onChange={handleAddImageLayer} />
              </label>
            </div>
          )}

          {showControlPanel && (
            <div className="transition-all duration-300 animate-in slide-in-from-bottom-5">
              <ControlPanel 
                settings={settings}
                setSettings={setSettings}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
              />
            </div>
          )}
        </div>

        <LayersPanel 
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onToggleVisibility={(id) => setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l))}
          onDeleteLayer={deleteLayer}
          onAddLayer={handleAddImageLayer}
          onUpdateOpacity={(id, op) => setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: op } : l))}
          onUpdateScale={(id, sc) => setLayers(prev => prev.map(l => l.id === id ? { ...l, scale: Math.max(0.1, sc) } : l))}
        />
      </div>
    </div>
  );
};

export default App;
