/*
  # Fix Data Types for Pitch, Roll, and Vibration Fields

  ## Overview
  This migration changes the data types from integer to numeric (decimal)
  for pitch, roll, and vibration X/Y/Z fields to support decimal values.

  ## Changes
  1. Alter column types in sensor_data table:
    - `pitch` (integer → numeric) - Pitch angle measurement (supports decimals)
    - `roll` (integer → numeric) - Roll angle measurement (supports decimals)
    - `vibration_x` (integer → numeric) - X-axis vibration measurement (supports decimals)
    - `vibration_y` (integer → numeric) - Y-axis vibration measurement (supports decimals)
    - `vibration_z` (integer → numeric) - Z-axis vibration measurement (supports decimals)

  ## Important Notes
  - Uses numeric type to support decimal precision
  - Existing data will be preserved during conversion
  - USING clause handles safe type conversion
*/

-- Convert pitch to numeric
ALTER TABLE sensor_data 
ALTER COLUMN pitch TYPE numeric USING pitch::numeric;

-- Convert roll to numeric
ALTER TABLE sensor_data 
ALTER COLUMN roll TYPE numeric USING roll::numeric;

-- Convert vibration_x to numeric
ALTER TABLE sensor_data 
ALTER COLUMN vibration_x TYPE numeric USING vibration_x::numeric;

-- Convert vibration_y to numeric
ALTER TABLE sensor_data 
ALTER COLUMN vibration_y TYPE numeric USING vibration_y::numeric;

-- Convert vibration_z to numeric
ALTER TABLE sensor_data 
ALTER COLUMN vibration_z TYPE numeric USING vibration_z::numeric;