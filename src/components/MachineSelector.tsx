import { Machine } from '../lib/supabase';
import { Activity, MapPin } from 'lucide-react';

interface MachineSelectorProps {
  machines: Machine[];
  selectedMachine: Machine | null;
  onSelectMachine: (machine: Machine) => void;
}

export function MachineSelector({ machines, selectedMachine, onSelectMachine }: MachineSelectorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        Machines
      </h2>
      <div className="space-y-2">
        {machines.length === 0 ? (
          <p className="text-gray-500 text-sm">No machines registered yet</p>
        ) : (
          machines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => onSelectMachine(machine)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedMachine?.id === machine.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{machine.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {machine.location || 'No location set'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">ID: {machine.device_id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                      machine.status
                    )}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    {getStatusText(machine.status)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
