import { SensorConfig, supabase } from '../lib/supabase';
import { X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SensorConfigModalProps {
  config: SensorConfig | null;
  onClose: () => void;
  onSave: () => void;
}

export function SensorConfigModal({ config, onClose, onSave }: SensorConfigModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [unit, setUnit] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setDisplayName(config.display_name);
      setUnit(config.unit);
      setMinThreshold(config.min_threshold?.toString() || '');
      setMaxThreshold(config.max_threshold?.toString() || '');
    }
  }, [config]);

  if (!config) return null;

  const handleSave = async () => {
    if (!displayName.trim()) {
      alert('Display name is required');
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        display_name: displayName.trim(),
        unit: unit.trim(),
        min_threshold: minThreshold && minThreshold.trim() !== '' ? parseFloat(minThreshold) : null,
        max_threshold: maxThreshold && maxThreshold.trim() !== '' ? parseFloat(maxThreshold) : null,
      };

      const { error } = await supabase
        .from('sensor_config')
        .update(updateData)
        .eq('id', config.id);

      if (error) {
        console.error('Database error:', error);
        alert('Failed to save configuration: ' + error.message);
        throw error;
      }

      await onSave();
    } catch (error) {
      console.error('Failed to save sensor config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Configure Sensor</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sensor Key (Read-only)
            </label>
            <input
              type="text"
              value={config.sensor_key}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <input
              id="unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., °C, mm, Hz"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="min-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Min Threshold
              </label>
              <input
                id="min-threshold"
                type="number"
                step="any"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="max-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Max Threshold
              </label>
              <input
                id="max-threshold"
                type="number"
                step="any"
                value={maxThreshold}
                onChange={(e) => setMaxThreshold(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Set thresholds to receive alerts when sensor values go outside the normal range.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !displayName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
