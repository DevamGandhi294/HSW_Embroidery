/*
  # Add Motor Thresholds and Update Direction Types

  ## Overview
  This migration adds motor threshold fields and updates motor direction enum values.

  ## 1. New Columns in sensor_data
  - `x_b_threshold_ms` (integer) - X motor threshold in milliseconds
  - `y_b_threshold_ms` (integer) - Y motor threshold in milliseconds

  ## 2. Updated Motor Direction Types
  - Changed from: 'right' | 'left' | 'sensor fail'
  - Changed to: 'right' | 'left' | 'negative_sensor_fail' | 'positive_sensor_fail'

  ## 3. Important Notes
  - Thresholds are stored with each sensor data record
  - Motor direction enum expanded to distinguish between negative and positive sensor failures
  - Default threshold value is 0
*/

-- Add threshold columns to sensor_data table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'x_b_threshold_ms'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN x_b_threshold_ms integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'y_b_threshold_ms'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN y_b_threshold_ms integer DEFAULT 0;
  END IF;
END $$;

-- Drop old check constraints if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sensor_data_x_motor_direction_check'
  ) THEN
    ALTER TABLE sensor_data DROP CONSTRAINT sensor_data_x_motor_direction_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sensor_data_y_motor_direction_check'
  ) THEN
    ALTER TABLE sensor_data DROP CONSTRAINT sensor_data_y_motor_direction_check;
  END IF;
END $$;

-- Update existing 'sensor fail' values to 'negative_sensor_fail' for backward compatibility
UPDATE sensor_data
SET x_motor_direction = 'negative_sensor_fail'
WHERE x_motor_direction = 'sensor fail';

UPDATE sensor_data
SET y_motor_direction = 'negative_sensor_fail'
WHERE y_motor_direction = 'sensor fail';

-- Add new check constraints with updated enum values
ALTER TABLE sensor_data
ADD CONSTRAINT sensor_data_x_motor_direction_check
CHECK (x_motor_direction IN ('right', 'left', 'negative_sensor_fail', 'positive_sensor_fail'));

ALTER TABLE sensor_data
ADD CONSTRAINT sensor_data_y_motor_direction_check
CHECK (y_motor_direction IN ('right', 'left', 'negative_sensor_fail', 'positive_sensor_fail'));