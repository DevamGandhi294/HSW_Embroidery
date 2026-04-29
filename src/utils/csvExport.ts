import { SensorData, SensorConfig } from '../lib/supabase';
import { formatDateTime } from './dateUtils';

export function exportToCSV(
  data: SensorData[],
  sensorConfigs: SensorConfig[],
  machineName: string
): void {
  if (data.length === 0) {
    alert('No data available to export');
    return;
  }

  const enabledConfigs = sensorConfigs.filter(c => c.enabled);

  const headers = [
    'Timestamp',
    ...enabledConfigs.map(c => c.display_name),
    'X Motor Direction',
    'Y Motor Direction',
    'Buffer 1',
    'Buffer 2',
    'Buffer 3',
    'Buffer 4',
    'Buffer 5'
  ];

  const rows = data.map(row => {
    const values = [
      formatDateTime(row.timestamp),
      ...enabledConfigs.map(config => {
        const value = (row as any)[config.sensor_key];
        return value !== null ? value.toString() : '';
      }),
      row.x_motor_direction || '',
      row.y_motor_direction || '',
      row.buffer_1 || '',
      row.buffer_2 || '',
      row.buffer_3 || '',
      row.buffer_4 || '',
      row.buffer_5 || ''
    ];

    return values.map(escapeCSVValue).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `${machineName.replace(/\s+/g, '_')}_${timestamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
