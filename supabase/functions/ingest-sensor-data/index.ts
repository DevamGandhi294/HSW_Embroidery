import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SensorDataPayload {
  device_id: string;
  firmware_version?: string;
  timestamp?: string;
  frequency?: string;
  surface_level?: number;
  pitch?: number;
  roll?: number;
  surface_x?: number;
  surface_y?: number;
  surface_z?: number;
  vibration?: number;
  vib_magnitude?: number;
  vibration_x?: number;
  vibration_y?: number;
  vibration_z?: number;
  temp_1?: number;
  temp_2?: number;
  temp_3?: number;
  temp_4?: number;
  temp_5?: number;
  temp_6?: number;
  temp_7?: number;
  temp_8?: number;
  main_motor_encoder?: number;
  color_motor_encoder?: number;
  x_motor_encoder?: number;
  y_motor_encoder?: number;
  trimming_back_sensor?: number;
  x_motor_direction?: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle';
  x_position?: string;
  y_motor_direction?: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle';
  y_position?: string;
  x_direction?: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle';
  x_b_threshold_ms?: number;
  y_direction?: 'right' | 'left' | 'a_sensor_fail' | 'b_sensor_fail' | 'slipage' | 'idle';
  y_b_threshold_ms?: number;
  buffer_1?: string;
  buffer_2?: string;
  buffer_3?: string;
  buffer_4?: string;
  buffer_5?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: SensorDataPayload = await req.json();

    if (!payload.device_id) {
      return new Response(
        JSON.stringify({ error: "device_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Check if machine exists, create if not ──────────────────
    const { data: existingMachine, error: machineError } = await supabase
      .from("machines")
      .select("id")
      .eq("device_id", payload.device_id)
      .maybeSingle();

    let machineId: string;

    if (machineError) {
      return new Response(
        JSON.stringify({ error: "Database error", details: machineError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!existingMachine) {
      // Create new machine
      const { data: newMachine, error: createError } = await supabase
        .from("machines")
        .insert({
          device_id: payload.device_id,
          name: `Machine ${payload.device_id}`,
          firmware_version: payload.firmware_version || "0.0.0",
          last_data_received: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createError || !newMachine) {
        return new Response(
          JSON.stringify({ error: "Failed to create machine", details: createError?.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      machineId = newMachine.id;

      // Initialize default sensor configurations
      const defaultSensors = [
        { sensor_key: "surface_level",       display_name: "Surface Level",        unit: "mm"    },
        { sensor_key: "vibration",            display_name: "Vibration",             unit: "Hz"    },
        { sensor_key: "temp_1",              display_name: "Temperature 1",         unit: "°C"    },
        { sensor_key: "temp_2",              display_name: "Temperature 2",         unit: "°C"    },
        { sensor_key: "temp_3",              display_name: "Temperature 3",         unit: "°C"    },
        { sensor_key: "temp_4",              display_name: "Temperature 4",         unit: "°C"    },
        { sensor_key: "temp_5",              display_name: "Temperature 5",         unit: "°C"    },
        { sensor_key: "temp_6",              display_name: "Temperature 6",         unit: "°C"    },
        { sensor_key: "temp_7",              display_name: "Temperature 7",         unit: "°C"    },
        { sensor_key: "temp_8",              display_name: "Temperature 8",         unit: "°C"    },
        { sensor_key: "main_motor_encoder",  display_name: "Main Motor Encoder",    unit: "steps" },
        { sensor_key: "color_motor_encoder", display_name: "Color Motor Encoder",   unit: "steps" },
        { sensor_key: "x_motor_encoder",     display_name: "X Motor Encoder",       unit: "steps" },
        { sensor_key: "y_motor_encoder",     display_name: "Y Motor Encoder",       unit: "steps" },
        { sensor_key: "trimming_back_sensor",display_name: "Trimming Back Sensor",  unit: ""      },
      ];

      await supabase.from("sensor_config").insert(
        defaultSensors.map(sensor => ({ machine_id: machineId, ...sensor }))
      );

      // Initialize default device_settings for new machine
      await supabase.from("device_settings").upsert({
        device_id: payload.device_id,
        x_b_threshold_ms: 2000,
        y_b_threshold_ms: 2000,
        updated_at: new Date().toISOString(),
      });

    } else {
      machineId = existingMachine.id;

      // Update last_data_received, last_seen, and firmware_version
      const updateData: any = {
        last_data_received: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_online: true,
      };

      if (payload.firmware_version) {
        updateData.firmware_version = payload.firmware_version;

        // Check if firmware version matches a pending update
        const { data: pendingUpdate } = await supabase
          .from("firmware_updates")
          .select("id, to_version")
          .eq("machine_id", machineId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingUpdate && pendingUpdate.to_version === payload.firmware_version) {
          await supabase
            .from("firmware_updates")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", pendingUpdate.id);
        }
      }

      await supabase.from("machines").update(updateData).eq("id", machineId);
    }

    // ── Insert sensor data ──────────────────────────────────────
    const sensorData = {
      machine_id: machineId,
      timestamp: payload.timestamp
        ? new Date(payload.timestamp).toISOString()
        : new Date().toISOString(),
      frequency:            payload.frequency,
      surface_level:        payload.surface_level,
      pitch:                payload.pitch,
      roll:                 payload.roll,
      surface_x:            payload.surface_x,
      surface_y:            payload.surface_y,
      surface_z:            payload.surface_z,
      vibration:            payload.vibration,
      vib_magnitude:        payload.vib_magnitude,
      vibration_x:          payload.vibration_x,
      vibration_y:          payload.vibration_y,
      vibration_z:          payload.vibration_z,
      temp_1:               payload.temp_1,
      temp_2:               payload.temp_2,
      temp_3:               payload.temp_3,
      temp_4:               payload.temp_4,
      temp_5:               payload.temp_5,
      temp_6:               payload.temp_6,
      temp_7:               payload.temp_7,
      temp_8:               payload.temp_8,
      main_motor_encoder:   payload.main_motor_encoder,
      color_motor_encoder:  payload.color_motor_encoder,
      x_motor_encoder:      payload.x_motor_encoder,
      y_motor_encoder:      payload.y_motor_encoder,
      trimming_back_sensor: payload.trimming_back_sensor,
      x_motor_direction:    payload.x_motor_direction,
      x_position:           payload.x_position,
      y_motor_direction:    payload.y_motor_direction,
      y_position:           payload.y_position,
      x_direction:          payload.x_direction,
      x_b_threshold_ms:     payload.x_b_threshold_ms,
      y_direction:          payload.y_direction,
      y_b_threshold_ms:     payload.y_b_threshold_ms,
      buffer_1:             payload.buffer_1,
      buffer_2:             payload.buffer_2,
      buffer_3:             payload.buffer_3,
      buffer_4:             payload.buffer_4,
      buffer_5:             payload.buffer_5,
    };

    const { error: insertError } = await supabase
      .from("sensor_data")
      .insert(sensorData);

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to insert sensor data", details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Fetch latest firmware version ───────────────────────────
    const { data: latestUpdate } = await supabase
      .from("firmware_updates")
      .select("to_version")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: machineData } = await supabase
      .from("machines")
      .select("firmware_version, update_frequency_seconds")
      .eq("id", machineId)
      .single();

    const latestFirmwareVersion =
      latestUpdate?.to_version || machineData?.firmware_version || "0.0.0";
    const updateFrequency = machineData?.update_frequency_seconds || 5;

    // ── Fetch device_settings for this device ───────────────────
    // This is the key part — returns x_b_threshold_ms and y_b_threshold_ms
    // back to the ESP32 so it can update itself dynamically
    const { data: deviceSettings } = await supabase
      .from("device_settings")
      .select("x_b_threshold_ms, y_b_threshold_ms")
      .eq("device_id", payload.device_id)
      .maybeSingle();

    const xThreshold = deviceSettings?.x_b_threshold_ms ?? 2000;
    const yThreshold = deviceSettings?.y_b_threshold_ms ?? 2000;

    // ── Return response to ESP32 ────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        message: "Sensor data received successfully",
        machine_id: machineId,
        latest_firmware_version: latestFirmwareVersion,
        update_frequency_seconds: updateFrequency,
        // These two are picked up by ESP32 firmware to update thresholds dynamically
        x_b_threshold_ms: xThreshold,
        y_b_threshold_ms: yThreshold,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});