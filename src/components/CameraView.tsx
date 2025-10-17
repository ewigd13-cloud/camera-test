import React, { useEffect } from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  facingMode: 'user' | 'environment';
  onStreamReady?: (stream: MediaStream) => void;
  onGoToGallery?: () => void; // ← 追加
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  facingMode,
  onStreamReady,
  onGoToGallery,
}) => {
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
        console.error('Error accessing camera:', err);
        alert('カメラにアクセスできませんでした。権限を確認してください。');
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef, facingMode, onStreamReady]);

  const baseClass = 'w-full h-full object-cover';
  const mirrorClass = facingMode === 'user' ? 'transform scale-x-[-1]' : '';
  const combinedClass = `${baseClass} ${mirrorClass}`.trim();

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={combinedClass}
        aria-label="Live camera feed"
      />
      {onGoToGallery && (
        <button
          onClick={onGoToGallery}
          className="absolute bottom-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-md shadow-md hover:bg-gray-100 transition text-sm font-semibold"
        >
          保存した写真を見る
        </button>
      )}
    </div>
  );
};