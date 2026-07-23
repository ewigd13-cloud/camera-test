import React, { useState, useEffect, useCallback } from 'react';
import { PhotoRecord, getAllPhotos, deletePhotos } from '../db';
import { ArrowLeftIcon, TrashIcon, DownloadIcon, CheckCircleIcon, ShareIcon } from './Icons';
import { PhotoModal } from './PhotoModal';
import { saveOrShareMultiplePhotos, isIOS } from '../utils/download';

interface GalleryProps {
  onClose: () => void;
}

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
  
    return (
      <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4"
          onClick={onCancel}
          aria-modal="true"
          role="dialog"
      >
          <div 
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
          >
              <h3 className="text-lg font-bold text-gray-800 mb-4">確認</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex justify-end gap-4">
                  <button 
                      onClick={onCancel} 
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                      キャンセル
                  </button>
                  <button 
                      onClick={onConfirm}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                      削除
                  </button>
              </div>
          </div>
      </div>
    );
  };


export const Gallery: React.FC<GalleryProps> = ({ onClose }) => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<PhotoRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedPhotos = await getAllPhotos();
      setPhotos(savedPhotos);
    } catch (error) {
      console.error("Failed to load photos from DB", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const toggleSelection = (id: number) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handlePhotoClick = (photo: PhotoRecord) => {
    const isSelected = selectedIds.has(photo.id);
    const isOnlyOneSelected = selectedIds.size === 1;

    // If this photo is the only one selected, and it's tapped again, open the viewer and clear selection.
    if (isOnlyOneSelected && isSelected) {
      setViewingPhoto(photo);
      // Deselect the photo so that after closing the modal, the user doesn't get stuck.
      setSelectedIds(new Set());
    } else {
      // Otherwise, just toggle the selection for this photo.
      toggleSelection(photo.id);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!viewingPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === viewingPhoto.id);
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % photos.length;
    } else {
        nextIndex = (currentIndex - 1 + photos.length) % photos.length;
    }
    setViewingPhoto(photos[nextIndex]);
  };


  const handleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map(p => p.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsConfirmModalOpen(true);
  };
  
  const confirmDelete = async () => {
    try {
      await deletePhotos(Array.from(selectedIds));
      setPhotos(photos.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to delete photos", error);
    } finally {
        setIsConfirmModalOpen(false);
    }
  };

  const handleDownload = async () => {
    if (selectedIds.size === 0 || isProcessing) return;
    const photosToDownload = photos.filter(p => selectedIds.has(p.id));
    
    setIsProcessing(true);
    setStatusMessage('処理中...');
    try {
      const res = await saveOrShareMultiplePhotos(photosToDownload);
      if (res.method === 'share' && res.success) {
        setStatusMessage(`${res.count}枚の写真の共有・保存ダイアログを開きました`);
      } else if (res.method === 'download' && res.success) {
        setStatusMessage(`${res.count}枚の写真のダウンロードを開始しました`);
      }
    } catch (err) {
      console.error('Download error:', err);
      setStatusMessage('保存処理に失敗しました');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const hasSelection = selectedIds.size > 0;
  
  return (
    <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col p-4 text-white">
      <header className="flex items-center justify-between pb-4 border-b border-gray-600">
        <h2 className="text-2xl font-bold">保存した写真</h2>
        {statusMessage && (
          <span className="text-sm bg-blue-900 text-blue-200 px-3 py-1 rounded-full animate-fade-in">
            {statusMessage}
          </span>
        )}
      </header>
      
      <div className="flex items-center gap-4 py-4 flex-wrap">
        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm flex items-center gap-2" aria-label="撮影画面に戻る">
          <ArrowLeftIcon className="h-5 w-5" />
          <span>撮影に戻る</span>
        </button>
        <button onClick={handleSelectAll} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
          {selectedIds.size === photos.length && photos.length > 0 ? '選択解除' : 'すべて選択'}
        </button>
        <button onClick={handleDownload} disabled={!hasSelection || isProcessing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed text-sm">
          <ShareIcon className="h-4 w-4" />
          <span>{hasSelection ? `${selectedIds.size}枚` : ''} 保存・共有</span>
        </button>
        <button onClick={handleDelete} disabled={!hasSelection || isProcessing} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-red-800 disabled:cursor-not-allowed text-sm">
          <TrashIcon />
          <span>{hasSelection ? `${selectedIds.size}枚` : ''} 削除</span>
        </button>
      </div>

      {isIOS() && (
        <div className="bg-blue-950/70 border border-blue-500/40 text-blue-200 p-2.5 rounded-md text-xs mb-3">
          💡 iOSで保存できない場合: 「保存・共有」ボタンをタップすると標準の共有シートが開き、「画像を保存」から写真アプリへ保存できます。また、写真をタップして拡大表示し、長押しで保存することも可能です。
        </div>
      )}

      <main className="flex-1 overflow-y-auto pt-2">
        {isLoading ? (
          <p className="text-center text-gray-400">写真を読み込んでいます...</p>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {photos.map(photo => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className="relative aspect-square bg-gray-700 rounded-md overflow-hidden cursor-pointer group"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img src={photo.dataUrl} alt={photo.filename} className={`w-full h-full object-cover transition-transform duration-200 ease-in-out ${isSelected ? 'scale-90 opacity-70' : 'group-hover:scale-105'}`} />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center">
                      <CheckCircleIcon className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <p className="text-xs font-semibold truncate">{photo.filename}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-400">保存されている写真はありません。</p>
        )}
      </main>
      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        message={`選択した ${selectedIds.size} 枚の写真を削除しますか？この操作は元に戻せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
      {viewingPhoto && (
        <PhotoModal 
            photo={viewingPhoto} 
            onClose={() => setViewingPhoto(null)}
            onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};
