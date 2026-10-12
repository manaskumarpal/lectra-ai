import React from 'react';
import {
  X,
  Cpu,
  Radio,
  BatteryCharging,
  Wifi,
  Sparkles,
  ShieldCheck,
  Check,
  Volume2
} from 'lucide-react';

interface WearableDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WearableDeviceModal: React.FC<WearableDeviceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware Concept Roadmap</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            The Lectra Wearable Microphone
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A purpose-built, lightweight acoustic sensor for classroom educators.
          </p>
        </div>

        {/* Visual Mock / Diagram */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border border-indigo-500/20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-cyan-400/80 shadow-2xl shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white">
                <Volume2 className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-400 text-black text-[9px] font-black uppercase tracking-wider">
              18g Clip
            </span>
          </div>

          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-bold text-white">
              Lectra Collar Clip V1 Concept
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Weighing under 18 grams, the device clips seamlessly to a teacher's shirt or collar, featuring dual-capsule cardioid microphones for acoustic isolation.
            </p>
          </div>
        </div>

        {/* Key Hardware Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Radio className="w-4 h-4" />
              <span>Beamforming MEMS Array</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Cancels classroom chatter, HVAC rumble, and echo to capture pristine instructor speech.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <BatteryCharging className="w-4 h-4" />
              <span>12-Hour Battery Life</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              All-day power on a single charge with fast wireless charging dock.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Wifi className="w-4 h-4" />
              <span>Direct Cloud & Local Sync</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Syncs with campus Wi-Fi or connects via Bluetooth BLE to the Lectra application.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Physical Privacy Mute Switch</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Hardware circuit disconnect ensures complete privacy between lectures.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
