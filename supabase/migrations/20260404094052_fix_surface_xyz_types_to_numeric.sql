/*
  # Fix Data Types for Surface X/Y/Z Fields

  ## Overview
  This migration changes the data types from integer to numeric (decimal)
  for surface X/Y/Z fields to support decimal values.

  ## Changes
  1. Alter column types in sensor_data table:
    - `surface_x` (integer → numeric) - X-axis surface measurement (supports decimals)
    - `surface_y` (integer → numeric) - Y-axis surface measurement (supports decimals)
    - `surface_z` (integer → numeric) - Z-axis surface measurement (supports decimals)

  ## Important Notes
  - Uses numeric type to support decimal precision
  - Existing data will be preserved during conversion
  - USING clause handles safe type conversion
*/

-- Convert surface_x to numeric
ALTER TABLE sensor_data 
ALTER COLUMN surface_x TYPE numeric USING surface_x::numeric;

-- Convert surface_y to numeric
ALTER TABLE sensor_data 
ALTER COLUMN surface_y TYPE numeric USING surface_y::numeric;

-- Convert surface_z to numeric
ALTER TABLE sensor_data 
ALTER COLUMN surface_z TYPE numeric USING surface_z::numeric;