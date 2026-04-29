import { useState, useEffect } from 'react';
import { supabase, Machine, SensorData, SensorConfig } from './lib/supabase';
import { MachineListView } from './components/MachineListView';
import { MachineDataView } from './components/MachineDataView';
import { DeviceConfigPage } from './components/DeviceConfigPage';
import { RefreshCw, Gauge } from 'lucide-react';

type View = 'list' | 'data' | 'config';

function App() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latestDataMap, setLatestDataMap] = useState<Map<string, SensorData>>(new Map());
  const [sensorConfigsMap, setSensorConfigsMap] = useState<Map<string, SensorConfig[]>>(new Map());

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(() => {
      updateMachineStatuses();
    }, 10000);

    const machineChannel = supabase
      .channel('machines-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machines',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMachines((prev) => [payload.new as Machine, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedMachine = payload.new as Machine;
            setMachines((prev) =>
              prev.map((m) => (m.id === updatedMachine.id ? updatedMachine : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMachines((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(machineChannel);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (machines.length > 0) {
      fetchAllLatestData();
      fetchAllSensorConfigs();
    }
  }, [machines.length]);

  const fetchMachines = async () => {
    const { data } = await supabase
      .from('machines')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setMachines(data);
    }
  };

  const updateMachineStatuses = async () => {
    await supabase.rpc('update_machine_status');
    fetchMachines();
  };

  const fetchAllLatestData = async () => {
    const dataMap = new Map<string, SensorData>();

    for (const machine of machines) {
      const { data } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('machine_id', machine.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        dataMap.set(machine.id, data);
      }
    }

    setLatestDataMap(dataMap);
  };

  const fetchAllSensorConfigs = async () => {
    const configsMap = new Map<string, SensorConfig[]>();

    for (const machine of machines) {
      const { data } = await supabase
        .from('sensor_config')
        .select('*')
        .eq('machine_id', machine.id);

      if (data) {
        configsMap.set(machine.id, data);
      }
    }

    setSensorConfigsMap(configsMap);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchMachines(),
      updateMachineStatuses(),
      fetchAllLatestData(),
      fetchAllSensorConfigs()
    ]);
    setIsRefreshing(false);
  };

  const handleViewData = (machine: Machine) => {
    setSelectedMachine(machine);
    setCurrentView('data');
  };

  const handleViewConfig = (machine: Machine) => {
    setSelectedMachine(machine);
    setCurrentView('config');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedMachine(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gauge className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HSW Machine Monitor</h1>
                <p className="text-sm text-gray-500">Real-time Machine Monitoring Dashboard</p>
              </div>
            </div>

            {currentView === 'list' && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentView === 'list' && (
          <MachineListView
            machines={machines}
            latestDataMap={latestDataMap}
            sensorConfigsMap={sensorConfigsMap}
            onViewData={handleViewData}
            onViewConfig={handleViewConfig}
          />
        )}

        {currentView === 'data' && selectedMachine && (
          <MachineDataView
            machine={selectedMachine}
            onBack={handleBackToList}
          />
        )}

        {currentView === 'config' && selectedMachine && (
          <DeviceConfigPage
            machine={selectedMachine}
            onBack={handleBackToList}
          />
        )}
      </main>
    </div>
  );
}

export default App;
