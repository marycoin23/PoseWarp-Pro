
import React from 'react';
import { 
  PlusIcon, 
  ArrowPathIcon, 
  UserCircleIcon,
  ArrowDownTrayIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Pin, RotationMode } from '../types';

interface ToolbarProps {
  onLoadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onDeletePin: () => void;
  onExport: () => void;
  showMesh: boolean;
  setShowMesh: (val: boolean) => void;
  showControlPanel: boolean;
  setShowControlPanel: (val: boolean) => void;
  selectedPin: Pin | null;
  onUpdatePin: (updates: Partial<Pin>) => void;
  activeLayerScale: number | null;
  onUpdateScale: (scale: number) => void;
  onFitToView: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onLoadImage,
  onReset,
  onDeletePin,
  onExport,
  showMesh,
  setShowMesh,
  showControlPanel,
  setShowControlPanel,
  selectedPin,
  onUpdatePin,
  activeLayerScale,
  onUpdateScale,
  onFitToView
}) => {
  return (
    <div className="bg-[#242424] border-b border-[#333] h-14 flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <UserCircleIcon className="w-6 h-6 text-blue-400" />
          <span className="hidden lg:inline">PoseWarp Pro</span>
        </div>
        <div className="h-6 w-[1px] bg-[#444] mx-2" />
        
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#333] cursor-pointer text-sm font-medium transition-colors">
          <PlusIcon className="w-5 h-5 text-blue-400" />
          <span className="hidden sm:inline">New Image</span>
          <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={onLoadImage} />
        </label>

        <div className="h-6 w-[1px] bg-[#444] mx-2" />

        {activeLayerScale !== null && (
          <div className="flex items-center gap-4 px-2">
            <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter leading-none mb-1">Scale Control</span>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.01"
                      value={activeLayerScale}
                      onChange={(e) => onUpdateScale(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        value={Math.round(activeLayerScale * 100)}
                        onChange={(e) => onUpdateScale(parseInt(e.target.value) / 100 || 0.1)}
                        className="w-10 bg-[#1a1a1a] border border-[#444] text-[10px] rounded px-1 py-0.5 text-center text-emerald-400"
                      />
                      <span className="text-gray-500 text-[9px] font-bold">%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-[#1a1a1a] rounded-md border border-[#444] overflow-hidden">
                    <button 
                      onClick={() => onUpdateScale(0.5)}
                      className="px-1.5 py-1 text-[9px] font-bold text-gray-400 hover:text-white hover:bg-[#333] border-r border-[#333]"
                    >50%</button>
                    <button 
                      onClick={() => onUpdateScale(1.0)}
                      className="px-1.5 py-1 text-[9px] font-bold text-gray-400 hover:text-white hover:bg-[#333] border-r border-[#333]"
                    >1:1</button>
                    <button 
                      onClick={() => onUpdateScale(2.0)}
                      className="px-1.5 py-1 text-[9px] font-bold text-gray-400 hover:text-white hover:bg-[#333] border-r border-[#333]"
                    >2x</button>
                    <button 
                      onClick={onFitToView}
                      className="px-1.5 py-1 text-[9px] font-bold text-emerald-500 hover:text-emerald-400 hover:bg-[#333]"
                      title="Fit to Canvas"
                    >
                      FIT
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {selectedPin && (
          <>
            <div className="h-6 w-[1px] bg-[#444] mx-2" />
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Depth:</span>
                <div className="flex items-center bg-[#1a1a1a] rounded-md border border-[#444]">
                  <button 
                    onClick={() => onUpdatePin({ depth: (selectedPin.depth || 0) + 1 })}
                    className="p-1.5 hover:bg-[#333] transition-colors" title="Bring Forward"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-[#333]" />
                  <button 
                    onClick={() => onUpdatePin({ depth: Math.max(0, (selectedPin.depth || 0) - 1) })}
                    className="p-1.5 hover:bg-[#333] transition-colors" title="Send Backward"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Rotate:</span>
                <select 
                  value={selectedPin.rotationMode}
                  onChange={(e) => onUpdatePin({ rotationMode: e.target.value as RotationMode })}
                  className="bg-[#1a1a1a] border border-[#444] text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                >
                  <option value="Auto">Auto</option>
                  <option value="Fixed">Fixed</option>
                </select>
                {selectedPin.rotationMode === 'Fixed' && (
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      value={selectedPin.rotation}
                      onChange={(e) => onUpdatePin({ rotation: parseInt(e.target.value) || 0 })}
                      className="w-12 bg-[#1a1a1a] border border-[#444] text-xs rounded px-1 py-1 text-center"
                    />
                    <span className="text-gray-500 text-xs">°</span>
                  </div>
                )}
              </div>

              <button 
                onClick={onDeletePin}
                className="text-xs font-medium text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                Delete Pin
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 mr-2">
          <label className="flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={showMesh}
              onChange={(e) => setShowMesh(e.target.checked)}
            />
            <div className="w-8 h-4 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 relative"></div>
            <span className="ml-2 text-[10px] font-bold text-gray-500 uppercase">Mesh</span>
          </label>

          <button 
            onClick={() => setShowControlPanel(!showControlPanel)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded transition-all ${showControlPanel ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-[#333]'}`}
            title="Toggle Settings Panel"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase hidden md:inline">Settings</span>
          </button>
        </div>

        <button 
          onClick={onReset}
          className="p-2 rounded-md hover:bg-[#333] text-gray-400 hover:text-white transition-colors"
          title="Reset Pose"
        >
          <span className="sr-only">Reset Pose</span>
          <ArrowPathIcon className="w-5 h-5" />
        </button>

        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-all text-white shadow-lg shadow-blue-900/20"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
