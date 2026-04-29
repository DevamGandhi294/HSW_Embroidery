import { useState, useEffect } from 'react';
import { Machine, SensorConfig, BufferConfig, DeviceSettings, ColorConfig, supabase } from '../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface DeviceConfigPageProps {
  machine: Machine;
  onBack: () => void;
}

// ── Fixed 12 color indexes — these never change ──
const FIXED_COLOR_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const DEFAULT_COLOR_RANGES: Record<number, { min: number; max: number }> = {
  1: { min: 0, max: 250 },
  2: { min: 250, max: 350 },
  3: { min: 350, max: 650 },
  4: { min: 650, max: 800 },
  5: { min: 800, max: 950 },
  6: { min: 950, max: 1200 },
  7: { min: 1200, max: 1400 },
  8: { min: 1400, max: 1600 },
  9: { min: 1600, max: 1800 },
  10: { min: 1800, max: 2000 },
  11: { min: 2000, max: 2200 },
  12: { min: 2300, max: 4096 },
};

const COLOR_DOT: Record<number, string> = {
  1: 'bg-slate-500', 2: 'bg-red-500', 3: 'bg-orange-500',
  4: 'bg-amber-500', 5: 'bg-yellow-500', 6: 'bg-lime-500',
  7: 'bg-green-500', 8: 'bg-teal-500', 9: 'bg-cyan-500',
  10: 'bg-blue-500', 11: 'bg-violet-500', 12: 'bg-purple-500',
};

type ColorRow = { id: string | null; min_value: number; max_value: number };

