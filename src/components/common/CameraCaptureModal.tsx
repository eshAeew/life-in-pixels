import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    setIsStarting(true);
    setErrorMsg(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not directly supported in this browser environment.');
      setIsStarting(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStarting(false);
    } catch (err) {
      console.warn('Camera stream error:', err);
      setErrorMsg(
        'Could not access camera device directly. You can use your device camera via file selector below.'
      );
      setIsStarting(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onCapture(reader.result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Capture Photo with Device Camera"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#1C1917] text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border border-white/10">
        {/* Top Control Bar */}
        <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <span className="text-xs font-semibold tracking-wider uppercase text-white/80 flex items-center gap-1.5">
            <Camera size={15} /> Device Camera
          </span>

          <div className="flex items-center gap-2">
            {!errorMsg && (
              <button
                type="button"
                onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
                aria-label="Switch camera lens"
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Switch Camera"
              >
                <RefreshCw size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              aria-label="Close camera"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Viewfinder area */}
        <div className="relative bg-black h-80 sm:h-96 flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center space-y-4 max-w-xs">
              <AlertCircle size={32} className="mx-auto text-[#FFB7B2]" />
              <p className="text-xs text-white/80 leading-relaxed">{errorMsg}</p>
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="px-4 py-2 bg-[#FFB7B2] text-[#292524] rounded-xl text-xs font-semibold hover:bg-[#FFA5A0] cursor-pointer"
              >
                Launch Native Device Camera
              </button>
              <input
                ref={fallbackInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFallbackFile}
                className="hidden"
              />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white/70">
                  Starting camera lens...
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Shutter Controls */}
        {!errorMsg && (
          <div className="p-6 bg-[#1C1917] flex items-center justify-around border-t border-white/5">
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="text-xs text-white/60 hover:text-white underline cursor-pointer"
            >
              Use System Camera App
            </button>
            <input
              ref={fallbackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFallbackFile}
              className="hidden"
            />

            {/* Shutter Button */}
            <button
              type="button"
              onClick={capturePhoto}
              aria-label="Capture photo snapshot"
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 cursor-pointer active:scale-95 transition-all shadow-lg hover:border-[#FFB7B2]"
            >
              <div className="w-full h-full rounded-full bg-white hover:bg-[#FFB7B2] transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-xs text-white/60 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
