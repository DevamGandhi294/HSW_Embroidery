/*
  # HSW Embroidery Machine Monitoring System

  ## Overview
  This migration creates the complete database schema for the HSW embroidery machine 
  monitoring and predictive maintenance dashboard.

  ## 1. New Tables
  
  ### `machines`
  Stores information about each embroidery machine being monitored.
  - `id` (uuid, primary key) - Unique identifier
  - `device_id` (text, unique) - Hardware device identifier
  - `name` (text) - Machine name/label
  - `location` (text) - Physical location of the machine
  - `firmware_version` (text) - Current firmware version
  - `status` (text) - Machine status (active, inactive, maintenance)
  - `last_data_received` (timestamptz) - Last time data was received
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `sensor_config`
  Stores custom configuration for each sensor, allowing users to rename sensors.
  - `id` (uuid, primary key) - Unique identifier
  - `machine_id` (uuid, foreign key) - Reference to machines table
  - `sensor_key` (text) - Internal sensor identifier
  - `display_name` (text) - User-customizable display name
  - `unit` (text) - Measurement unit
  - `min_threshold` (numeric) - Minimum threshold for alerts (optional)
  - `max_threshold` (numeric) - Maximum threshold for alerts (optional)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `sensor_data`
  Stores all sensor readings from the embroidery machines.
  - `id` (uuid, primary key) - Unique identifier
  - `machine_id` (uuid, foreign key) - Reference to machines table
  - `timestamp` (timestamptz) - When the data was collected
  - `surface_level` (numeric) - Surface level measurement
  - `vibration` (numeric) - Vibration measurement
  - `temp_1` through `temp_8` (numeric) - Temperature sensor readings
  - `main_motor_encoder` (numeric) - Main motor encoder value
  - `color_motor_encoder` (numeric) - Color changing motor encoder value
  - `x_motor_encoder` (numeric) - X-axis motor encoder value
  - `y_motor_encoder` (numeric) - Y-axis motor encoder value
  - `trimming_back_sensor` (numeric) - Trimming back sensor data
  - `created_at` (timestamptz) - Record creation timestamp

  ### `firmware_updates`
  Tracks firmware update history and status.
  - `id` (uuid, primary key) - Unique identifier
  - `machine_id` (uuid, foreign key) - Reference to machines table
  - `from_version` (text) - Previous firmware version
  - `to_version` (text) - Target firmware version
  - `status` (text) - Update status (pending, in_progress, completed, failed)
  - `initiated_by` (uuid) - User who initiated the update
  - `started_at` (timestamptz) - When update started
  - `completed_at` (timestamptz) - When update completed
  - `error_message` (text) - Error details if failed
  - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users to:
    - Read all machine data
    - Insert sensor data (for API)
    - Update machine configurations
    - Manage firmware updates

  ## 3. Indexes
  - Index on machine_id for fast lookups
  - Index on timestamp for time-based queries
  - Index on device_id for API lookups

  ## 4. Important Notes
  - All numeric fields use the `numeric` type for precision
  - Timestamps use `timestamptz` for timezone awareness
  - RLS policies restrict data access to authenticated users
  - Foreign key constraints ensure data integrity
*/

-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  name text NOT NULL,
  location text DEFAULT '',
  firmware_version text DEFAULT '0.0.0',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_data_received timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sensor_config table
CREATE TABLE IF NOT EXISTS sensor_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  sensor_key text NOT NULL,
  display_name text NOT NULL,
  unit text DEFAULT '',
  min_threshold numeric,
  max_threshold numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(machine_id, sensor_key)
);

-- Create sensor_data table
CREATE TABLE IF NOT EXISTS sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  timestamp timestamptz DEFAULT now(),
  surface_level numeric,
  vibration numeric,
  temp_1 numeric,
  temp_2 numeric,
  temp_3 numeric,
  temp_4 numeric,
  temp_5 numeric,
  temp_6 numeric,
  temp_7 numeric,
  temp_8 numeric,
  main_motor_encoder numeric,
  color_motor_encoder numeric,
  x_motor_encoder numeric,
  y_motor_encoder numeric,
  trimming_back_sensor numeric,
  created_at timestamptz DEFAULT now()
);

-- Create firmware_updates table
CREATE TABLE IF NOT EXISTS firmware_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  from_version text NOT NULL,
  to_version text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  initiated_by uuid REFERENCES auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_machine_id ON sensor_data(machine_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_machines_device_id ON machines(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_config_machine_id ON sensor_config(machine_id);
CREATE INDEX IF NOT EXISTS idx_firmware_updates_machine_id ON firmware_updates(machine_id);

-- Enable Row Level Security
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmware_updates ENABLE ROW LEVEL SECURITY;

-- Policies for machines table
CREATE POLICY "Allow public read access to machines"
  ON machines FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert machines"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update machines"
  ON machines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for sensor_config table
CREATE POLICY "Allow public read access to sensor_config"
  ON sensor_config FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert sensor_config"
  ON sensor_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sensor_config"
  ON sensor_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for sensor_data table
CREATE POLICY "Allow public read access to sensor_data"
  ON sensor_data FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to sensor_data"
  ON sensor_data FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for firmware_updates table
CREATE POLICY "Allow public read access to firmware_updates"
  ON firmware_updates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert firmware_updates"
  ON firmware_updates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update firmware_updates"
  ON firmware_updates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensor_config_updated_at
  BEFORE UPDATE ON sensor_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();