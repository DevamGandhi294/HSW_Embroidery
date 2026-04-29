import { ColorConfig } from '../lib/supabase';

/**
 * Detects color index from raw encoder value using dynamic ranges from DB.
 * Ranges are checked in order of color_index (ascending).
 * Returns color index (1–12) or null if no range matches.
 */
export function detectColorFromRaw(
    rawValue: number | null | undefined,
    colorConfigs: ColorConfig[]
): number | null {
    if (rawValue === null || rawValue === undefined) return null;
    if (!colorConfigs || colorConfigs.length === 0) return null;

    // Sort by color_index ascending to check in order
    const sorted = [...colorConfigs].sort((a, b) => a.color_index - b.color_index);

    for (const config of sorted) {
        if (rawValue >= config.min_value && rawValue <= config.max_value) {
            return config.color_index;
        }
    }

    return null; // No range matched
}

/**
 * Returns a label string like "Color 3" or "Unknown"
 */
export function getColorLabel(
    rawValue: number | null | undefined,
    colorConfigs: ColorConfig[]
): string {
    const index = detectColorFromRaw(rawValue, colorConfigs);
    if (index === null) return 'Unknown';
    return `Color ${index}`;
}