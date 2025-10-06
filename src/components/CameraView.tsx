import React, { useEffect } from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  facingMode: 'user' | 'environment';
  onStreamReady?: (stream: MediaStream) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ videoRef, facingMode, onStreamReady }) => {
  useEffect(() => {
    let stream: MediaStream | null = null;
    const setupCamera = async () => {
      try {
        const constraints = {
          video: { facingMode, width: { ideal: 1080 } },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (onStreamReady) {
          onStreamReady(stream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please ensure you have granted permission.");
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef, facingMode, onStreamReady]);

  const baseClass = 'w-full h-full object-cover';
  const mirrorClass = facingMode === 'user' ? 'transform scale-x-[-1]' : '';
  const combinedClass = `${baseClass} ${mirrorClass}`.trim();

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={combinedClass}
      aria-label="Live camera feed"
    />
  );
};