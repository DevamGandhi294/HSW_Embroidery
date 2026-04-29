import { Machine, FirmwareUpdate, supabase } from '../lib/supabase';
import { Upload, CheckCircle, XCircle, Loader2, Package } from 'lucide-react';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface FirmwareControlProps {
  machine: Machine;
  onFirmwareUpdate: () => void;
}

export interface FirmwareControlRef {
  fetchRecentUpdates: () => Promise<void>;
}

export const FirmwareControl = forwardRef<FirmwareControlRef, FirmwareControlProps>(
  ({ machine, onFirmwareUpdate }, ref) => {
  const [newVersion, setNewVersion] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<FirmwareUpdate[]>([]);

  const fetchRecentUpdates = async () => {
    const { data } = await supabase
      .from('firmware_updates')
      .select('*')
      .eq('machine_id', machine.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) {
      setRecentUpdates(data);
    }
  };

  useEffect(() => {
    fetchRecentUpdates();
  }, [machine.id]);

  useImperativeHandle(ref, () => ({
    fetchRecentUpdates,
  }));

  const handleUpdate = async () => {
    if (!newVersion.trim()) return;

    setIsUpdating(true);

    try {
      const { error } = await supabase.from('firmware_updates').insert({
        machine_id: machine.id,
        from_version: machine.firmware_version,
        to_version: newVersion,
        status: 'pending',
        started_at: new Date().toISOString(),
      });

      if (error) throw error;

      setNewVersion('');
      onFirmwareUpdate();
      fetchRecentUpdates();
    } catch (error) {
      console.error('Failed to initiate firmware update:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Loader2 className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-blue-600" />
        Firmware Control
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Version
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-mono text-sm">
            {machine.firmware_version}
          </div>
        </div>

        <div>
          <label htmlFor="new-version" className="block text-sm font-medium text-gray-700 mb-1">
            New Version
          </label>
          <input
            id="new-version"
            type="text"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            placeholder="e.g., 1.2.3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-2"
          />
          <button
            onClick={handleUpdate}
            disabled={isUpdating || !newVersion.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Updating</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span className="text-sm">Update</span>
              </>
            )}
          </button>
        </div>

        {recentUpdates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Updates</h3>
            <div className="space-y-2">
              {recentUpdates.map((update) => (
                <div
                  key={update.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(update.status)}
                    <div>
                      <p className="text-sm text-gray-900">
                        {update.from_version} → {update.to_version}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(update.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      update.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : update.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : update.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {update.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
