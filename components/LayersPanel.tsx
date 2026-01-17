
import React from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  TrashIcon, 
  PlusIcon,
  Bars3Icon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Layer } from '../types';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onAddLayer: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateScale: (id: string, scale: number) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onAddLayer,
  onUpdateOpacity,
  onUpdateScale
}) => {
  return (
    <div className="w-72 bg-[#242424] border-l border-[#333] flex flex-col h-full shadow-2xl z-10">
      <div className="p-3 border-b border-[#333] flex items-center justify-between bg-[#1a1a1a]/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Layers</span>
        <label className="p-1 hover:bg-[#333] rounded cursor-pointer group transition-colors">
          <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
          <input type="file" className="hidden" accept="image/*" onChange={onAddLayer} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {[...layers].reverse().map((layer) => (
          <div 
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`flex flex-col border-b border-[#333]/50 transition-colors cursor-default ${
              activeLayerId === layer.id ? 'bg-[#333]' : 'hover:bg-[#2a2a2a]'
            }`}
          >
            <div className="flex items-center p-2 gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                className="p-1 text-gray-500 hover:text-white transition-colors"
              >
                {layer.visible ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              </button>
              
              <div className="w-10 h-10 bg-black/40 rounded border border-[#444] overflow-hidden checkerboard flex items-center justify-center">
                {layer.image ? (
                  <img src={layer.image.src} className="w-full h-full object-contain" alt="" />
                ) : (
                  <PhotoIcon className="w-4 h-4 text-gray-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-200 truncate">
                  {layer.name}
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-tighter">
                  {layer.pins.length} Pins • Normal
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                className="p-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
              
              <Bars3Icon className="w-4 h-4 text-gray-700 cursor-grab" />
            </div>

            {activeLayerId === layer.id && (
              <div className="px-3 pb-3 pt-1 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Opacity Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-gray-500 uppercase w-8">Opac</span>
                  <div className="checkerboard w-full h-1 bg-gray-800 rounded-full relative overflow-hidden group">
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={layer.opacity}
                      onChange={(e) => onUpdateOpacity(layer.id, parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-600 transition-all"
                      style={{ width: `${layer.opacity * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500 w-8 tabular-nums">{Math.round(layer.opacity * 100)}%</span>
                </div>

                {/* Scale Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-gray-500 uppercase w-8">Scale</span>
                  <div className="w-full h-1 bg-gray-800 rounded-full relative overflow-hidden group">
                    <input 
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.01"
                      value={layer.scale}
                      onChange={(e) => onUpdateScale(layer.id, parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute top-0 left-0 h-full bg-emerald-500 transition-all"
                      style={{ width: `${((layer.scale - 0.1) / 2.9) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500 w-8 tabular-nums">{Math.round(layer.scale * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {layers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 opacity-20 p-8 text-center gap-2">
            <PhotoIcon className="w-12 h-12" />
            <span className="text-xs">No layers yet</span>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#1a1a1a]/80 border-t border-[#333] flex gap-2">
        <div className="flex-1 h-8 bg-[#2a2a2a] rounded border border-[#333] flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
           Blend Mode: Normal
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;
