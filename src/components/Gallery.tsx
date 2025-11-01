import React, { useState, useEffect, useCallback } from 'react';
import { PhotoRecord, getAllPhotos, deletePhotos } from '../db';
import { ArrowLeftIcon, TrashIcon, DownloadIcon, CheckCircleIcon } from './Icons';

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

  const handleDownload = () => {
    if (selectedIds.size === 0) return;
    const photosToDownload = photos.filter(p => selectedIds.has(p.id));
    
    photosToDownload.forEach((photo, index) => {
      // Stagger downloads slightly to avoid browser blocking them
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = photo.dataUrl;
        link.download = photo.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 200);
    });
  };

  const hasSelection = selectedIds.size > 0;
  
  return (
    <div className="fixed inset-0 bg-gray-800 z-50 flex flex-col p-4 text-white">
      <header className="flex items-center justify-start pb-4 border-b border-gray-600">
        <h2 className="text-2xl font-bold">保存した写真</h2>
      </header>
      
      <div className="flex items-center gap-4 py-4 flex-wrap">
        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm flex items-center gap-2" aria-label="撮影画面に戻る">
          <ArrowLeftIcon className="h-5 w-5" />
          <span>撮影に戻る</span>
        </button>
        <button onClick={handleSelectAll} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
          {selectedIds.size === photos.length && photos.length > 0 ? '選択解除' : 'すべて選択'}
        </button>
        <button onClick={handleDownload} disabled={!hasSelection} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed text-sm">
          <DownloadIcon />
          <span>{hasSelection ? `${selectedIds.size}枚` : ''} ダウンロード</span>
        </button>
        <button onClick={handleDelete} disabled={!hasSelection} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-red-800 disabled:cursor-not-allowed text-sm">
          <TrashIcon />
          <span>{hasSelection ? `${selectedIds.size}枚` : ''} 削除</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-center mt-10">読み込み中...</p>
        ) : photos.length === 0 ? (
          <p className="text-center mt-10 text-gray-400">保存された写真はありません。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map(photo => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div key={photo.id} className="relative aspect-[4/3] cursor-pointer group" onClick={() => toggleSelection(photo.id)}>
                  <img src={photo.dataUrl} alt={`Photo taken on ${photo.createdAt.toLocaleString()}`} className="w-full h-full object-cover rounded-md" />
                  <div className={`absolute inset-0 bg-black transition-opacity rounded-md ${isSelected ? 'opacity-40' : 'opacity-0 group-hover:opacity-20'}`}></div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 text-blue-400 bg-white rounded-full">
                      <CheckCircleIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        message={`選択した ${selectedIds.size} 枚の写真を削除しますか？この操作は元に戻せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};