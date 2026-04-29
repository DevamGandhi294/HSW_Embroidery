import { Machine, SensorData, SensorConfig } from '../lib/supabase';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

interface MachineListViewProps {
  machines: Machine[];
  latestDataMap: Map<string, SensorData>;
  sensorConfigsMap: Map<string, SensorConfig[]>;
  onViewData: (machine: Machine) => void;
  onViewConfig: (machine: Machine) => void;
}

export function MachineListView({
  machines,
  latestDataMap,
  sensorConfigsMap,
  onViewData,
  onViewConfig
}: MachineListViewProps) {
  const getIssuesCount = (machineId: string): number => {
    const latestData = latestDataMap.get(machineId);
    const sensorConfigs = sensorConfigsMap.get(machineId) || [];

    if (!latestData) return 0;

    let issuesCount = 0;

    sensorConfigs.forEach(config => {
      if (!config.enabled) return;

      const value = (latestData as any)[config.sensor_key];
      if (value === null || value === undefined) return;

      const hasMinAlert = config.min_threshold !== null && value < config.min_threshold;
      const hasMaxAlert = config.max_threshold !== null && value > config.max_threshold;

      if (hasMinAlert || hasMaxAlert) {
        issuesCount++;
      }
    });

    if (latestData.x_motor_direction === 'sensor fail') issuesCount++;
    if (latestData.y_motor_direction === 'sensor fail') issuesCount++;

    return issuesCount;
  };

  const getStatusBadge = (machine: Machine) => {
    if (machine.is_online) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Online</span>
        </div>
      );
    } else {
      const offlineSince = machine.last_seen
        ? formatDistanceToNow(machine.last_seen)
        : 'Unknown';

      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Offline</span>
          </div>
          <span className="text-xs text-gray-500 ml-7">Since {offlineSince}</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Machine Overview</h2>

      <div className="grid grid-cols-1 gap-4">
        {machines.map(machine => {
          const issuesCount = getIssuesCount(machine.id);

          return (
            <div
              key={machine.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{machine.name}</h3>
                    {issuesCount > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">{issuesCount} Issue{issuesCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      {getStatusBadge(machine)}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Device ID</p>
                      <p className="text-sm font-medium text-gray-900">{machine.device_id}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Firmware</p>
                      <p className="text-sm font-medium text-gray-900">{machine.firmware_version}</p>
                    </div>
                  </div>

                  {issuesCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800 font-medium">Active Issues Detected</p>
                      <p className="text-xs text-red-600 mt-1">
                        {issuesCount} sensor{issuesCount > 1 ? 's' : ''} reporting values outside threshold limits
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => onViewData(machine)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Data
                </button>

                <button
                  onClick={() => onViewConfig(machine)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Configuration
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {machines.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No machines found. Machines will appear once they send data.</p>
        </div>
      )}
    </div>
  );
}
