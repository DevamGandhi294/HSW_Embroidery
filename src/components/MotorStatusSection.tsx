import { AlertCircle } from 'lucide-react';

interface MotorStatusSectionProps {
  xEncoder?: number | null;
  yEncoder?: number | null;
  xDirection?: string | null;
  yDirection?: string | null;
  xThresholdMs?: number | null;
  yThresholdMs?: number | null;
  xMotorDirection?: string | null;
  yMotorDirection?: string | null;
}

function getDirectionBadge(direction?: string | null) {
  // Truly no data
  if (direction === null || direction === undefined || direction === '') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
        No Data
      </span>
    );
  }

  const normalized = direction.toLowerCase().trim();

  if (normalized === 'right') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
        Right
      </span>
    );
  }
  if (normalized === 'left') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
        Left
      </span>
    );
  }
  if (normalized === 'idle') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
        Idle
      </span>
    );
  }
  if (normalized === 'slipage' || normalized === 'slippage') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-700">
        Slippage
      </span>
    );
  }
  if (normalized === 'a_sensor_fail' || normalized === 'a sensor fail') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
        A Sensor Fail
      </span>
    );
  }
  if (normalized === 'b_sensor_fail' || normalized === 'b sensor fail') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
        B Sensor Fail
      </span>
    );
  }
  if (normalized === 'sensor fail' || normalized === 'sensor_fail') {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
        Sensor Fail
      </span>
    );
  }

  // Fallback — show whatever value comes from Supabase so we can debug
  return (
    <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">
      {direction}
    </span>
  );
}

function getWarning(direction?: string | null) {
  if (!direction) return null;
  const normalized = direction.toLowerCase().trim();

  if (normalized === 'slipage' || normalized === 'slippage') {
    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
        <span className="text-sm font-medium text-orange-700">Slippage Detected</span>
      </div>
    );
  }
  if (normalized === 'b_sensor_fail' || normalized === 'b sensor fail') {
    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700">B Sensor Timeout</span>
      </div>
    );
  }
  if (normalized === 'a_sensor_fail' || normalized === 'a sensor fail') {
    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700">A Sensor Missing</span>
      </div>
    );
  }
  if (normalized === 'sensor fail' || normalized === 'sensor_fail') {
    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700">Sensor Fail</span>
      </div>
    );
  }
  return null;
}

export function MotorStatusSection({
  xEncoder,
  yEncoder,
  xDirection,
  yDirection,
  xThresholdMs,
  yThresholdMs,
  xMotorDirection,
  yMotorDirection,
}: MotorStatusSectionProps) {
  // Use xDirection first, fall back to xMotorDirection
  const displayXDirection = xDirection !== undefined && xDirection !== null
    ? xDirection
    : xMotorDirection;
  const displayYDirection = yDirection !== undefined && yDirection !== null
    ? yDirection
    : yMotorDirection;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Motor Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* X-Motor */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">X-Motor</h4>
            {getDirectionBadge(displayXDirection)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Mili Second</span>
              <span className="text-sm font-medium text-gray-900">
                {xEncoder !== null && xEncoder !== undefined ? xEncoder.toLocaleString() : '--'}
              </span>
            </div>
            {xThresholdMs !== null && xThresholdMs !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Threshold</span>
                <span className="text-sm text-gray-600">{xThresholdMs}ms</span>
              </div>
            )}
          </div>
          {getWarning(displayXDirection)}
        </div>

        {/* Y-Motor */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Y-Motor</h4>
            {getDirectionBadge(displayYDirection)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Mili Second</span>
              <span className="text-sm font-medium text-gray-900">
                {yEncoder !== null && yEncoder !== undefined ? yEncoder.toLocaleString() : '--'}
              </span>
            </div>
            {yThresholdMs !== null && yThresholdMs !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Threshold</span>
                <span className="text-sm text-gray-600">{yThresholdMs}ms</span>
              </div>
            )}
          </div>
          {getWarning(displayYDirection)}
        </div>

      </div>
    </div>
  );
}