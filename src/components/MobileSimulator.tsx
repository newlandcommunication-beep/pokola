import React, { useState } from 'react';
import { 
  Smartphone, 
  Apple, 
  Play, 
  RotateCcw, 
  Wifi, 
  Battery, 
  Signal, 
  ChevronLeft, 
  Layers, 
  Info,
  QrCode,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export type DeviceMode = 'ios' | 'android';

interface MobileSimulatorProps {
  children: React.ReactNode;
  activeDevice?: DeviceMode;
  onDeviceChange?: (device: DeviceMode) => void;
  appName?: string;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  children,
  activeDevice: propDevice,
  onDeviceChange,
  appName = 'POKOLA Mobile'
}) => {
  const [internalDevice, setInternalDevice] = useState<DeviceMode>('ios');
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [deviceScale, setDeviceScale] = useState<number>(100);

  const activeDevice = propDevice || internalDevice;

  const handleSelectDevice = (device: DeviceMode) => {
    setInternalDevice(device);
    if (onDeviceChange) {
      onDeviceChange(device);
    }
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 px-2 sm:px-6">
      
      {/* Device & Platform Switcher Bar */}
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xs p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Mobile Shell:</span>
          
          {/* iOS Button */}
          <button
            id="btn-switch-ios"
            onClick={() => handleSelectDevice('ios')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeDevice === 'ios'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Apple iOS (iPhone 16 Pro)</span>
          </button>

          {/* Android Button */}
          <button
            id="btn-switch-android"
            onClick={() => handleSelectDevice('android')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeDevice === 'android'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android (Pixel 9 Pro)</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-pwa-install-info"
            onClick={() => setShowPwaModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
            title="Install onto physical phone"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install on Device</span>
          </button>
        </div>
      </div>

      {/* Hardware Frame Wrapper */}
      <div className="relative transition-all duration-300 flex justify-center w-full">
        {activeDevice === 'ios' ? (
          /* iOS Hardware Mockup (iPhone 16 Pro Style) */
          <div className="w-[390px] sm:w-[412px] h-[844px] sm:h-[880px] bg-slate-950 rounded-[54px] p-3.5 shadow-2xl ring-1 ring-slate-800 ring-offset-4 ring-offset-slate-100 relative flex flex-col overflow-hidden border-4 border-slate-800/80">
            
            {/* Dynamic Island Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-28 h-7 bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm border border-slate-800">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>

            {/* iOS Status Bar */}
            <div className="w-full pt-1 pb-1.5 px-6 flex items-center justify-between text-slate-100 text-[11px] font-semibold select-none z-40 bg-slate-900/90 backdrop-blur-md rounded-t-[40px]">
              <span>{currentTime}</span>
              <div className="flex items-center gap-1.5 pr-2">
                <Signal className="w-3 h-3 text-slate-200" />
                <Wifi className="w-3 h-3 text-slate-200" />
                <div className="flex items-center gap-0.5">
                  <div className="w-4 h-2 rounded-[2px] border border-slate-300 p-0.5 flex items-center">
                    <div className="w-full h-full bg-emerald-400 rounded-[1px]"></div>
                  </div>
                  <div className="w-0.5 h-1 bg-slate-300 rounded-r-[1px]"></div>
                </div>
              </div>
            </div>

            {/* Internal App Screen Scroll Area */}
            <div className="flex-1 w-full bg-slate-50 overflow-y-auto overflow-x-hidden relative scrollbar-none rounded-b-[40px] flex flex-col">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 w-36 h-1 bg-slate-400/80 rounded-full"></div>
          </div>
        ) : (
          /* Android Hardware Mockup (Material You / Google Pixel Style) */
          <div className="w-[390px] sm:w-[412px] h-[844px] sm:h-[880px] bg-slate-900 rounded-[44px] p-3 shadow-2xl ring-1 ring-emerald-900/40 ring-offset-4 ring-offset-slate-100 relative flex flex-col overflow-hidden border-4 border-slate-700">
            
            {/* Android Punch Hole Camera */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-4 h-4 bg-black rounded-full border border-slate-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700"></div>
            </div>

            {/* Android Status Bar */}
            <div className="w-full pt-1 pb-1.5 px-6 flex items-center justify-between text-slate-200 text-[11px] font-medium select-none z-40 bg-emerald-950/90 backdrop-blur-md rounded-t-[32px]">
              <span className="font-bold">{currentTime}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-300 font-bold">5G</span>
                <Wifi className="w-3 h-3 text-slate-200" />
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Internal App Screen Scroll Area */}
            <div className="flex-1 w-full bg-slate-50 overflow-y-auto overflow-x-hidden relative scrollbar-none flex flex-col">
              {children}
            </div>

            {/* Android Navigation Gesture Bar */}
            <div className="w-full py-1.5 bg-slate-900 flex items-center justify-center z-40 rounded-b-[32px]">
              <div className="w-24 h-1 bg-slate-400 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* PWA / Native APK & iOS Install Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-base shadow-sm">
                  P
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">POKOLA Mobile</h3>
                  <p className="text-xs text-slate-500">Native iOS & Android PWA App</p>
                </div>
              </div>
              <button
                onClick={() => setShowPwaModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <Apple className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Install on iPhone (iOS):</strong>
                  <span>Tap Safari's <strong className="text-blue-700">Share</strong> icon at the bottom, then scroll down and tap <strong className="text-slate-900">"Add to Home Screen"</strong>.</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Install on Android (Chrome / Firefox):</strong>
                  <span>Tap the Chrome menu (3 dots) in the top right and tap <strong className="text-emerald-700">"Install app"</strong> or <strong className="text-slate-900">"Add to Home screen"</strong>.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Offline cache & M-Pesa ready
              </span>
              <button
                onClick={() => setShowPwaModal(false)}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
