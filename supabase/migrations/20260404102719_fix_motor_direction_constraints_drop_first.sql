/*
  # Fix Motor Direction Check Constraints - Step 1: Drop and Update

  1. Changes
    - Drop existing check constraints on x_motor_direction and y_motor_direction FIRST
    - Update any non-conforming direction values in existing data
    - Recreate constraints to allow all valid direction values:
      - right
      - left
      - a_sensor_fail
      - b_sensor_fail
      - slipage
      - idle
    
  2. Data Migration
    - Convert 'negative_sensor_fail' to 'a_sensor_fail'
    - Convert 'sensor fail' to 'a_sensor_fail'
    - Ensure all existing data conforms to new constraint values
    
  3. Notes
    - Previous constraints were rejecting valid sensor failure and slippage states
    - These states are critical for ESP32 devices to report motor issues
*/

-- FIRST: Drop existing check constraints (before updating data)
ALTER TABLE sensor_data 
  DROP CONSTRAINT IF EXISTS sensor_data_x_motor_direction_check;

ALTER TABLE sensor_data 
  DROP CONSTRAINT IF EXISTS sensor_data_y_motor_direction_check;

-- SECOND: Update any non-conforming data
-- Convert 'negative_sensor_fail' to 'a_sensor_fail'
UPDATE sensor_data 
SET x_motor_direction = 'a_sensor_fail' 
WHERE x_motor_direction = 'negative_sensor_fail';

UPDATE sensor_data 
SET y_motor_direction = 'a_sensor_fail' 
WHERE y_motor_direction = 'negative_sensor_fail';

-- Convert 'sensor fail' to 'a_sensor_fail'
UPDATE sensor_data 
SET x_motor_direction = 'a_sensor_fail' 
WHERE x_motor_direction = 'sensor fail';

UPDATE sensor_data 
SET y_motor_direction = 'a_sensor_fail' 
WHERE y_motor_direction = 'sensor fail';

-- Update any other non-conforming values to 'idle' as a safe default
UPDATE sensor_data 
SET x_motor_direction = 'idle' 
WHERE x_motor_direction NOT IN ('right', 'left', 'a_sensor_fail', 'b_sensor_fail', 'slipage', 'idle')
  AND x_motor_direction IS NOT NULL;

UPDATE sensor_data 
SET y_motor_direction = 'idle' 
WHERE y_motor_direction NOT IN ('right', 'left', 'a_sensor_fail', 'b_sensor_fail', 'slipage', 'idle')
  AND y_motor_direction IS NOT NULL;

-- THIRD: Recreate constraints with all valid values
ALTER TABLE sensor_data 
  ADD CONSTRAINT sensor_data_x_motor_direction_check 
  CHECK (x_motor_direction IN ('right', 'left', 'a_sensor_fail', 'b_sensor_fail', 'slipage', 'idle'));

ALTER TABLE sensor_data 
  ADD CONSTRAINT sensor_data_y_motor_direction_check 
  CHECK (y_motor_direction IN ('right', 'left', 'a_sensor_fail', 'b_sensor_fail', 'slipage', 'idle'));