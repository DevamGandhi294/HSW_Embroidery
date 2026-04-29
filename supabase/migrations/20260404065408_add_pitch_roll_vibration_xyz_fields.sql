/*
  # Add Pitch, Roll, and Vibration X/Y/Z Fields

  ## Overview
  This migration adds separate fields for surface level pitch and roll,
  and vibration X, Y, Z components to the sensor_data table.

  ## Changes
  1. Add new columns to sensor_data table:
    - `pitch` (integer) - Pitch angle measurement
    - `roll` (integer) - Roll angle measurement
    - `vibration_x` (integer) - X-axis vibration measurement
    - `vibration_y` (integer) - Y-axis vibration measurement
    - `vibration_z` (integer) - Z-axis vibration measurement

  ## Important Notes
  - Uses DO block to check if columns exist before adding
  - All new fields are integer type as specified
  - Existing surface_level and vibration fields remain unchanged
*/

DO $$
BEGIN
  -- Add pitch column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'pitch'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN pitch integer;
  END IF;

  -- Add roll column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'roll'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN roll integer;
  END IF;

  -- Add vibration_x column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'vibration_x'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN vibration_x integer;
  END IF;

  -- Add vibration_y column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'vibration_y'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN vibration_y integer;
  END IF;

  -- Add vibration_z column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'vibration_z'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN vibration_z integer;
  END IF;
END $$;