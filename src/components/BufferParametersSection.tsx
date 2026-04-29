import { BufferConfig } from '../lib/supabase';

interface BufferParametersSectionProps {
  bufferConfigs: BufferConfig[];
  bufferValues: {
    buffer_1: string | null;
    buffer_2: string | null;
    buffer_3: string | null;
    buffer_4: string | null;
    buffer_5: string | null;
  };
}

export function BufferParametersSection({ bufferConfigs, bufferValues }: BufferParametersSectionProps) {
  const getBufferDisplayName = (bufferKey: string): string => {
    const config = bufferConfigs.find(c => c.buffer_key === bufferKey);
    return config?.display_name || bufferKey.replace('_', ' ').toUpperCase();
  };

  const isHigh = (value: string): boolean => {
    return value.toLowerCase() === 'high' || value === '1';
  };

  const hasAnyValue = [bufferValues.buffer_1, bufferValues.buffer_2, bufferValues.buffer_3, bufferValues.buffer_4].some(v => v !== null);

  if (!hasAnyValue) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor Status</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Motor</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                {getBufferDisplayName('Positive +')}
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                {getBufferDisplayName('Negative -')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="py-3 px-4 text-sm font-medium text-gray-900">X Motor</td>
              <td className="py-3 px-4">
                <div className="flex justify-center">
                  {bufferValues.buffer_1 !== null ? (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isHigh(bufferValues.buffer_1)
                          ? 'bg-green-500 border-green-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {isHigh(bufferValues.buffer_1) && (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-center">
                  {bufferValues.buffer_2 !== null ? (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isHigh(bufferValues.buffer_2)
                          ? 'bg-green-500 border-green-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {isHigh(bufferValues.buffer_2) && (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </div>
              </td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-3 px-4 text-sm font-medium text-gray-900">Y Motor</td>
              <td className="py-3 px-4">
                <div className="flex justify-center">
                  {bufferValues.buffer_3 !== null ? (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isHigh(bufferValues.buffer_3)
                          ? 'bg-green-500 border-green-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {isHigh(bufferValues.buffer_3) && (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-center">
                  {bufferValues.buffer_4 !== null ? (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isHigh(bufferValues.buffer_4)
                          ? 'bg-green-500 border-green-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {isHigh(bufferValues.buffer_4) && (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
