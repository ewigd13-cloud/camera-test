
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { WhiteboardGridInput } from './components/ChalkboardInput';
import { CameraIcon, DownloadIcon, TimerIcon, FlashIcon, CloseIcon, InstallPwaIcon } from './components/Icons';
import './index.css';


// Type definition for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}


const NUM_ROWS = 5;
const NUM_COLS = 2;

// Helper function to find the best font size and wrap text to fit in a box
const getAdjustedFontAndLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxHeight: number
): { lines: string[]; lineHeight: number } => {
    if (!text || text.trim() === '' || maxWidth <= 0 || maxHeight <= 0) {
        return { lines: [], lineHeight: 0 };
    }

    const minFontSize = 1;

    // Iterate from a reasonable max font size down to the minimum
    for (let fontSize = Math.floor(maxHeight); fontSize >= minFontSize; fontSize--) {
        ctx.font = `900 ${fontSize}px 'Noto Serif JP', serif`;
        const lineHeight = fontSize * 1.4;

        if (lineHeight > maxHeight) {
            continue;
        }
        
        const lines: string[] = [];
        let currentLine = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const testLine = currentLine + char;
            if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        if (lines.length * lineHeight <= maxHeight) {
            return { lines, lineHeight };
        }
    }

    // Fallback: use min font size and truncate if necessary
    const fallbackFontSize = minFontSize;
    ctx.font = `900 ${fallbackFontSize}px 'Noto Serif JP', serif`;
    const fallbackLineHeight = fallbackFontSize * 1.4;

    if (fallbackLineHeight > maxHeight) {
        return { lines: [], lineHeight: 0 }; // Cannot fit even one line
    }
    
    const lines: string[] = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = char;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    const maxLines = Math.max(1, Math.floor(maxHeight / fallbackLineHeight));
    const truncatedLines = lines.slice(0, maxLines);

    if (lines.length > maxLines && truncatedLines.length > 0) {
        let lastLine = truncatedLines[truncatedLines.length - 1];
        let truncatedLastLine = lastLine;
        while (ctx.measureText(truncatedLastLine + '…').width > maxWidth && truncatedLastLine.length > 0) {
            truncatedLastLine = truncatedLastLine.slice(0, -1);
        }
        truncatedLines[truncatedLines.length - 1] = truncatedLastLine + '…';
    }

    return { lines: truncatedLines, lineHeight: fallbackLineHeight };
};