export function DeviceConfigPage({ machine: initialMachine, onBack }: DeviceConfigPageProps) {
  const [machine, setMachine] = useState(initialMachine);
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>([]);
  const [bufferConfigs, setBufferConfigs] = useState<BufferConfig[]>([]);
  const [deviceSettings, setDeviceSettings] = useState<DeviceSettings>({
    device_id: initialMachine.device_id,
    x_b_threshold_ms: 2000,
    y_b_threshold_ms: 2000,
    created_at: '',
    updated_at: '',
  });

  // Always exactly 12 rows keyed by color_index
  const [colorRows, setColorRows] = useState<Record<number, ColorRow>>(() => {
    const init: Record<number, ColorRow> = {};
    FIXED_COLOR_INDEXES.forEach(idx => {
      init[idx] = { id: null, min_value: DEFAULT_COLOR_RANGES[idx].min, max_value: DEFAULT_COLOR_RANGES[idx].max };
    });
    return init;
  });

  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [colorValidationError, setColorValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchMachine();
    fetchConfigs();
    fetchDeviceSettings();
    fetchColorConfigs();
  }, [machine.id]);

  const fetchMachine = async () => {
    const { data } = await supabase.from('machines').select('*').eq('id', machine.id).single();
    if (data) setMachine(data);
  };

  const fetchConfigs = async () => {
    const [sensorsResult, buffersResult] = await Promise.all([
      supabase.from('sensor_config').select('*').eq('machine_id', machine.id).order('sensor_key', { ascending: true }),
      supabase.from('buffer_config').select('*').eq('machine_id', machine.id).order('buffer_key', { ascending: true }),
    ]);
    if (sensorsResult.data) setSensorConfigs(sensorsResult.data);
    if (buffersResult.data) setBufferConfigs(buffersResult.data);
  };

  const fetchDeviceSettings = async () => {
    const { data } = await supabase.from('device_settings').select('*').eq('device_id', machine.device_id).maybeSingle();
    if (data) setDeviceSettings(data);
  };

  const fetchColorConfigs = async () => {
    const { data } = await supabase
      .from('color_config').select('*')
      .eq('machine_id', machine.id)
      .order('color_index', { ascending: true });

    // Build a merged record starting from defaults
    const merged: Record<number, ColorRow> = {};
    FIXED_COLOR_INDEXES.forEach(idx => {
      merged[idx] = { id: null, min_value: DEFAULT_COLOR_RANGES[idx].min, max_value: DEFAULT_COLOR_RANGES[idx].max };
    });

    if (data && data.length > 0) {
      // Overlay DB values for each matching index
      data.forEach((row: ColorConfig) => {
        if (FIXED_COLOR_INDEXES.includes(row.color_index)) {
          merged[row.color_index] = { id: row.id, min_value: row.min_value, max_value: row.max_value };
        }
      });
      setColorRows(merged);
    } else {
      // Nothing in DB yet — insert all 12 defaults
      const inserts = FIXED_COLOR_INDEXES.map(idx => ({
        machine_id: machine.id,
        color_index: idx,
        min_value: DEFAULT_COLOR_RANGES[idx].min,
        max_value: DEFAULT_COLOR_RANGES[idx].max,
      }));
      const { data: inserted } = await supabase.from('color_config').insert(inserts).select();
      if (inserted) {
        inserted.forEach((row: ColorConfig) => {
          merged[row.color_index] = { id: row.id, min_value: row.min_value, max_value: row.max_value };
        });
      }
      setColorRows(merged);
    }
  };

  const handleUnlock = () => {
    if (machine.manufacturing_password === null || machine.manufacturing_password === password) {
      setIsUnlocked(true);
      setMessage({ type: 'success', text: 'Configuration unlocked' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Incorrect password' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const validateColorRanges = (): string | null => {
    for (const idx of FIXED_COLOR_INDEXES) {
      const row = colorRows[idx];
      if (row.min_value >= row.max_value) {
        return `Color ${idx}: Min (${row.min_value}) must be less than Max (${row.max_value})`;
      }
    }
    const sorted = FIXED_COLOR_INDEXES.map(idx => ({ idx, ...colorRows[idx] }))
      .sort((a, b) => a.min_value - b.min_value);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].max_value > sorted[i + 1].min_value) {
        return `Color ${sorted[i].idx} and Color ${sorted[i + 1].idx} have overlapping ranges`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!isUnlocked) {
      setMessage({ type: 'error', text: 'Please unlock configuration first' });
      return;
    }
    const validationError = validateColorRanges();
    if (validationError) {
      setColorValidationError(validationError);
      setMessage({ type: 'error', text: validationError });
      setTimeout(() => { setMessage(null); setColorValidationError(null); }, 5000);
      return;
    }

    setIsSaving(true);
    try {
      await supabase.from('machines').update({
        name: machine.name,
        firmware_version: machine.firmware_version,
        update_frequency_seconds: machine.update_frequency_seconds,
      }).eq('id', machine.id);

      for (const config of sensorConfigs) {
        await supabase.from('sensor_config').update({
          display_name: config.display_name, unit: config.unit,
          min_threshold: config.min_threshold, max_threshold: config.max_threshold,
          enabled: config.enabled,
        }).eq('id', config.id);
      }

      for (const config of bufferConfigs) {
        await supabase.from('buffer_config').upsert({
          id: config.id, machine_id: machine.id, buffer_key: config.buffer_key,
          display_name: config.display_name, description: config.description,
        });
      }

      await supabase.from('device_settings').upsert({
        device_id: machine.device_id,
        x_b_threshold_ms: deviceSettings.x_b_threshold_ms,
        y_b_threshold_ms: deviceSettings.y_b_threshold_ms,
        updated_at: new Date().toISOString(),
      });

      // Save all 12 fixed color rows
      for (const idx of FIXED_COLOR_INDEXES) {
        const row = colorRows[idx];
        if (row.id) {
          await supabase.from('color_config').update({
            min_value: row.min_value,
            max_value: row.max_value,
            updated_at: new Date().toISOString(),
          }).eq('id', row.id);
        } else {
          const { data } = await supabase.from('color_config').insert({
            machine_id: machine.id, color_index: idx,
            min_value: row.min_value, max_value: row.max_value,
          }).select().single();
          if (data) {
            setColorRows(prev => ({ ...prev, [idx]: { ...prev[idx], id: data.id } }));
          }
        }
      }

      setMessage({ type: 'success', text: 'Configuration saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSensorConfig = (id: string, field: keyof SensorConfig, value: any) =>
    setSensorConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  const updateBufferConfig = (bufferKey: string, field: 'display_name' | 'description', value: string) => {
    const existing = bufferConfigs.find(c => c.buffer_key === bufferKey);
    if (existing) {
      setBufferConfigs(prev => prev.map(c => c.buffer_key === bufferKey ? { ...c, [field]: value } : c));
    } else {
      setBufferConfigs(prev => [...prev, {
        id: crypto.randomUUID(), machine_id: machine.id, buffer_key: bufferKey as any,
        display_name: field === 'display_name' ? value : bufferKey.replace('_', ' ').toUpperCase(),
        description: field === 'description' ? value : '',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }]);
    }
  };

  const getBufferConfig = (bufferKey: string) => bufferConfigs.find(c => c.buffer_key === bufferKey);

  const updateColorRow = (idx: number, field: 'min_value' | 'max_value', value: number) => {
    setColorRows(prev => ({ ...prev, [idx]: { ...prev[idx], [field]: value } }));
    setColorValidationError(null);
  };

  const resetToDefault = () => {
    setColorRows(prev => {
      const next = { ...prev };
      FIXED_COLOR_INDEXES.forEach(idx => {
        next[idx] = { ...next[idx], min_value: DEFAULT_COLOR_RANGES[idx].min, max_value: DEFAULT_COLOR_RANGES[idx].max };
      });
      return next;
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Device Configuration</h2>
            <p className="text-sm text-gray-500">{machine.name}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={!isUnlocked || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Unlock */}
      {!isUnlocked && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Unlock Configuration</h3>
          <div className="flex gap-3">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Enter manufacturing password"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleUnlock} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Unlock
            </button>
          </div>
          {machine.manufacturing_password === null && (
            <p className="text-xs text-gray-500 mt-2">No password set — click Unlock to proceed</p>
          )}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Machine Name</label>
            <input type="text" value={machine.name} onChange={(e) => setMachine({ ...machine, name: e.target.value })}
              disabled={!isUnlocked} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Firmware Version</label>
            <input type="text" value={machine.firmware_version}
              onChange={(e) => setMachine({ ...machine, firmware_version: e.target.value })}
              disabled={!isUnlocked}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Update Frequency (seconds)</label>
            <input type="number" value={machine.update_frequency_seconds}
              onChange={(e) => setMachine({ ...machine, update_frequency_seconds: parseInt(e.target.value) || 5 })}
              disabled={!isUnlocked} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
          </div>

        </div>
      </div>

      {/* Sensor Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor Configuration</h3>
        <div className="space-y-4">
          {sensorConfigs.map(config => (
            <div key={config.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" checked={config.enabled}
                  onChange={(e) => updateSensorConfig(config.id, 'enabled', e.target.checked)}
                  disabled={!isUnlocked} className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{config.sensor_key}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" value={config.display_name}
                  onChange={(e) => updateSensorConfig(config.id, 'display_name', e.target.value)}
                  disabled={!isUnlocked} placeholder="Display Name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                <input type="text" value={config.unit}
                  onChange={(e) => updateSensorConfig(config.id, 'unit', e.target.value)}
                  disabled={!isUnlocked} placeholder="Unit"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                <input type="number" value={config.min_threshold || ''}
                  onChange={(e) => updateSensorConfig(config.id, 'min_threshold', e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={!isUnlocked} placeholder="Min Threshold"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                <input type="number" value={config.max_threshold || ''}
                  onChange={(e) => updateSensorConfig(config.id, 'max_threshold', e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={!isUnlocked} placeholder="Max Threshold"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buffer Parameters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buffer Parameters</h3>
        <div className="space-y-4">
          {(['buffer_1', 'buffer_2', 'buffer_3', 'buffer_4', 'buffer_5'] as const).map(bufferKey => {
            const config = getBufferConfig(bufferKey);
            return (
              <div key={bufferKey} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">{bufferKey.replace('_', ' ').toUpperCase()}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={config?.display_name || ''}
                    onChange={(e) => updateBufferConfig(bufferKey, 'display_name', e.target.value)}
                    disabled={!isUnlocked} placeholder="Display Name"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                  <input type="text" value={config?.description || ''}
                    onChange={(e) => updateBufferConfig(bufferKey, 'description', e.target.value)}
                    disabled={!isUnlocked} placeholder="Description"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motor Threshold Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Motor Threshold Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">X-Axis B Sensor Threshold (ms)</label>
            <input type="number" value={deviceSettings.x_b_threshold_ms}
              onChange={(e) => setDeviceSettings({ ...deviceSettings, x_b_threshold_ms: parseInt(e.target.value) || 2000 })}
              disabled={!isUnlocked}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
            <p className="text-xs text-gray-500 mt-1">Timeout threshold for X-axis B sensor in milliseconds (default: 2000)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Y-Axis B Sensor Threshold (ms)</label>
            <input type="number" value={deviceSettings.y_b_threshold_ms}
              onChange={(e) => setDeviceSettings({ ...deviceSettings, y_b_threshold_ms: parseInt(e.target.value) || 2000 })}
              disabled={!isUnlocked}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
            <p className="text-xs text-gray-500 mt-1">Timeout threshold for Y-axis B sensor in milliseconds (default: 2000)</p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          COLOR RANGE CONFIGURATION
          12 fixed color indexes — only min/max editable
      ════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Color Range Configuration</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Set the raw encoder value range for each of the 12 fixed colors.
            </p>
          </div>
          {isUnlocked && (
            <button onClick={resetToDefault}
              className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              Reset to Default
            </button>
          )}
        </div>

        {colorValidationError && (
          <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-lg text-sm">{colorValidationError}</div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200 w-36">Color Index</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200 w-44">Min Value</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200 w-44">Max Value</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Range Preview</th>
              </tr>
            </thead>
            <tbody>
              {FIXED_COLOR_INDEXES.map(idx => {
                const row = colorRows[idx];
                const barLeft = Math.min((row.min_value / 4096) * 100, 100);
                const barWidth = Math.max(Math.min(((row.max_value - row.min_value) / 4096) * 100, 100), 1);
                const isValid = row.min_value < row.max_value;

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">

                    {/* Color Index — static, never editable */}
                    <td className="px-4 py-3 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${COLOR_DOT[idx]}`} />
                        <span className="font-semibold text-gray-800">Color {idx}</span>
                      </div>
                    </td>

                    {/* Min Value */}
                    <td className="px-4 py-3 border border-gray-200">
                      <input
                        type="number"
                        value={row.min_value}
                        min={0}
                        max={4095}
                        onChange={(e) => updateColorRow(idx, 'min_value', parseInt(e.target.value) || 0)}
                        disabled={!isUnlocked}
                        className={`w-32 px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900
                          ${!isValid ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                    </td>

                    {/* Max Value */}
                    <td className="px-4 py-3 border border-gray-200">
                      <input
                        type="number"
                        value={row.max_value}
                        min={1}
                        max={4096}
                        onChange={(e) => updateColorRow(idx, 'max_value', parseInt(e.target.value) || 0)}
                        disabled={!isUnlocked}
                        className={`w-32 px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900
                          ${!isValid ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                    </td>

                    {/* Range Preview bar */}
                    <td className="px-4 py-3 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden min-w-[120px] relative">
                          <div
                            className={`absolute h-full rounded-full ${COLOR_DOT[idx]}`}
                            style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap min-w-[100px]">
                          {row.min_value} – {row.max_value}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Color indexes 1–12 are fixed and cannot be added or removed.
          Only Min and Max values are editable. The device raw encoder value is compared
          against these ranges to determine the detected color.
        </p>
      </div>

    </div>
  );
}