/*
  # Add Frequency, Vibration Magnitude, and Position Fields

  1. New Fields Added to sensor_data table
    - `frequency` (text): Update frequency from device
    - `vib_magnitude` (numeric): Vibration magnitude measurement
    - `x_position` (text): X-axis position status (at_a, at_b, between, unknown)
    - `y_position` (text): Y-axis position status (at_a, at_b, between, unknown)
  
  2. Notes
    - frequency is stored as text to preserve exact format from device
    - vib_magnitude complements the existing vibration field
    - position fields track motor position states
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN frequency text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'vib_magnitude'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN vib_magnitude numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'x_position'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN x_position text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'y_position'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN y_position text;
  END IF;
END $$;