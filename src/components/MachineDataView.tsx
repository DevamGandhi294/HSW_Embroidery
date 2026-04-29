import { useState, useEffect } from 'react';
import { Machine, SensorData, SensorConfig, BufferConfig, ColorConfig, supabase } from '../lib/supabase';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { SensorCard } from './SensorCard';
import { MotorStatusSection } from './MotorStatusSection';
import { BufferParametersSection } from './BufferParametersSection';
import { ColorMotorCard } from './ColorMotorCard';
import { formatDateTime } from '../utils/dateUtils';
import { exportToCSV } from '../utils/csvExport';

interface MachineDataViewProps {
  machine: Machine;
  onBack: () => void;
}

// ── Keys that belong to each group ──
const MOTOR_KEYS       = ['color_motor', 'main_motor'];
const SURFACE_VIB_KEYS = ['surface_level', 'vibration'];
const TEMP_KEYS        = ['temperature', 'temperature_1', 'temperature_2', 'temperature_3',
                          'temp', 'temp_1', 'temp_2', 'temp_3'];

function isMotorKey      (key: string) { return MOTOR_KEYS.some(k => key.includes(k)); }
function isSurfaceVibKey (key: string) { return SURFACE_VIB_KEYS.some(k => key.includes(k)); }
function isTempKey       (key: string) { return TEMP_KEYS.some(k => key.includes(k)); }

// ── Section wrapper ──
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

