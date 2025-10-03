import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { WhiteboardGridInput } from './components/ChalkboardInput';
import { CameraIcon, DownloadIcon, TimerIcon, FlashIcon, CloseIcon, InstallPwaIcon } from './components/Icons';

const NUM_ROWS = 5;
const NUM_COLS = 2;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [whiteboardTexts, setWhiteboardTexts] = useState<string[]>(() => {
    const texts = Array(NUM_ROWS * NUM_COLS).fill('');
    texts[0] = '設備';
    texts[2] = '対象';
    texts[4] = '種類';
    texts[6] = '日付';
    texts[9] = 'キュウセツAQUA（株）';
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    texts[7] = `${year}-${month}-${day}`;
    return texts;
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const [whiteboardScale, setWhiteboardScale] = useState<number>(1);
  const [whiteboardPosition, setWhiteboardPosition] = useState({ x: 50, y: 50 }); // 固定値で描画確認
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(false);
  const [isFlashEnabled, setIsFlashEnabled] = useState<boolean>(false);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isCountingDown = countdown !== null;
  const uiDisabled = isCountingDown || isCapturing;

  useEffect(() => {
  const canvas = overlayCanvasRef.current;
  if (canvas && !imageSrc) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawWhiteboard(context, canvas.width, canvas.height, whiteboardTexts);
    }
  }
}, [whiteboardTexts, imageSrc, whiteboardScale]);


  const handleStreamReady = useCallback((stream: MediaStream) => {
    const track = stream.getVideoTracks()[0];
    if (track) {
      setVideoTrack(track);
      const capabilities = track.getCapabilities();
      setHasFlash(!!(capabilities as any).torch);
    }
  }, []);

  const toggleFlash = async () => {
    if (!videoTrack || !hasFlash) return;
    const newFlashState = !isFlashEnabled;
    try {
      await videoTrack.applyConstraints({ advanced: [{ torch: newFlashState } as any] });
      setIsFlashEnabled(newFlashState);
    } catch (e) {
      console.error("Failed to toggle flash:", e);
    }
  };

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const mainEl = mainRef.current;

    if (canvas && video && video.readyState >= 2 && mainEl) {
      const context = canvas.getContext('2d');
      if (context) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        context.drawImage(video, 0, 0, videoWidth, videoHeight);

        const boardWidth = canvas.width * 0.3 * whiteboardScale;
        const boardHeight = canvas.height * 0.25 * whiteboardScale;
        const boardLeftX = whiteboardPosition.x * (canvas.width / mainEl.offsetWidth);
        const boardTopY = whiteboardPosition.y * (canvas.height / mainEl.offsetHeight);

        context.save();
        context.translate(boardLeftX, boardTopY);
        drawWhiteboard(context, boardWidth, boardHeight, whiteboardTexts);
        context.restore();

        setImageSrc(canvas.toDataURL('image/jpeg'));
      }
    }
  }, [whiteboardTexts, whiteboardScale, whiteboardPosition]);

  const triggerCapture = useCallback(() => {
    setIsCapturing(true);
    capturePhoto();
    setTimeout(() => setIsCapturing(false), 100);
  }, [capturePhoto]);

  const handleCapture = () => {
    if (isTimerEnabled) {
      setCountdown(10);
    } else {
      triggerCapture();
    }
  };

  const retakePhoto = () => setImageSrc(null);

  const downloadPhoto = () => {
    if (imageSrc) {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = 'whiteboard.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="relative w-screen h-[100dvh] bg-gray-800">
     
      <main
  ref={mainRef}
  className="absolute top-0 left-0 w-full h-full bg-black overflow-hidden"
>


          {imageSrc ? (
            <img src={imageSrc} alt="撮影した写真" className="w-full h-full object-contain" />
          ) : (
            <>
              <CameraView videoRef={videoRef} facingMode="environment" onStreamReady={handleStreamReady} />
              <canvas
  ref={overlayCanvasRef}
  width={window.innerWidth}
  height={window.innerHeight}
  className="absolute top-0 left-0 opacity-80 pointer-events-none"
  style={{
    width: '100%',
    height: '100%',
    transform: `translate(${whiteboardPosition.x}px, ${whiteboardPosition.y}px) scale(${whiteboardScale})`,
    transformOrigin: 'top left',
  }}
  aria-hidden="true"
/>

            </>
          )}
          {isCountingDown && (
            <div className="countdown-overlay">
              <span>{countdown !== null && countdown <= 5 ? countdown : ''}</span>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </main>
      <div className={`w-full max-w-4xl mx-auto flex ${imageSrc ? 'flex-col' : 'flex-row items-center'} gap-4 md:gap-8`}>
        

        {!imageSrc && (
          <div className="flex flex-col items-center justify-center gap-4 w-20">
            <button onClick={handleCapture} disabled={uiDisabled} className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 md:p-4 rounded-full">
              <CameraIcon className="h-6 w-6 md:h-8 md:w-8" />
            </button>
            {hasFlash && (
              <button onClick={toggleFlash} disabled={uiDisabled} className="bg-gray-600 text-white font-bold p-3 md:p-4 rounded-full">
                <FlashIcon className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            )}
            <button onClick={() => setIsTimerEnabled(!isTimerEnabled)} disabled={uiDisabled} className="bg-gray-600 text-white font-bold p-3 md:p-4 rounded-full">
                            <TimerIcon className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        )}
      </div>

      {!imageSrc && (
        <div className="w-full max-w-4xl mx-auto mt-4">
          <label htmlFor="whiteboard-scale" className="block text-sm font-medium text-white mb-2 text-center">
            ホワイトボードのサイズ調整
          </label>
          <input
            id="whiteboard-scale"
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={whiteboardScale}
            onChange={(e) => setWhiteboardScale(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            aria-label="ホワイトボードのサイズ調整"
          />
        </div>
      )}

      <footer className="mt-6 w-full max-w-4xl mx-auto">
        {imageSrc ? (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={retakePhoto}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
            >
              再撮影
            </button>
            <button
              onClick={downloadPhoto}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
            >
              <DownloadIcon /> ダウンロード
            </button>
          </div>
        ) : (
          <WhiteboardGridInput texts={whiteboardTexts} setTexts={setWhiteboardTexts} />
        )}
      </footer>
    </div>
  );
};

export default App;