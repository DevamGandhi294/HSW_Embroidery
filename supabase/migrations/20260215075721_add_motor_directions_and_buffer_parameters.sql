/*
  # Add Motor Directions and Buffer Parameters

  ## Overview
  This migration adds motor direction tracking and 5 customizable buffer parameters
  to the sensor data collection system.

  ## 1. New Columns in sensor_data
  - `x_motor_direction` (text) - X-axis motor direction with values: 'right', 'left', 'sensor fail'
  - `y_motor_direction` (text) - Y-axis motor direction with values: 'right', 'left', 'sensor fail'
  - `buffer_1` (text) - First buffer parameter (customizable string value)
  - `buffer_2` (text) - Second buffer parameter (customizable string value)
  - `buffer_3` (text) - Third buffer parameter (customizable string value)
  - `buffer_4` (text) - Fourth buffer parameter (customizable string value)
  - `buffer_5` (text) - Fifth buffer parameter (customizable string value)

  ## 2. New Table: buffer_config
  Stores custom naming for buffer parameters per machine
  - `id` (uuid, primary key) - Unique identifier
  - `machine_id` (uuid, foreign key) - Reference to machines table
  - `buffer_key` (text) - Buffer identifier (buffer_1 through buffer_5)
  - `display_name` (text) - User-customizable display name for the buffer
  - `description` (text) - Optional description of what the buffer represents
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## 3. Security
  - Enable RLS on buffer_config table
  - Add policies for public read access and authenticated user write access

  ## 4. Important Notes
  - Motor directions use CHECK constraints to ensure only valid values ('right', 'left', 'sensor fail')
  - Buffer parameters are text fields allowing any string value
  - Buffer config table allows users to customize buffer parameter names
*/

-- Add motor direction columns to sensor_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'x_motor_direction'
  ) THEN
    ALTER TABLE sensor_data 
    ADD COLUMN x_motor_direction text 
    CHECK (x_motor_direction IN ('right', 'left', 'sensor fail'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'y_motor_direction'
  ) THEN
    ALTER TABLE sensor_data 
    ADD COLUMN y_motor_direction text 
    CHECK (y_motor_direction IN ('right', 'left', 'sensor fail'));
  END IF;
END $$;

-- Add buffer parameter columns to sensor_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'buffer_1'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN buffer_1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'buffer_2'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN buffer_2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'buffer_3'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN buffer_3 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'buffer_4'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN buffer_4 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'buffer_5'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN buffer_5 text;
  END IF;
END $$;

-- Create buffer_config table
CREATE TABLE IF NOT EXISTS buffer_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  buffer_key text NOT NULL CHECK (buffer_key IN ('buffer_1', 'buffer_2', 'buffer_3', 'buffer_4', 'buffer_5')),
  display_name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(machine_id, buffer_key)
);

-- Create index for buffer_config
CREATE INDEX IF NOT EXISTS idx_buffer_config_machine_id ON buffer_config(machine_id);

-- Enable Row Level Security on buffer_config
ALTER TABLE buffer_config ENABLE ROW LEVEL SECURITY;

-- Policies for buffer_config table
CREATE POLICY "Allow public read access to buffer_config"
  ON buffer_config FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert buffer_config"
  ON buffer_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update buffer_config"
  ON buffer_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to automatically update updated_at for buffer_config
CREATE TRIGGER update_buffer_config_updated_at
  BEFORE UPDATE ON buffer_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();