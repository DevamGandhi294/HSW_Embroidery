/*
  # Add Surface X/Y/Z Fields

  1. Changes
    - Add `surface_x` column to sensor_data table
    - Add `surface_y` column to sensor_data table
    - Add `surface_z` column to sensor_data table
  
  2. Notes
    - These fields complement pitch/roll for surface level measurements
    - All fields are optional and nullable
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'surface_x'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN surface_x integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'surface_y'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN surface_y integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'surface_z'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN surface_z integer;
  END IF;
END $$;