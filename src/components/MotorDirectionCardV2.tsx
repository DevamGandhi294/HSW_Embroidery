import { AlertCircle, AlertTriangle } from 'lucide-react';

interface MotorDirectionCardV2Props {
  label: string;
  direction?: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slippage' | 'idle' | null;
  thresholdMs?: number | null;
}

export function MotorDirectionCardV2({ label, direction, thresholdMs }: MotorDirectionCardV2Props) {
  const getDirectionBadge = () => {
    if (!direction) {
      return (
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
          No Data
        </span>
      );
    }

    const badges = {
      right: 'bg-green-100 text-green-700',
      left: 'bg-blue-100 text-blue-700',
      a_sensor_fail: 'bg-red-100 text-red-700',
      b_sensor_fail: 'bg-red-100 text-red-700',
      slippage: 'bg-orange-100 text-orange-700',
      idle: 'bg-gray-100 text-gray-600',
    };

    const labels = {
      right: 'Right',
      left: 'Left',
      a_sensor_fail: 'A Sensor Fail',
      b_sensor_fail: 'B Sensor Fail',
      slippage: 'Slippage',
      idle: 'Idle',
    };

    const Icon = direction === 'slippage' ? AlertTriangle : null;

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badges[direction]} flex items-center gap-1.5`}>
        {Icon && <Icon className="w-4 h-4" />}
        {labels[direction]}
      </span>
    );
  };

  const getWarning = () => {
    if (direction === 'b_sensor_fail') {
      return (
        <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700">B Sensor Timeout</span>
        </div>
      );
    }

    if (direction === 'a_sensor_fail') {
      return (
        <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700">A Sensor Missing</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">{label}</h4>
        {getDirectionBadge()}
      </div>

      {thresholdMs !== null && thresholdMs !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          Threshold: {thresholdMs}ms
        </p>
      )}

      {getWarning()}
    </div>
  );
}
