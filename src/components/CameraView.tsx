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

          // ✅ Firefox対策：明示的に再生を試みる
          await videoRef.current.play().catch(err => {
            console.warn('Video play failed:', err);
          });
        }

        if (onStreamReady) {
          onStreamReady(stream);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('カメラにアクセスできませんでした。権限を許可しているか確認してください。');
      }
    };

    setupCamera();

    return () => {
      // ✅ クリーンアップ：ストリームを停止
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef, facingMode, onStreamReady]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`absolute top-0 left-0 w-full h-full object-cover ${
        facingMode === 'user' ? 'transform scale-x-[-1]' : ''
      }`}
      aria-label="Live camera feed"
    />
  );
};