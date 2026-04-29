/*
  # Add 'idle' to Motor Direction Constraints

  ## Overview
  This migration updates the check constraints for x_motor_direction and y_motor_direction
  to include 'idle' as a valid value.

  ## Changes
  1. Drop existing constraints
  2. Add new constraints with 'idle' value included

  ## Allowed Values
  - 'right'
  - 'left'
  - 'negative_sensor_fail'
  - 'positive_sensor_fail'
  - 'idle' (new)

  ## Important Notes
  - Preserves all existing valid values
  - Uses IF EXISTS to safely drop constraints
*/

-- Drop existing constraints if they exist
ALTER TABLE sensor_data 
DROP CONSTRAINT IF EXISTS sensor_data_x_motor_direction_check;

ALTER TABLE sensor_data 
DROP CONSTRAINT IF EXISTS sensor_data_y_motor_direction_check;

-- Add new constraints with 'idle' included
ALTER TABLE sensor_data 
ADD CONSTRAINT sensor_data_x_motor_direction_check 
CHECK (x_motor_direction = ANY (ARRAY['right'::text, 'left'::text, 'negative_sensor_fail'::text, 'positive_sensor_fail'::text, 'idle'::text]));

ALTER TABLE sensor_data 
ADD CONSTRAINT sensor_data_y_motor_direction_check 
CHECK (y_motor_direction = ANY (ARRAY['right'::text, 'left'::text, 'negative_sensor_fail'::text, 'positive_sensor_fail'::text, 'idle'::text]));