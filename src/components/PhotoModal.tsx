import React, { useEffect } from 'react';
import { PhotoRecord } from '../db';
import { CloseIcon, ArrowLeftIcon, ArrowRightIcon } from './Icons';

interface PhotoModalProps {
  photo: PhotoRecord;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ photo, onClose, onNavigate }) => {
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-[60] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-filename"
    >
      <button
        className="absolute top-4 right-4 text-white p-3 bg-black bg-opacity-70 rounded-full hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white transition-opacity z-10"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="閉じる"
      >
        <CloseIcon className="h-8 w-8" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
            className="absolute left-2 md:left-4 text-white hover:text-gray-300 p-2 md:p-3 bg-black bg-opacity-50 rounded-full"
            onClick={() => onNavigate('prev')}
            aria-label="前の写真"
        >
            <ArrowLeftIcon className="h-6 w-6 md:h-8 md:w-8" />
        </button>
        
        <div className="flex flex-col items-center justify-center max-w-full max-h-full">
            <img
                src={photo.dataUrl}
                alt={photo.filename}
                className="max-w-full max-h-[85vh] object-contain block shadow-2xl rounded-md"
            />
            <div className="text-center mt-2 p-2 bg-black bg-opacity-60 rounded-md">
                <p id="photo-modal-filename" className="font-bold text-sm md:text-base">{photo.filename}</p>
                <p className="text-xs md:text-sm text-gray-300">{new Date(photo.createdAt).toLocaleString('ja-JP')}</p>
            </div>
        </div>

        <button
            className="absolute right-2 md:right-4 text-white hover:text-gray-300 p-2 md:p-3 bg-black bg-opacity-50 rounded-full"
            onClick={() => onNavigate('next')}
            aria-label="次の写真"
        >
            <ArrowRightIcon className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      </div>
    </div>
  );
};
