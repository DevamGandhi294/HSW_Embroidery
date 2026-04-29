/*
  # Add color_config table for color motor mapping

  1. New Tables
    - `color_config`
      - `id` (uuid, primary key)
      - `machine_id` (uuid, foreign key to machines)
      - `color_index` (integer, 1-12) - The color number
      - `min_value` (integer) - Minimum encoder value for this color
      - `max_value` (integer) - Maximum encoder value for this color
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `color_config` table
    - Add policies for public read access (matches existing pattern)
*/

-- Create color_config table
CREATE TABLE IF NOT EXISTS color_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  color_index integer NOT NULL CHECK (color_index >= 1 AND color_index <= 12),
  min_value integer NOT NULL CHECK (min_value >= 0 AND min_value <= 4096),
  max_value integer NOT NULL CHECK (max_value >= 0 AND max_value <= 4096),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(machine_id, color_index),
  CHECK (min_value <= max_value)
);

-- Enable RLS
ALTER TABLE color_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Allow public read access to color_config"
  ON color_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to color_config"
  ON color_config
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to color_config"
  ON color_config
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to color_config"
  ON color_config
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_color_config_machine_id ON color_config(machine_id);
