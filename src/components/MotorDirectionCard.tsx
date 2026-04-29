import { ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

interface MotorDirectionCardProps {
  label: string;
  direction: 'right' | 'left' | 'sensor fail' | null;
}

export function MotorDirectionCard({ label, direction }: MotorDirectionCardProps) {
  const getDirectionInfo = () => {
    switch (direction) {
      case 'right':
        return {
          icon: <ArrowRight className="w-8 h-8" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Right'
        };
      case 'left':
        return {
          icon: <ArrowLeft className="w-8 h-8" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Left'
        };
      case 'sensor fail':
        return {
          icon: <AlertTriangle className="w-8 h-8" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-400',
          label: 'Sensor Fail'
        };
      default:
        return {
          icon: <div className="w-8 h-8 rounded-full bg-gray-200" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'No Data'
        };
    }
  };

  const info = getDirectionInfo();

  return (
    <div className={`${info.bgColor} rounded-lg shadow-sm border-2 ${info.borderColor} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-1">{label}</h3>
          <div className={`text-lg font-semibold ${info.color}`}>
            {info.label}
          </div>
        </div>
        <div className={info.color}>
          {info.icon}
        </div>
      </div>
    </div>
  );
}
