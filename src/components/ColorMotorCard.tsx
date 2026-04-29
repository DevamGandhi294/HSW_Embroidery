import { ColorConfig } from '../lib/supabase';
import { detectColorFromRaw } from '../utils/colorutils';

interface ColorMotorCardProps {
  rawValue: number | null | undefined;
  colorConfigs: ColorConfig[];
}

// Fixed color palette for visual display per color index
const COLOR_PALETTE: Record<number, { bg: string; text: string; dot: string }> = {
  1: { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500' },
  2: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  3: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  4: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  5: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  6: { bg: 'bg-lime-100', text: 'text-lime-800', dot: 'bg-lime-500' },
  7: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  8: { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  9: { bg: 'bg-cyan-100', text: 'text-cyan-800', dot: 'bg-cyan-500' },
  10: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  11: { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-500' },
  12: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
};

export function ColorMotorCard({ rawValue, colorConfigs }: ColorMotorCardProps) {
  const detectedIndex = detectColorFromRaw(rawValue, colorConfigs);
  const palette = detectedIndex ? COLOR_PALETTE[detectedIndex] : null;

  // Find matched range for display
  const matchedRange = detectedIndex
    ? colorConfigs.find(c => c.color_index === detectedIndex)
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Motor</h3>

      <div className="flex flex-col sm:flex-row gap-4">

        {/* Raw Value */}
        <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Raw Value
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {rawValue !== null && rawValue !== undefined ? rawValue.toFixed(2) : '--'}
          </p>
        </div>

        {/* Detected Color */}
        <div
          className={`flex-1 rounded-lg p-4 border ${palette
            ? `${palette.bg} border-current`
            : 'bg-gray-50 border-gray-200'
            }`}
        >
          <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${palette ? palette.text : 'text-gray-500'
            }`}>
            Detected Color
          </p>

          <div className="flex items-center gap-3">
            {/* Color dot */}
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 ${palette ? palette.dot : 'bg-gray-300'
                }`}
            />
            <p className={`text-3xl font-bold ${palette ? palette.text : 'text-gray-400'
              }`}>
              {detectedIndex !== null ? `Color ${detectedIndex}` : 'Unknown'}
            </p>
          </div>

          {/* Range info */}
          {matchedRange && (
            <p className={`text-xs mt-2 ${palette ? palette.text : 'text-gray-400'} opacity-70`}>
              Range: {matchedRange.min_value} – {matchedRange.max_value}
            </p>
          )}

          {/* No match hint */}
          {detectedIndex === null && rawValue !== null && rawValue !== undefined && (
            <p className="text-xs text-gray-400 mt-2">
              Value {rawValue} does not match any configured range
            </p>
          )}

          {/* No configs hint */}
          {colorConfigs.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              No color ranges configured. Set ranges in Device Config.
            </p>
          )}
        </div>

      </div>

      {/* Range summary strip */}
      {colorConfigs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Configured Ranges</p>
          <div className="flex flex-wrap gap-1">
            {[...colorConfigs]
              .sort((a, b) => a.color_index - b.color_index)
              .map(config => {
                const p = COLOR_PALETTE[config.color_index];
                const isActive = config.color_index === detectedIndex;
                return (
                  <span
                    key={config.id}
                    className={`text-xs px-2 py-1 rounded font-medium border transition-all ${isActive
                      ? `${p?.bg} ${p?.text} border-current ring-2 ring-offset-1 ${p?.dot.replace('bg-', 'ring-')}`
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                  >
                    C{config.color_index}: {config.min_value}–{config.max_value}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}