// Helper function to draw the whiteboard onto a given context
const drawWhiteboard = (context: CanvasRenderingContext2D, boardWidth: number, boardHeight: number, texts: string[]) => {
    // Make padding proportional to the board size to ensure text fits at all scales.
    const borderPadding = boardWidth * 0.025;
    const textPadding = boardWidth * 0.015;

    const gridWidth = boardWidth - borderPadding * 2;
    const gridHeight = boardHeight - borderPadding * 2;
    
    const colWidths = [gridWidth * 0.3, gridWidth * 0.7];
    const cellHeight = gridHeight / NUM_ROWS;
    const effectiveCellHeight = cellHeight - textPadding * 2;

    const textsToDraw = [...texts];
    if (textsToDraw[7] && /^\d{4}-\d{2}-\d{2}$/.test(textsToDraw[7])) {
        const [year, month, day] = textsToDraw[7].split('-');
        textsToDraw[7] = `${year}年${month}月${day}日`;
    }
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    context.strokeStyle = '#1a1a1a';
    context.lineWidth = 2;
    context.strokeRect(0, 0, boardWidth, boardHeight);
    context.strokeRect(
        borderPadding,
        borderPadding,
        gridWidth,
        gridHeight
    );

    context.strokeStyle = '#cccccc';
    context.lineWidth = 1;
    context.beginPath();
    
    for (let i = 1; i < NUM_ROWS; i++) {
        const y = borderPadding + (i * cellHeight);
        context.moveTo(borderPadding, y);
        context.lineTo(boardWidth - borderPadding, y);
    }
    
    const verticalLineX = borderPadding + colWidths[0];
    context.moveTo(verticalLineX, borderPadding);
    context.lineTo(verticalLineX, borderPadding + gridHeight);
    context.stroke();

    context.fillStyle = '#1a1a1a';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < NUM_COLS; col++) {
            const index = row * NUM_COLS + col;
            const text = textsToDraw[index];

            const currentCellWidth = colWidths[col];
            const effectiveCellWidth = currentCellWidth - textPadding * 2;
            
            const { lines, lineHeight } = getAdjustedFontAndLines(
                context,
                text,
                effectiveCellWidth,
                effectiveCellHeight
            );
            
            if (lines.length > 0) {
                const cellLeftX = borderPadding + (col === 0 ? 0 : colWidths[0]);
                const cellTopY = borderPadding + row * cellHeight;
                
                const textBlockHeight = lines.length * lineHeight;
                const textStartX = cellLeftX + currentCellWidth / 2;
                let textStartY = cellTopY + (cellHeight / 2) - (textBlockHeight / 2) + (lineHeight / 2);

                lines.forEach(line => {
                    context.fillText(line, textStartX, textStartY);
                    textStartY += lineHeight;
                });
            }
        }
    }
};


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
  const downloadCounterRef = useRef<Record<string, number>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(false);
  const [isFlashEnabled, setIsFlashEnabled] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const isCountingDown = countdown !== null;
  const [whiteboardScale, setWhiteboardScale] = useState<number>(1);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [hasFlash, setHasFlash] = useState<boolean>(false);

  const [whiteboardPosition, setWhiteboardPosition] = useState({ x: 0, y: 0 });
  const mainRef = useRef<HTMLElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);


  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setInstallPrompt(null);
  };

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error("Web Audio API is not supported in this browser", e);
        }
      }
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playTickSound = useCallback(() => {
    if (!audioContextRef.current) return;
    try {
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A6 note
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Error playing tick sound", e);
    }
  }, []);

  const playShutterSound = useCallback(() => {
    if (!audioContextRef.current) return;
    try {
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const bufferSize = audioCtx.sampleRate * 0.1; // 0.1 seconds of noise
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      const gainNode = audioCtx.createGain();
      noiseSource.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05);

      noiseSource.start(audioCtx.currentTime);
      noiseSource.stop(audioCtx.currentTime + 0.1);
    } catch(e) {
        console.error("Error playing sound", e);
    }
  }, []);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (canvas && !imageSrc) {
      const context = canvas.getContext('2d');
      if (context) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawWhiteboard(context, canvas.width, canvas.height, whiteboardTexts);
      }
    }
  }, [whiteboardTexts, imageSrc, whiteboardScale]);

    useEffect(() => {
        if (imageSrc) return;

        const mainEl = mainRef.current;
        const overlayEl = overlayCanvasRef.current;
        
        const timer = setTimeout(() => {
            if (mainEl && overlayEl) {
                const mainRect = mainEl.getBoundingClientRect();
                const overlayHeight = overlayEl.offsetHeight;
                
                setWhiteboardPosition({
                    x: 0,
                    y: mainRect.height - overlayHeight,
                });
            }
        }, 0);

        return () => clearTimeout(timer);

    }, [imageSrc, whiteboardScale]);

    const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const mainEl = mainRef.current;
        const overlayEl = overlayCanvasRef.current;
        if (!mainEl || !overlayEl) return;
    
        isDraggingRef.current = true;
    
        const point = 'touches' in e ? e.touches[0] : e;
        const overlayRect = overlayEl.getBoundingClientRect();
        
        dragOffsetRef.current = {
            x: point.clientX - overlayRect.left,
            y: point.clientY - overlayRect.top,
        };
    
        const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
            if (!isDraggingRef.current) return;
            
            const movePoint = 'touches' in moveEvent ? moveEvent.touches[0] : moveEvent;
            const mainRect = mainEl.getBoundingClientRect();
            const overlayWidth = overlayEl.offsetWidth;
            const overlayHeight = overlayEl.offsetHeight;
    
            let newX = movePoint.clientX - mainRect.left - dragOffsetRef.current.x;
            let newY = movePoint.clientY - mainRect.top - dragOffsetRef.current.y;
    
            newX = Math.max(0, Math.min(newX, mainRect.width - overlayWidth));
            newY = Math.max(0, Math.min(newY, mainRect.height - overlayHeight));
    
            setWhiteboardPosition({ x: newX, y: newY });
        };
    
        const handleDragEnd = () => {
            isDraggingRef.current = false;
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
        
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);
    
    }, []);

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const mainEl = mainRef.current;

    if (canvas && video && video.readyState >= 2 && mainEl) {
      const context = canvas.getContext('2d');
      if (context) {
        const targetAspectRatio = 4 / 3;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const videoAspectRatio = videoWidth / videoHeight;

        let sWidth, sHeight, sx, sy;

        if (videoAspectRatio > targetAspectRatio) {
            sHeight = videoHeight;
            sWidth = videoHeight * targetAspectRatio;
            sx = (videoWidth - sWidth) / 2;
            sy = 0;
        } else {
            sWidth = videoWidth;
            sHeight = videoWidth / targetAspectRatio;
            sx = 0;
            sy = (videoHeight - sHeight) / 2;
        }

        canvas.width = sWidth;
        canvas.height = sHeight;

        context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

        context.setTransform(1, 0, 0, 1, 0, 0);

        const baseBoardWidth = canvas.width * 0.3;
        const baseBoardHeight = canvas.height * 0.25;
        
        const boardWidth = baseBoardWidth * whiteboardScale;
        const boardHeight = baseBoardHeight * whiteboardScale;
        
        const mainRect = mainEl.getBoundingClientRect();
        const scaleX = canvas.width / mainRect.width;
        const scaleY = canvas.height / mainRect.height;

        const boardLeftX = whiteboardPosition.x * scaleX;
        const boardTopY = whiteboardPosition.y * scaleY;

        context.save();
        context.translate(boardLeftX, boardTopY);
        drawWhiteboard(context, boardWidth, boardHeight, whiteboardTexts);
        context.restore();
        
        setImageSrc(canvas.toDataURL('image/jpeg'));
      }
    }
  }, [videoRef, whiteboardTexts, whiteboardScale, whiteboardPosition]);

  const handleStreamReady = useCallback((stream: MediaStream) => {
    const track = stream.getVideoTracks()[0];
    if (track) {
      setVideoTrack(track);
      const capabilities = track.getCapabilities();
      setHasFlash(!!(capabilities as any).torch);
    }
  }, []);

  const toggleFlash = async () => {
    if (!videoTrack || !hasFlash) {
      console.warn("Flash toggled but no track or flash capability found.");
      return;
    }

    const newFlashState = !isFlashEnabled;
    try {
      await videoTrack.applyConstraints({ advanced: [{ torch: newFlashState } as any] });
      setIsFlashEnabled(newFlashState);
    } catch (e) {
      console.error("Failed to toggle flash:", e);
      alert("フラッシュの切り替えに失敗しました。");
    }
  };

  const triggerCapture = useCallback(() => {
    setIsCapturing(true);
    playShutterSound();
    capturePhoto();
    setTimeout(() => setIsCapturing(false), 100);
  }, [playShutterSound, capturePhoto]);


  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      if (countdown <= 5) {
        playTickSound();
      }
      const timerId = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else {
      triggerCapture();
      setCountdown(null);
    }
  }, [countdown, triggerCapture, playTickSound]);
  
  const handleCancelCountdown = () => {
    setCountdown(null);
  };
  
  const handleCapture = () => {
    if (isTimerEnabled) {
      setCountdown(10);
    } else {
      triggerCapture();
    }
  };

  const retakePhoto = () => {
    setImageSrc(null);
  };

  const downloadPhoto = () => {
    if (imageSrc) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${month}.${day}`;

      const text1 = whiteboardTexts[1] || '';
      const text2 = whiteboardTexts[3] || '';

      const baseFilename = `${dateString}${text1}${text2}`;

      const currentCount = downloadCounterRef.current[baseFilename] || 0;
      const newCount = currentCount + 1;
      downloadCounterRef.current[baseFilename] = newCount;
      
      const counterString = String(newCount).padStart(3, '0');

      const finalFilename = `${baseFilename}${counterString}.jpg`;
      
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const uiDisabled = isCountingDown || isCapturing;

  return (
    <div className="bg-gray-800 min-h-screen flex flex-col items-center justify-center p-4">
        <div className={`w-full max-w-4xl mx-auto flex ${imageSrc ? 'flex-col' : 'flex-row items-center'} gap-4 md:gap-8`}>
            <main ref={mainRef} className={`aspect-[4/3] bg-black rounded-lg shadow-2xl overflow-hidden relative ${imageSrc ? 'w-full' : 'flex-1'}`}>
                {installPrompt && !imageSrc && (
                    <button 
                        onClick={handleInstallClick}
                        className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-full transition-transform transform hover:scale-105 shadow-lg ring-4 ring-white ring-opacity-25 focus:outline-none focus:ring-opacity-50"
                        aria-label="アプリをインストール"
                        title="アプリをインストール"
                    >
                        <InstallPwaIcon className="h-6 w-6" />
                    </button>
                )}
                {imageSrc ? (
                    <img src={imageSrc} alt="撮影した写真" className="w-full h-full object-contain" />
                ) : (
                    <>
                        <CameraView videoRef={videoRef} facingMode="environment" onStreamReady={handleStreamReady} />
                        <canvas
                            ref={overlayCanvasRef}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                            className="absolute top-0 left-0 opacity-80 cursor-move touch-none"
                            style={{
                                width: `${30 * whiteboardScale}%`,
                                height: `${25 * whiteboardScale}%`,
                                transform: `translate(${whiteboardPosition.x}px, ${whiteboardPosition.y}px)`,
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

            {!imageSrc && (
                <div className="flex flex-col items-center justify-center gap-4 w-20">
                    {isCountingDown ? (
                        <button onClick={handleCancelCountdown} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold p-3 md:p-4 rounded-full transition-transform transform hover:scale-105 shadow-lg ring-4 ring-white ring-opacity-25 focus:outline-none focus:ring-opacity-50" aria-label="タイマーをキャンセル">
                            <CloseIcon className="h-6 w-6 md:h-8 md:w-8" />
                        </button>
                    ) : (
                        <button onClick={handleCapture} className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 md:p-4 rounded-full transition-transform transform hover:scale-105 shadow-lg ring-4 ring-white ring-opacity-25 focus:outline-none focus:ring-opacity-50 disabled:bg-red-900 disabled:cursor-not-allowed" aria-label="写真を撮る" disabled={uiDisabled}>
                            <CameraIcon className="h-6 w-6 md:h-8 md:w-8" />
                        </button>
                    )}
                    
                    {hasFlash && (
                      <button 
                          onClick={toggleFlash} 
                          title={isFlashEnabled ? "フラッシュ OFF" : "フラッシュ ON"} 
                          className={`bg-gray-600 hover:bg-gray-700 text-white font-bold p-3 md:p-4 rounded-full transition-all transform hover:scale-105 shadow-lg disabled:bg-gray-800 disabled:cursor-not-allowed ${isFlashEnabled ? 'ring-4 ring-yellow-400' : ''}`} 
                          aria-label="フラッシュの切り替え"
                          disabled={uiDisabled}
                      >
                          <FlashIcon className="h-5 w-5 md:h-6 md:w-6" />
                      </button>
                    )}

                    <button 
                        onClick={() => setIsTimerEnabled(!isTimerEnabled)} 
                        title={isTimerEnabled ? "タイマー OFF" : "10秒タイマー ON"} 
                        className={`bg-gray-600 hover:bg-gray-700 text-white font-bold p-3 md:p-4 rounded-full transition-all transform hover:scale-105 shadow-lg disabled:bg-gray-800 disabled:cursor-not-allowed ${isTimerEnabled ? 'ring-4 ring-blue-500' : ''}`} 
                        aria-label="タイマーの切り替え"
                        disabled={uiDisabled}
                    >
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
                    <button onClick={retakePhoto} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
                        再撮影
                    </button>
                    <button onClick={downloadPhoto} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg">
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