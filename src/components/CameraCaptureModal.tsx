import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RotateCcw,
  Check,
  X,
  FlipHorizontal,
  Upload,
  AlertCircle,
  Sparkles,
  User,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (photoDataUrl: string) => void;
  onRemovePhoto?: () => void;
  currentPhotoUrl?: string;
  studentName?: string;
  isDarkMode?: boolean;
}

// Curated preset student profile avatars for instant selection
const PRESET_STUDENT_AVATARS = [
  {
    id: 'av-1',
    label: 'Student 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-2',
    label: 'Student 2',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-3',
    label: 'Student 3',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-4',
    label: 'Student 4',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-5',
    label: 'Student 5',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
  },
];

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onSavePhoto,
  onRemovePhoto,
  currentPhotoUrl,
  studentName = 'Student',
  isDarkMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<'initializing' | 'live' | 'captured' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'camera' | 'upload' | 'presets'>('camera');

  // Start device camera stream
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraState('initializing');
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('error');
      setErrorMessage('Camera access is not supported in this browser environment. You can upload a photo or choose an avatar preset.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn('Video play error:', e));
          setCameraState('live');
        };
      }
    } catch (err: any) {
      console.error('Camera stream access error:', err);
      setCameraState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera permissions in your browser or choose a photo from your files.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device was detected on this hardware. You can upload a photo from your gallery.');
      } else {
        setErrorMessage(`Unable to connect to camera (${err.message || 'Device busy or restricted'}). Please use photo upload or preset avatar.`);
      }
    }
  };

  // Stop device camera stream & release hardware locks
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
  };

  // Mount/unmount lifecycle for camera
  useEffect(() => {
    if (isOpen && selectedTab === 'camera') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, selectedTab, facingMode]);

  // Flip camera between front and back
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture instant snapshot or initiate 3s timer
  const handleTakeSnapshotWithTimer = (timerSeconds: number = 0) => {
    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            executeSnapshotCapture();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      executeSnapshotCapture();
    }
  };

  // Take frame from video and convert to circular centered image
  const executeSnapshotCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 640;
    const size = Math.min(videoWidth, videoHeight);

    // Target a crisp square crop (400x400)
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startX = (videoWidth - size) / 2;
    const startY = (videoHeight - size) / 2;

    // If front camera, mirror horizontally for natural selfie look
    if (facingMode === 'user') {
      ctx.translate(400, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    setCameraState('captured');
    stopCamera();
  };

  // Retake photo: clear captured frame and re-arm camera
  const handleRetake = () => {
    setCapturedImage(null);
    setCameraState('initializing');
    startCamera(facingMode);
  };

  // Save confirmed photo
  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onSavePhoto(capturedImage);
      handleClose();
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 400, 400);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setCapturedImage(compressed);
          setCameraState('captured');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setCapturedImage(url);
    setCameraState('captured');
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCountdown(null);
    setCameraState('initializing');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        id="camera-capture-modal"
        className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Camera className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-tight">Set Profile Picture</h3>
              <p className="text-[10px] text-blue-200">Official Student ID Photo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs (Camera / Upload / Preset) */}
        {cameraState !== 'captured' && (
          <div className={`p-2 border-b flex gap-1 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <button
              type="button"
              onClick={() => setSelectedTab('camera')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedTab === 'camera'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('upload')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('presets')}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedTab === 'presets'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Avatars</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center overflow-y-auto">
          
          {/* TAB 1: LIVE DEVICE CAMERA */}
          {selectedTab === 'camera' && cameraState !== 'captured' && (
            <div className="w-full flex flex-col items-center space-y-3">
              {/* Viewfinder Container */}
              <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-blue-600 shadow-lg bg-black flex items-center justify-center">
                {/* Live Video Stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Shutter Flash Animation */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />
                )}

                {/* Circular Target Overlay Guide */}
                <div className="absolute inset-0 rounded-full border border-dashed border-white/40 pointer-events-none flex items-center justify-center">
                  <div className="w-36 h-44 rounded-full border border-white/30" />
                </div>

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                    <span className="text-5xl font-black text-amber-400 animate-ping">
                      {countdown}
                    </span>
                  </div>
                )}

                {/* Initializing Spinner */}
                {cameraState === 'initializing' && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2 text-white text-xs">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                    <span>Connecting camera...</span>
                  </div>
                )}

                {/* Error Banner */}
                {cameraState === 'error' && (
                  <div className="absolute inset-0 bg-slate-900/95 p-3 flex flex-col items-center justify-center text-center gap-2">
                    <AlertCircle className="w-6 h-6 text-rose-400" />
                    <p className="text-[11px] text-slate-300 leading-tight">
                      {errorMessage || 'Camera stream unavailable'}
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              <span className={`text-[10px] font-medium text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Center your face inside the circle for official student verification.
              </span>

              {/* Camera Controls Bar */}
              {cameraState === 'live' && (
                <div className="w-full flex items-center justify-center gap-3 pt-2">
                  {/* Flip Camera */}
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    title="Flip camera front/back"
                    className={`p-2.5 rounded-full border transition-colors ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>

                  {/* Shutter Button (Instant) */}
                  <button
                    type="button"
                    onClick={() => handleTakeSnapshotWithTimer(0)}
                    id="camera-shutter-btn"
                    className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white p-1 border-4 border-blue-200 dark:border-blue-900 shadow-md flex items-center justify-center active:scale-95 transition-transform"
                    title="Take Photo"
                  >
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-blue-900">
                      <Camera className="w-4 h-4" />
                    </div>
                  </button>

                  {/* 3s Countdown Shutter Button */}
                  <button
                    type="button"
                    onClick={() => handleTakeSnapshotWithTimer(3)}
                    title="Take photo with 3-second timer"
                    className={`p-2.5 rounded-full border transition-colors flex items-center gap-1 text-[11px] font-bold ${
                      countdown !== null
                        ? 'bg-amber-500 text-white border-amber-600'
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>3s</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD FILE / GALLERY */}
          {selectedTab === 'upload' && cameraState !== 'captured' && (
            <div className="w-full flex flex-col items-center space-y-4 py-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDarkMode 
                    ? 'border-slate-700 hover:border-blue-500 bg-slate-950/40 hover:bg-slate-950' 
                    : 'border-slate-300 hover:border-blue-600 bg-slate-50 hover:bg-blue-50/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold block">Choose from device gallery</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, or WEBP (Max 5MB)</span>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Browse Files
              </button>
            </div>
          )}

          {/* TAB 3: PRESET STUDENT AVATARS */}
          {selectedTab === 'presets' && cameraState !== 'captured' && (
            <div className="w-full space-y-3">
              <span className={`text-[11px] font-bold block text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Select a Lesotho student profile avatar:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_STUDENT_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectPreset(av.url)}
                    className={`p-1 rounded-2xl border flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                      isDarkMode ? 'border-slate-800 hover:border-blue-500 bg-slate-800/60' : 'border-slate-200 hover:border-blue-600 bg-slate-50'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.label}
                      className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span className="text-[10px] font-semibold truncate w-full text-center">{av.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REVIEW & CONFIRM CAPTURED PHOTO */}
          {cameraState === 'captured' && capturedImage && (
            <div className="w-full flex flex-col items-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-black flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured Profile"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-xs font-black block">Photo Captured Successfully!</span>
                <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Preview how your picture appears on your POKOLA Student Card & Receipts.
                </p>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  id="confirm-profile-photo-btn"
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Use This Photo</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Remove / Current Avatar status */}
        {currentPhotoUrl && cameraState !== 'captured' && onRemovePhoto && (
          <div className={`p-3 border-t flex items-center justify-between ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <span className="text-[10px] text-slate-400">Current photo set</span>
            <button
              type="button"
              onClick={() => {
                onRemovePhoto();
                handleClose();
              }}
              className="text-[11px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove Photo</span>
            </button>
          </div>
        )}

        {/* Hidden Canvas Element for processing photo crops */}
        <canvas ref={canvasRef} className="hidden" width="400" height="400" />
      </div>
    </div>
  );
};
