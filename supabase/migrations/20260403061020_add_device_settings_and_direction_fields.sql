/*
  # Add device_settings table and direction fields to sensor_data

  1. New Tables
    - `device_settings`
      - `device_id` (text, primary key) - Unique identifier for the device
      - `x_b_threshold_ms` (integer, default 2000) - X-axis B sensor timeout threshold in milliseconds
      - `y_b_threshold_ms` (integer, default 2000) - Y-axis B sensor timeout threshold in milliseconds
      - `created_at` (timestamptz) - Timestamp when settings were created
      - `updated_at` (timestamptz) - Timestamp when settings were last updated

  2. Changes to `sensor_data` table
    - Add `x_direction` (text) - X-axis motor direction: right, left, a_sensor_fail, b_sensor_fail, or idle
    - Add `x_b_threshold_ms` (integer) - X-axis B sensor threshold value at time of reading
    - Add `y_direction` (text) - Y-axis motor direction: right, left, a_sensor_fail, b_sensor_fail, or idle
    - Add `y_b_threshold_ms` (integer) - Y-axis B sensor threshold value at time of reading

  3. Security
    - Enable RLS on `device_settings` table
    - Add policies for public read and insert/update access to device_settings
*/

-- Create device_settings table
CREATE TABLE IF NOT EXISTS device_settings (
  device_id text PRIMARY KEY,
  x_b_threshold_ms integer DEFAULT 2000 NOT NULL,
  y_b_threshold_ms integer DEFAULT 2000 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add new columns to sensor_data table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'x_direction'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN x_direction text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'x_b_threshold_ms'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN x_b_threshold_ms integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'y_direction'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN y_direction text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'y_b_threshold_ms'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN y_b_threshold_ms integer;
  END IF;
END $$;

-- Enable RLS on device_settings
ALTER TABLE device_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to device_settings
CREATE POLICY "Public read access to device_settings"
  ON device_settings FOR SELECT
  TO anon
  USING (true);

-- Allow public insert access to device_settings
CREATE POLICY "Public insert access to device_settings"
  ON device_settings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public update access to device_settings
CREATE POLICY "Public update access to device_settings"
  ON device_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);