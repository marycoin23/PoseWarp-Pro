
import React from 'react';
import { WarpSettings } from '../types';

interface ControlPanelProps {
  settings: WarpSettings;
  setSettings: (s: WarpSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  setSettings,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  return (
    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
      <div className="bg-[#242424] border border-[#333] rounded-xl p-6 w-full max-w-lg pointer-events-auto shadow-2xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Lock Pin</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.lockPins}
                  onChange={(e) => setSettings({ ...settings, lockPins: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="text-sm text-gray-300">Mesh Density</div>
            <div className="text-sm text-gray-300">Pin Influence Radius</div>
          </div>

          <div className="flex flex-col gap-4 justify-end">
            <div className="h-6" /> {/* Spacer for Lock Pin row */}
            <input 
              type="range" 
              min="0.5" 
              max="5" 
              step="0.1" 
              value={settings.meshDensity}
              onChange={(e) => setSettings({ ...settings, meshDensity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="0.5" 
              value={settings.pinInfluence}
              onChange={(e) => setSettings({ ...settings, pinInfluence: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pointer-events-auto">
        <button 
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-8 py-3 rounded-xl font-medium transition-all ${canUndo ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          Undo
        </button>
        <button 
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${canRedo ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          <span>Redo</span>
          {canRedo && <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
