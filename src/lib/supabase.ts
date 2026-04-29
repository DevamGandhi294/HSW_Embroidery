import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Machine {
  id: string;
  device_id: string;
  name: string;
  location: string;
  firmware_version: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_data_received: string | null;
  update_frequency_seconds: number;
  is_online: boolean;
  last_seen: string | null;
  manufacturing_password: string | null;
  created_at: string;
  updated_at: string;
}

export interface SensorConfig {
  id: string;
  machine_id: string;
  sensor_key: string;
  display_name: string;
  unit: string;
  min_threshold: number | null;
  max_threshold: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SensorData {
  id: string;
  machine_id: string;
  timestamp: string;
  surface_level: number | null;
  vibration: number | null;
  pitch: number | null;
  roll: number | null;
  vibration_x: number | null;
  vibration_y: number | null;
  vibration_z: number | null;
  temp_1: number | null;
  temp_2: number | null;
  temp_3: number | null;
  temp_4: number | null;
  temp_5: number | null;
  temp_6: number | null;
  temp_7: number | null;
  temp_8: number | null;
  main_motor_encoder: number | null;
  color_motor_encoder: number | null;
  x_motor_encoder: number | null;
  y_motor_encoder: number | null;
  trimming_back_sensor: number | null;
  x_motor_direction: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle' | null;
  y_motor_direction: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle' | null;
  x_direction: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle' | null;
  x_b_threshold_ms: number | null;
  y_direction: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle' | null;
  y_b_threshold_ms: number | null;
  buffer_1: string | null;
  buffer_2: string | null;
  buffer_3: string | null;
  buffer_4: string | null;
  buffer_5: string | null;
  created_at: string;
}

export interface FirmwareUpdate {
  id: string;
  machine_id: string;
  from_version: string;
  to_version: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  initiated_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface BufferConfig {
  id: string;
  machine_id: string;
  buffer_key: 'buffer_1' | 'buffer_2' | 'buffer_3' | 'buffer_4' | 'buffer_5';
  display_name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceSettings {
  device_id: string;
  x_b_threshold_ms: number;
  y_b_threshold_ms: number;
  created_at: string;
  updated_at: string;
}

export interface ColorConfig {
  id: string;
  machine_id: string;
  color_index: number;
  min_value: number;
  max_value: number;
  created_at: string;
  updated_at: string;
}
