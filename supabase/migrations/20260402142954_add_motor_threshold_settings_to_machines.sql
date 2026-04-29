/*
  # Add Motor Threshold Settings to Machines Table

  ## Overview
  This migration adds motor threshold configuration fields to the machines table.
  These values can be set by web users and will be used as defaults when devices send data.

  ## 1. New Columns in machines
  - `x_b_threshold_ms` (integer) - Default X motor threshold in milliseconds
  - `y_b_threshold_ms` (integer) - Default Y motor threshold in milliseconds

  ## 2. Important Notes
  - Thresholds are stored at the machine level for configuration
  - Default value is 0 milliseconds
  - Web users can modify these values through the Device Configuration page
*/

-- Add threshold columns to machines table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machines' AND column_name = 'x_b_threshold_ms'
  ) THEN
    ALTER TABLE machines ADD COLUMN x_b_threshold_ms integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machines' AND column_name = 'y_b_threshold_ms'
  ) THEN
    ALTER TABLE machines ADD COLUMN y_b_threshold_ms integer DEFAULT 0;
  END IF;
END $$;