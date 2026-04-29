import { SensorConfig } from '../lib/supabase';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Settings } from 'lucide-react';
import { useState, useEffect, memo } from 'react';

interface SensorCardProps {
  config: SensorConfig;
  value: number | null;
  previousValue?: number | null;
  onEditConfig: (config: SensorConfig) => void;
  pitch?: number | null;
  roll?: number | null;
  surfaceX?: number | null;
  surfaceY?: number | null;
  surfaceZ?: number | null;
  vibrationX?: number | null;
  vibrationY?: number | null;
  vibrationZ?: number | null;
}

// ── Small stat box used inside surface & vibration cards ──
function StatBox({
  label,
  value,
  accent = 'blue',
}: {
  label: string;
  value: number | null | undefined;
  accent?: 'blue' | 'violet' | 'cyan' | 'emerald' | 'amber';
}) {
  const colors: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-700',
    violet:  'bg-violet-50 text-violet-700',
    cyan:    'bg-cyan-50 text-cyan-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
  };
  const hasVal = value !== null && value !== undefined;
  return (
    <div className={`rounded-lg px-3 py-2 flex flex-col items-center gap-0.5 ${colors[accent]}`}>
      <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">{label}</span>
      <span className="text-base font-black tabular-nums">
        {hasVal ? value : <span className="text-gray-300 font-normal">--</span>}
      </span>
    </div>
  );
}

const SensorCardComponent = ({
  config,
  value,
  previousValue,
  onEditConfig,
  pitch,
  roll,
  surfaceX,
  surfaceY,
  surfaceZ,
  vibrationX,
  vibrationY,
  vibrationZ,
}: SensorCardProps) => {
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [isAlert, setIsAlert] = useState(false);

  useEffect(() => {
    if (value !== null && previousValue !== null) {
      const diff = value - (previousValue ?? value);
      if (Math.abs(diff) < 0.01) setTrend('stable');
      else if (diff > 0) setTrend('up');
      else setTrend('down');
    }
    if (value !== null) {
      const hasMinAlert = config.min_threshold !== null && value < config.min_threshold;
      const hasMaxAlert = config.max_threshold !== null && value > config.max_threshold;
      setIsAlert(hasMinAlert || hasMaxAlert);
    }
  }, [value, previousValue, config.min_threshold, config.max_threshold]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':   return <TrendingUp   className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600"   />;
      default:     return <Minus        className="w-4 h-4 text-gray-400"  />;
    }
  };

  const isSurfaceLevel = config.sensor_key === 'surface_level';
  const isVibration    = config.sensor_key === 'vibration';

  // ── Card wrapper (unchanged from original) ──
  const wrapperClass = `bg-white rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md ${
    isAlert ? 'border-red-400 bg-red-50' : 'border-gray-200'
  }`;

  // ── Card header (unchanged from original) ──
  const CardHeader = () => (
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-700 truncate">{config.display_name}</h3>
      </div>
      <button
        onClick={() => onEditConfig(config)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Configure sensor"
      >
        <Settings className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );

  // ── SURFACE LEVEL card — redesigned ──
  if (isSurfaceLevel) {
    return (
      <div className={wrapperClass}>
        <CardHeader />

        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
            Pitch / Roll
          </p>
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Pitch" value={pitch} accent="blue"   />
            <StatBox label="Roll"  value={roll}  accent="violet" />
          </div>
        </div>

        <div className="border-t border-gray-100 my-3" />

        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
            X / Y / Z
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="X" value={surfaceX} accent="cyan"    />
            <StatBox label="Y" value={surfaceY} accent="emerald" />
            <StatBox label="Z" value={surfaceZ} accent="amber"   />
          </div>
        </div>
      </div>
    );
  }

  // ── VIBRATION card — redesigned ──
  if (isVibration) {
    return (
      <div className={wrapperClass}>
        <CardHeader />

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900">
            {value !== null ? value.toFixed(2) : '--'}
          </span>
          <span className="text-sm text-gray-500">Hz / G</span>
        </div>

        <div className="border-t border-gray-100 my-3" />

        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
            X / Y / Z
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="X" value={vibrationX} accent="blue"   />
            <StatBox label="Y" value={vibrationY} accent="violet" />
            <StatBox label="Z" value={vibrationZ} accent="cyan"   />
          </div>
        </div>
      </div>
    );
  }

  // ── DEFAULT card — 100% unchanged from original ──
  return (
    <div className={wrapperClass}>
      <CardHeader />
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${isAlert ? 'text-red-600' : 'text-gray-900'}`}>
              {value !== null ? value.toFixed(2) : '--'}
            </span>
            {config.unit && <span className="text-sm text-gray-500">{config.unit}</span>}
          </div>
          {isAlert && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3" />
              <span>Threshold exceeded</span>
            </div>
          )}
        </div>
        <div className="flex items-center">{getTrendIcon()}</div>
      </div>

      {(config.min_threshold !== null || config.max_threshold !== null) && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          {config.min_threshold !== null && <span>Min: {config.min_threshold}</span>}
          {config.min_threshold !== null && config.max_threshold !== null && (
            <span className="mx-2">|</span>
          )}
          {config.max_threshold !== null && <span>Max: {config.max_threshold}</span>}
        </div>
      )}
    </div>
  );
};

export const SensorCard = memo(SensorCardComponent);