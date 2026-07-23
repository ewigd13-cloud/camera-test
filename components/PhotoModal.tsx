import React, { useEffect, useRef, useState } from 'react';
import { PhotoRecord } from '../db';
import { CloseIcon, ArrowLeftIcon, ArrowRightIcon, ShareIcon, DownloadIcon } from './Icons';
import { saveOrSharePhoto, isIOS } from '../utils/download';

interface PhotoModalProps {
  photo: PhotoRecord;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ photo, onClose, onNavigate }) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNavigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null; // Reset on new touch
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onNavigate('next');
    } else if (isRightSwipe) {
      onNavigate('prev');
    }

    // Reset refs
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleSaveShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await saveOrSharePhoto(photo.dataUrl, photo.filename);
      if (res.method === 'share' && res.success) {
        setMessage('共有メニューを開きました');
      } else if (res.method === 'new_tab') {
        setMessage('新しいタブで開きました。長押しで「写真に保存」できます。');
      } else if (res.method === 'download') {
        setMessage('ダウンロードを開始しました');
      }
    } catch (err) {
      console.error('Failed to save photo:', err);
      setMessage('保存に失敗しました');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-[60] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-filename"
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
            className="absolute left-2 md:left-4 text-white hover:text-gray-300 p-2 md:p-3 bg-black bg-opacity-50 rounded-full z-20"
            onClick={() => onNavigate('prev')}
            aria-label="前の写真"
        >
            <ArrowLeftIcon className="h-6 w-6 md:h-8 md:w-8" />
        </button>
        
        <div 
          className="relative flex flex-col items-center justify-center max-w-full max-h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
            <button
                className="absolute top-2 right-2 text-white p-2 bg-black bg-opacity-60 rounded-full hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-white transition-opacity z-10"
                onClick={(e) => {
                e.stopPropagation();
                onClose();
                }}
                aria-label="閉じる"
            >
                <CloseIcon className="h-6 w-6" />
            </button>
            <img
                src={photo.dataUrl}
                alt={photo.filename}
                className="max-w-full max-h-[75vh] object-contain block shadow-2xl rounded-md cursor-pointer"
            />
            <div className="text-center mt-2 p-3 bg-black bg-opacity-70 rounded-md w-full max-w-lg flex flex-col items-center gap-2">
                <p id="photo-modal-filename" className="font-bold text-sm md:text-base text-white">{photo.filename}</p>
                <p className="text-xs md:text-sm text-gray-300">{new Date(photo.createdAt).toLocaleString('ja-JP')}</p>

                <div className="flex items-center justify-center gap-3 mt-1">
                  <button
                    onClick={handleSaveShare}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-xs md:text-sm shadow"
                  >
                    <ShareIcon className="h-4 w-4" />
                    <span>{isSaving ? '処理中...' : '画像を保存・共有'}</span>
                  </button>
                </div>

                {message && (
                  <p className="text-xs text-green-400 font-medium animate-fade-in mt-1">
                    {message}
                  </p>
                )}

                {isIOS() && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    💡 iOSで直接保存できない場合は、上の画像を長押しして「“写真”に追加」を選択してください。
                  </p>
                )}
            </div>
        </div>

        <button
            className="absolute right-2 md:right-4 text-white hover:text-gray-300 p-2 md:p-3 bg-black bg-opacity-50 rounded-full z-20"
            onClick={() => onNavigate('next')}
            aria-label="次の写真"
        >
            <ArrowRightIcon className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      </div>
    </div>
  );
};

