/*
  # Add Update Frequency and Configuration Settings

  ## Overview
  This migration adds configuration management features including update frequency,
  manufacturing password protection, and online/offline status tracking.

  ## 1. New Columns in machines
  - `update_frequency_seconds` (integer) - How often device sends data (in seconds)
  - `is_online` (boolean) - Whether machine is currently online
  - `last_seen` (timestamptz) - Last time machine sent data
  - `manufacturing_password` (text) - Password hash for config protection

  ## 2. Updated sensor_config
  - Add enabled flag to control which sensors are active

  ## 3. Important Notes
  - Online status determined by comparing last_seen to current time
  - Update frequency sent back to device in API response
  - Manufacturing password required for config changes
  - Default update frequency is 5 seconds
*/

-- Add new columns to machines table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machines' AND column_name = 'update_frequency_seconds'
  ) THEN
    ALTER TABLE machines ADD COLUMN update_frequency_seconds integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machines' AND column_name = 'is_online'
  ) THEN
    ALTER TABLE machines ADD COLUMN is_online boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machines' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE machines ADD COLUMN last_seen timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machines' AND column_name = 'manufacturing_password'
  ) THEN
    ALTER TABLE machines ADD COLUMN manufacturing_password text;
  END IF;
END $$;

-- Add enabled flag to sensor_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_config' AND column_name = 'enabled'
  ) THEN
    ALTER TABLE sensor_config ADD COLUMN enabled boolean DEFAULT true;
  END IF;
END $$;

-- Create function to check machine online status
CREATE OR REPLACE FUNCTION is_machine_online(machine_id_param uuid)
RETURNS boolean AS $$
DECLARE
  last_seen_time timestamptz;
  frequency_seconds integer;
BEGIN
  SELECT last_seen, update_frequency_seconds
  INTO last_seen_time, frequency_seconds
  FROM machines
  WHERE id = machine_id_param;

  IF last_seen_time IS NULL THEN
    RETURN false;
  END IF;

  -- Consider online if last_seen is within 3x the update frequency
  RETURN (now() - last_seen_time) < (frequency_seconds * 3 * interval '1 second');
END;
$$ LANGUAGE plpgsql;

-- Create function to update machine online status
CREATE OR REPLACE FUNCTION update_machine_status()
RETURNS void AS $$
BEGIN
  UPDATE machines
  SET is_online = (
    (now() - last_seen) < (update_frequency_seconds * 3 * interval '1 second')
  )
  WHERE last_seen IS NOT NULL;
END;
$$ LANGUAGE plpgsql;