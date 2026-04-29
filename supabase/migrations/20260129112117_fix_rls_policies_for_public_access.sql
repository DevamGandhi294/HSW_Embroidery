/*
  # Fix RLS Policies for Public Access

  ## Overview
  This migration updates RLS policies to allow public (unauthenticated) access
  for updating sensor configurations, machines, and firmware updates. This is
  necessary for the dashboard to work without authentication.

  ## Changes
  1. Drop existing restrictive policies
  2. Create new public-friendly policies for UPDATE operations
  
  ## Security Note
  This dashboard is designed for internal use on embroidery machines.
  For production deployments with external access, consider implementing
  authentication and more restrictive policies.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can update machines" ON machines;
DROP POLICY IF EXISTS "Authenticated users can insert sensor_config" ON sensor_config;
DROP POLICY IF EXISTS "Authenticated users can update sensor_config" ON sensor_config;
DROP POLICY IF EXISTS "Authenticated users can insert firmware_updates" ON firmware_updates;
DROP POLICY IF EXISTS "Authenticated users can update firmware_updates" ON firmware_updates;

-- Create public-friendly policies for machines
CREATE POLICY "Allow public insert to machines"
  ON machines FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to machines"
  ON machines FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create public-friendly policies for sensor_config
CREATE POLICY "Allow public insert to sensor_config"
  ON sensor_config FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to sensor_config"
  ON sensor_config FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create public-friendly policies for firmware_updates
CREATE POLICY "Allow public insert to firmware_updates"
  ON firmware_updates FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to firmware_updates"
  ON firmware_updates FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