export function MachineDataView({ machine, onBack }: MachineDataViewProps) {
  const [latestData,    setLatestData]    = useState<SensorData | null>(null);
  const [previousData,  setPreviousData]  = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>([]);
  const [bufferConfigs, setBufferConfigs] = useState<BufferConfig[]>([]);
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [viewMode,      setViewMode]      = useState<'current' | 'historical'>('current');

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`machine-data-${machine.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `machine_id=eq.${machine.id}`,
        },
        (payload) => {
          setPreviousData(latestData);
          setLatestData(payload.new as SensorData);
          setHistoricalData(prev => [payload.new as SensorData, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [machine.id]);

  const fetchData = async () => {
    await Promise.all([
      fetchLatestData(),
      fetchHistoricalData(),
      fetchSensorConfigs(),
      fetchBufferConfigs(),
      fetchColorConfigs(),
    ]);
  };

  const fetchLatestData = async () => {
    const { data } = await supabase
      .from('sensor_data').select('*')
      .eq('machine_id', machine.id)
      .order('timestamp', { ascending: false }).limit(2);
    if (data && data.length > 0) {
      setLatestData(data[0]);
      if (data.length > 1) setPreviousData(data[1]);
    }
  };

  const fetchHistoricalData = async () => {
    const { data } = await supabase
      .from('sensor_data').select('*')
      .eq('machine_id', machine.id)
      .order('timestamp', { ascending: false }).limit(100);
    if (data) setHistoricalData(data);
  };

  const fetchSensorConfigs = async () => {
    const { data } = await supabase
      .from('sensor_config').select('*')
      .eq('machine_id', machine.id)
      .order('sensor_key', { ascending: true });
    if (data) setSensorConfigs(data);
  };

  const fetchBufferConfigs = async () => {
    const { data } = await supabase
      .from('buffer_config').select('*')
      .eq('machine_id', machine.id)
      .order('buffer_key', { ascending: true });
    if (data) setBufferConfigs(data);
  };

  const fetchColorConfigs = async () => {
    const { data } = await supabase
      .from('color_config').select('*')
      .eq('machine_id', machine.id)
      .order('color_index', { ascending: true });
    if (data) setColorConfigs(data);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleDownloadCSV = () => {
    exportToCSV(historicalData, sensorConfigs, machine.name);
  };

  const getSensorValue = (sensorKey: string): number | null => {
    if (!latestData) return null;
    return (latestData as any)[sensorKey];
  };

  const getPreviousSensorValue = (sensorKey: string): number | null => {
    if (!previousData) return null;
    return (previousData as any)[sensorKey];
  };

  // ── Split enabled configs into groups ──
  const enabledConfigs = sensorConfigs.filter(c => c.enabled);

  const motorConfigs     = enabledConfigs.filter(c => isMotorKey(c.sensor_key));
  const surfaceVibConfigs = enabledConfigs.filter(c => isSurfaceVibKey(c.sensor_key));
  const tempConfigs      = enabledConfigs.filter(c => isTempKey(c.sensor_key));
  const otherConfigs     = enabledConfigs.filter(
    c => !isMotorKey(c.sensor_key) && !isSurfaceVibKey(c.sensor_key) && !isTempKey(c.sensor_key)
  );

  // ── Shared card renderer ──
  const renderCard = (config: SensorConfig) => (
    <SensorCard
      key={config.id}
      config={config}
      value={getSensorValue(config.sensor_key)}
      previousValue={getPreviousSensorValue(config.sensor_key)}
      onEditConfig={() => {}}
      pitch={latestData?.pitch}
      roll={latestData?.roll}
      surfaceX={latestData?.surface_x}
      surfaceY={latestData?.surface_y}
      surfaceZ={latestData?.surface_z}
      vibrationX={latestData?.vibration_x}
      vibrationY={latestData?.vibration_y}
      vibrationZ={latestData?.vibration_z}
    />
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{machine.name}</h2>
            <p className="text-sm text-gray-500">Device ID: {machine.device_id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode('current')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'current'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Current Data
        </button>
        <button
          onClick={() => setViewMode('historical')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'historical'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Historical Data
        </button>
      </div>

      {viewMode === 'current' ? (
        <>
          {/* ── No configs fallback ── */}
          {enabledConfigs.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-gray-500 text-center py-8">No sensor configurations found.</p>
            </div>
          )}

          {/* ── Color Motor Section ── */}
          {latestData?.color_motor_encoder !== null && latestData?.color_motor_encoder !== undefined && (
            <ColorMotorCard
              rawValue={latestData.color_motor_encoder}
              colorConfigs={colorConfigs}
            />
          )}

          {/* ── Section 1: Motors ── */}
          {motorConfigs.length > 0 && (
            <SectionBlock title="Motors">
              {motorConfigs.map(renderCard)}
            </SectionBlock>
          )}

          {/* ── Section 2: Surface Level & Vibration ── */}
          {surfaceVibConfigs.length > 0 && (
            <SectionBlock title="Surface Level & Vibration">
              {surfaceVibConfigs.map(renderCard)}
            </SectionBlock>
          )}

          {/* ── Section 3: Temperatures ── */}
          {tempConfigs.length > 0 && (
            <SectionBlock title="Temperatures">
              {tempConfigs.map(renderCard)}
            </SectionBlock>
          )}


          {/* ── Motor Status (unchanged) ── */}
          {(latestData?.x_motor_encoder !== null || latestData?.y_motor_encoder !== null ||
            latestData?.x_motor_direction || latestData?.y_motor_direction ||
            latestData?.x_direction || latestData?.y_direction) && (
            <MotorStatusSection
              xEncoder={latestData?.x_motor_encoder}
              yEncoder={latestData?.y_motor_encoder}
              xDirection={latestData?.x_direction}
              yDirection={latestData?.y_direction}
              xThresholdMs={latestData?.x_b_threshold_ms}
              yThresholdMs={latestData?.y_b_threshold_ms}
              xMotorDirection={latestData?.x_motor_direction}
              yMotorDirection={latestData?.y_motor_direction}
            />
          )}

          {/* ── Buffer Parameters (unchanged) ── */}
          {latestData && (
            <BufferParametersSection
              bufferConfigs={bufferConfigs}
              bufferValues={{
                buffer_1: latestData.buffer_1,
                buffer_2: latestData.buffer_2,
                buffer_3: latestData.buffer_3,
                buffer_4: latestData.buffer_4,
                buffer_5: latestData.buffer_5,
              }}
            />
          )}
        </>
      ) : (
        /* ── Historical Data (unchanged) ── */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Historical Data</h3>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Timestamp</th>
                  {enabledConfigs.map(config => (
                    <th key={config.id} className="px-4 py-3 text-left font-medium text-gray-700">
                      {config.display_name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-gray-700">X Motor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Y Motor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historicalData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                      {formatDateTime(data.timestamp)}
                    </td>
                    {enabledConfigs.map(config => {
                      const value = (data as any)[config.sensor_key];
                      return (
                        <td key={config.id} className="px-4 py-3 text-gray-900">
                          {value !== null ? value.toFixed(2) : '--'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-gray-900">{data.x_motor_direction || '--'}</td>
                    <td className="px-4 py-3 text-gray-900">{data.y_motor_direction || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historicalData.length === 0 && (
              <p className="text-center text-gray-500 py-8">No historical data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}