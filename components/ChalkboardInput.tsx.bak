import React, { useCallback, useState, useRef, useEffect } from 'react';
import { ListIcon, ImportIcon, TrashIcon, CloseIcon, ExportIcon } from './Icons';

interface WhiteboardGridInputProps {
  texts: string[];
  setTexts: (texts: string[]) => void;
}

const Notification: React.FC<{
  message: string;
  type: 'success' | 'error';
}> = ({ message, type }) => {
    const isOpen = !!message;

    const baseClasses = "fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white font-bold shadow-2xl transition-all duration-300 transform z-[100]";
    const typeClasses = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const animationClasses = isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none';

    return (
        <div className={`${baseClasses} ${typeClasses} ${animationClasses}`} role="alert" aria-live="assertive">
            {message}
        </div>
    );
};

const ListSelectionModal: React.FC<{
  isOpen: boolean;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
  onDelete: (value: string) => void;
  isDeletable?: (value: string) => boolean;
}> = ({ isOpen, options, onSelect, onClose, onDelete, isDeletable = () => true }) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">項目を選択</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="絞り込み検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter options"
                    />
                </div>
                <ul className="max-h-72 overflow-y-auto border rounded-md bg-gray-50">
                    {options.length > 0 ? (
                        filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <li 
                                    key={option} 
                                    className="flex justify-between items-center p-3 hover:bg-blue-100 border-b last:border-b-0 transition-colors text-gray-700"
                                >
                                    <span 
                                        onClick={() => onSelect(option)} 
                                        className="cursor-pointer flex-grow"
                                        tabIndex={0}
                                        onKeyPress={(e) => e.key === 'Enter' && onSelect(option)}
                                    >
                                        {option}
                                    </span>
                                     <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(option);
                                        }}
                                        disabled={!isDeletable(option)}
                                        className={`p-2 rounded-full ml-2 flex-shrink-0 transition-colors ${
                                            isDeletable(option)
                                                ? 'text-red-500 hover:text-red-700 hover:bg-red-100'
                                                : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        aria-label={`Delete option: ${option}`}
                                        title={isDeletable(option) ? "Delete" : "この項目は削除できません"}
                                    >
                                        <TrashIcon />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="p-3 text-gray-500">一致する項目がありません。</li>
                        )
                    ) : (
                      <li className="p-3 text-gray-500">保存されている項目がありません。「.txtからインポート」ボタンを使って追加してください。</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}> = ({ isOpen, message, onConfirm, onCancel, isProcessing }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
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
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    disabled={isProcessing}
                >
                    キャンセル
                </button>
                <button 
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-wait"
                    disabled={isProcessing}
                >
                    {isProcessing ? '削除中...' : '削除'}
                </button>
            </div>
        </div>
    </div>
  );
};


const MOCK_API_DELAY = 300;

// This is a mock API service.
const api = {
  getList: async (listId: string): Promise<string[]> => {
    console.log(`[API MOCK] Fetching list: ${listId}`);
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const data = window.localStorage.getItem(`server-storage-${listId}`);
          const parsed = data ? JSON.parse(data) : [];
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            resolve(parsed);
          } else {
            resolve([]);
          }
        } catch {
          resolve([]);
        }
      }, MOCK_API_DELAY);
    });
  },
  addItem: async (listId: string, item: string): Promise<{ success: boolean; message?: string; newList?: string[] }> => {
    console.log(`[API MOCK] Adding item "${item}" to list: ${listId}`);
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
            const currentItems = await api.getList(listId);
            if (currentItems.includes(item)) {
              resolve({ success: false, message: '既に登録されています' });
            } else {
              const newList = [item, ...currentItems];
              window.localStorage.setItem(`server-storage-${listId}`, JSON.stringify(newList));
              resolve({ success: true, newList });
            }
        } catch (error) {
            console.error(`[API MOCK] Error adding item to list ${listId}:`, error);
            let message = 'サーバーへの保存に失敗しました。';
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                message = 'サーバーの保存容量が一杯のため、項目を追加できませんでした。';
            }
            resolve({ success: false, message });
        }
      }, MOCK_API_DELAY);
    });
  },
  deleteItem: async (listId: string, itemToDelete: string): Promise<{ success: boolean; message?: string; newList?: string[] }> => {
    console.log(`[API MOCK] Deleting item "${itemToDelete}" from list: ${listId}`);
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
            const currentItems = await api.getList(listId);
            const newList = currentItems.filter((i: string) => i !== itemToDelete);
            window.localStorage.setItem(`server-storage-${listId}`, JSON.stringify(newList));
            resolve({ success: true, newList });
        } catch (error) {
            console.error(`[API MOCK] Error deleting item from list ${listId}:`, error);
            resolve({ success: false, message: 'サーバーからの削除に失敗しました。' });
        }
      }, MOCK_API_DELAY);
    });
  },
  replaceList: async (listId: string, newList: string[]): Promise<{ success: boolean; message?: string; newList?: string[] }> => {
    console.log(`[API MOCK] Replacing list ${listId} with ${newList.length} items`);
    return new Promise(resolve => {
      setTimeout(() => {
        try {
            window.localStorage.setItem(`server-storage-${listId}`, JSON.stringify(newList));
            resolve({ success: true, newList });
        } catch (error) {
            console.error(`[API MOCK] Error replacing list ${listId}:`, error);
            let message = 'サーバーへの保存に失敗しました。';
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                message = 'サーバーの保存容量が一杯のため、リストをインポートできませんでした。';
            }
            resolve({ success: false, message });
        }
      }, MOCK_API_DELAY);
    });
  }
};

const OFFLINE_QUEUE_KEY = 'offline-action-queue';

type OfflineAction = 
  | { type: 'add'; listId: string; item: string }
  | { type: 'delete'; listId: string; item: string }
  | { type: 'replace'; listId: string; newList: string[] };

const offlineManager = {
  getQueue: (): OfflineAction[] => {
    try {
      const data = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
      return [];
    }
  },
  addToQueue: (action: OfflineAction) => {
    const queue = offlineManager.getQueue();
    queue.push(action);
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },
  clearQueue: () => {
    window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
};


const DEFAULT_OPTIONS_FIELD_3 = ['定期点検', '6ヶ月点検', '年次点検', '定期清掃'];

const LABELS: { [key: number]: string } = {
    0: '設備',
    2: '対象',
    4: '種類',
    6: '日付',
    8: '会社名',
};
const INPUT_LABELS: { [key: number]: string } = {
    1: '設備',
    3: '対象',
    5: '種類',
    7: '日付',
    9: '会社名',
};

export const WhiteboardGridInput: React.FC<WhiteboardGridInputProps> = ({ texts, setTexts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number | null>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const [savedOptionsForField1, setSavedOptionsForField1] = useState<string[]>([]);
  const [savedOptionsForField2, setSavedOptionsForField2] = useState<string[]>([]);
  const [savedOptionsForField3, setSavedOptionsForField3] = useState<string[]>([]);
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' }>({
    message: '',
    type: 'success',
  });
  const notificationTimerRef = useRef<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });


  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
      if (notificationTimerRef.current) {
          clearTimeout(notificationTimerRef.current);
      }
      setNotification({ message, type });
      notificationTimerRef.current = window.setTimeout(() => {
          setNotification({ message: '', type: 'success' });
          notificationTimerRef.current = null;
      }, 3000);
  }, []);

  const syncOfflineChanges = useCallback(async () => {
    const queue = offlineManager.getQueue();
    if (queue.length === 0) return;

    console.log(`[SYNC] Starting sync for ${queue.length} offline actions.`);
    setIsSyncing(true);
    showNotification("オンラインに復帰しました。変更を同期中...", 'success');

    try {
        for (const action of queue) {
            switch (action.type) {
                case 'add':
                    await api.addItem(action.listId, action.item);
                    break;
                case 'delete':
                    await api.deleteItem(action.listId, action.item);
                    break;
                case 'replace':
                    await api.replaceList(action.listId, action.newList);
                    break;
            }
        }
        offlineManager.clearQueue();
        showNotification("同期が完了しました。", 'success');
    } catch (error) {
        console.error("[SYNC] Error processing offline queue:", error);
        showNotification("同期中にエラーが発生しました。変更が失われた可能性があります。", 'error');
    } finally {
        const [list1, list2, list3] = await Promise.all([
            api.getList('field-1'),
            api.getList('field-2'),
            api.getList('field-3'),
        ]);
        setSavedOptionsForField1(list1);
        setSavedOptionsForField2(list2);
        setSavedOptionsForField3(list3);

        setIsSyncing(false);
    }
}, [showNotification]);


  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}, []);

useEffect(() => {
    if (isOnline) {
        syncOfflineChanges();
    }
}, [isOnline, syncOfflineChanges]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [list1, list2, list3] = await Promise.all([
          api.getList('field-1'),
          api.getList('field-2'),
          api.getList('field-3'),
        ]);
        setSavedOptionsForField1(list1);
        setSavedOptionsForField2(list2);
        if (list3.length > 0) {
          setSavedOptionsForField3(list3);
        } else {
          await api.replaceList('field-3', DEFAULT_OPTIONS_FIELD_3);
          setSavedOptionsForField3(DEFAULT_OPTIONS_FIELD_3);
        }
      } catch (error) {
        console.error("Failed to fetch initial lists from server:", error);
        showNotification("リストの読み込みに失敗しました。", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [showNotification]);
  
  const handleTextChange = (index: number, value: string) => {
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };

  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  const handleSelectClick = (index: number) => {
    setCurrentTargetIndex(index);
    setIsModalOpen(true);
  };

  const handleSetClick = async (index: number) => {
    const textToSave = texts[index]?.trim();
    if (!textToSave) {
        showNotification("保存するテキストを入力してください。", 'error');
        return;
    }

    let listId: string;
    let setter: React.Dispatch<React.SetStateAction<string[]>>;
    let currentOptions: string[];

    if (index === 1) {
      listId = 'field-1';
      setter = setSavedOptionsForField1;
      currentOptions = savedOptionsForField1;
    } else if (index === 3) {
      listId = 'field-2';
      setter = setSavedOptionsForField2;
      currentOptions = savedOptionsForField2;
    } else if (index === 5) {
      listId = 'field-3';
      setter = setSavedOptionsForField3;
      currentOptions = savedOptionsForField3;
    } else {
      return;
    }

    if (currentOptions.includes(textToSave)) {
        showNotification("既に登録されています", 'error');
        return;
    }

    if (!isOnline) {
        setter(prev => [textToSave, ...prev]);
        offlineManager.addToQueue({ type: 'add', listId, item: textToSave });
        showNotification("オフラインです。ローカルに保存しました。", 'success');
        return;
    }

    setIsLoading(true);
    try {
      const response = await api.addItem(listId, textToSave);
      if (response.success && response.newList) {
        setter(response.newList);
        showNotification("保存されました", 'success');
      } else {
        showNotification(response.message || "保存に失敗しました", 'error');
      }
    } catch (error) {
      console.error(`Failed to save item to list ${listId}:`, error);
      showNotification("保存に失敗しました。", 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImportClick1 = () => {
    fileInputRef1.current?.click();
  };
  
  const handleImportClick2 = () => {
    fileInputRef2.current?.click();
  };
  
  const handleExportClick = (listId: 'field-1' | 'field-2') => {
    const listData = listId === 'field-1' ? savedOptionsForField1 : savedOptionsForField2;
    const filename = listId === 'field-1' ? '設備.txt' : '対象.txt';

    if (listData.length === 0) {
        showNotification('リストにエクスポートする項目がありません。', 'error');
        return;
    }
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    const fileContent = listData.join('\n');
    const blob = new Blob([bom, fileContent], { type: 'text/plain;charset=utf-8' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleFileRead = async (
    event: React.ChangeEvent<HTMLInputElement>,
    listId: string,
    setOptions: React.Dispatch<React.SetStateAction<string[]>>,
    listName: string
  ) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
              try {
                  const text = e.target?.result as string;
                  // ファイルから読み込んだ行を重複排除
                  const linesFromFile = Array.from(new Set(text.split(/\r?\n/).filter(line => line.trim() !== '')));

                  if (linesFromFile.length === 0) {
                      showNotification('ファイルが空か、有効な項目がありませんでした。', 'error');
                      return;
                  }
                  
                  // listId に基づいて現在のリストデータを取得
                  const currentOptions = listId === 'field-1' ? savedOptionsForField1 : savedOptionsForField2;

                  // 現在のリストに含まれていない新しい項目のみをフィルタリング
                  const newItems = linesFromFile.filter(line => !currentOptions.includes(line));

                  if (newItems.length === 0) {
                      showNotification('追加する新しい項目がありませんでした。', 'success');
                      return;
                  }

                  // 新しい項目を既存のリストの先頭に追加
                  const mergedList = [...newItems, ...currentOptions];

                  if (!isOnline) {
                      setOptions(mergedList);
                      // オフラインキューには差分ではなく、最終的な状態を保存
                      offlineManager.addToQueue({ type: 'replace', listId, newList: mergedList });
                      showNotification(`オフラインのためローカルに${newItems.length}件追加しました。オンライン時に同期されます。`, 'success');
                      return;
                  }
                  
                  setIsLoading(true);
                  // サーバー上のリストをマージ後のリストで置き換え
                  const response = await api.replaceList(listId, mergedList);
                  if (response.success && response.newList) {
                      setOptions(response.newList);
                      showNotification(`「${listName}」リストに${newItems.length}件の新しい項目を追加しました。`, 'success');
                  } else {
                      showNotification(response.message || "リストの更新に失敗しました。", 'error');
                  }

              } catch (error) {
                  console.error("Failed to process or save file data:", error);
                  showNotification("ファイルの処理中にエラーが発生しました。", 'error');
              } finally {
                  setIsLoading(false);
              }
          };
          reader.onerror = () => {
              console.error("Failed to read file");
              showNotification("選択されたファイルを読み込めませんでした。", 'error');
          };
          reader.readAsText(file);
      }
      // ファイル選択ダイアログをリセットして、同じファイルを再度選択できるようにする
      if(event.target) {
          event.target.value = '';
      }
  };

  const handleModalSelect = (value: string) => {
    if (currentTargetIndex !== null) {
        handleTextChange(currentTargetIndex, value);
    }
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleCancelConfirmation = () => {
    setConfirmationModal({ isOpen: false, message: '', onConfirm: () => {} });
  };

  const handleConfirmBulkDelete = async (listId: 'field-1' | 'field-2') => {
    const listName = listId === 'field-1' ? LABELS[0] : LABELS[2];
    const setter = listId === 'field-1' ? setSavedOptionsForField1 : setSavedOptionsForField2;
  
    if (!isOnline) {
      setter([]);
      offlineManager.addToQueue({ type: 'replace', listId, newList: [] });
      showNotification(`オフラインです。「${listName}」リストをローカルで削除しました。`, 'success');
      handleCancelConfirmation();
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await api.replaceList(listId, []);
      if (response.success) {
        setter([]);
        showNotification(`「${listName}」リストの全項目を削除しました。`, 'success');
      } else {
        showNotification(response.message || '削除に失敗しました。', 'error');
      }
    } catch (error) {
      console.error(`Failed to delete list ${listId}:`, error);
      showNotification('削除中にエラーが発生しました。', 'error');
    } finally {
      setIsLoading(false);
      handleCancelConfirmation();
    }
  };
  
  const handleBulkDeleteClick = (listId: 'field-1' | 'field-2') => {
    const listName = listId === 'field-1' ? LABELS[0] : LABELS[2];
    setConfirmationModal({
      isOpen: true,
      message: `本当に「${listName}」リストの全ての項目を削除しますか？この操作は元に戻せません。`,
      onConfirm: () => handleConfirmBulkDelete(listId),
    });
  };

  const performSingleItemDelete = async (listId: string, itemToDelete: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!isOnline) {
        setter(prev => prev.filter(item => item !== itemToDelete));
        offlineManager.addToQueue({ type: 'delete', listId, item: itemToDelete });
        showNotification("オフラインです。ローカルで削除しました。", 'success');
        handleCancelConfirmation();
        return;
    }

    setIsLoading(true);
    try {
      const response = await api.deleteItem(listId, itemToDelete);
      if (response.success && response.newList) {
        setter(response.newList);
        showNotification("項目を削除しました。", 'success');
      } else {
        showNotification(response.message || "削除に失敗しました。", 'error');
      }
    } catch (error) {
      console.error(`Failed to delete item from list ${listId}:`, error);
      showNotification("削除に失敗しました。", 'error');
    } finally {
      setIsLoading(false);
      handleCancelConfirmation();
    }
  };

  const getModalProps = () => {
    const createDeleteHandler = (listId: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      return (optionToDelete: string) => {
        setIsModalOpen(false); 
        setConfirmationModal({
            isOpen: true,
            message: `本当に「${optionToDelete}」を削除しますか？`,
            onConfirm: () => performSingleItemDelete(listId, optionToDelete, setter),
        });
      };
    };

    if (currentTargetIndex === 1) {
      return {
        options: savedOptionsForField1,
        onDelete: createDeleteHandler('field-1', setSavedOptionsForField1),
      };
    }
    if (currentTargetIndex === 3) {
      return {
        options: savedOptionsForField2,
        onDelete: createDeleteHandler('field-2', setSavedOptionsForField2),
      };
    }
    if (currentTargetIndex === 5) {
      return {
        options: savedOptionsForField3,
        onDelete: createDeleteHandler('field-3', setSavedOptionsForField3),
      };
    }
    // FIX: The fallback onDelete function must match the expected signature `(value: string) => void`.
    return { options: [], onDelete: (value: string) => {} };
  };
  const modalProps = getModalProps();
  const isUIBlocked = isLoading || isSyncing;

  const isOptionDeletable = useCallback((option: string) => {
    if (currentTargetIndex !== 5) { // index 5 is for '種類' (field-3)
        return true;
    }
    return !DEFAULT_OPTIONS_FIELD_3.includes(option);
  }, [currentTargetIndex]);
  
  const commonInputClasses = "w-full bg-transparent text-center text-lg font-marker text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition py-3 px-1 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500";
  const commonTextareaClasses = `${commonInputClasses} resize-none overflow-hidden`;

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
        <Notification message={notification.message} type={notification.type} />
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            ホワイトボード入力欄
        </label>
        <div className="grid grid-cols-[3fr_7fr] gap-x-2 gap-y-1 items-start">
            {texts.map((text, index) => {
              if ([0, 2, 4, 6, 8].includes(index)) {
                return (
                  <textarea
                    key={index}
                    id={`whiteboard-input-${index}`}
                    value={text}
                    readOnly
                    rows={1}
                    className={`${commonTextareaClasses} bg-gray-200 cursor-not-allowed sm:mt-0`}
                    aria-label={`ラベル: ${LABELS[index]}`}
                  />
                );
              }

              if (index === 9) {
                  return (
                      <textarea
                          key={index}
                          id={`whiteboard-input-${index}`}
                          value={text}
                          readOnly
                          rows={1}
                          className={`${commonTextareaClasses} bg-gray-200 cursor-not-allowed`}
                          aria-label={`入力欄: ${INPUT_LABELS[index]}`}
                      />
                  );
              }

              if (index === 7) {
                return (
                  <input
                    key={index}
                    id={`whiteboard-input-${index}`}
                    type="date"
                    value={text}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    className={commonInputClasses}
                    aria-label={`入力欄: ${INPUT_LABELS[index]}`}
                    disabled={isUIBlocked}
                  />
                );
              }
              
              const isListEnabled = index === 1 || index === 3 || index === 5;

              return (
                <div key={index} className="relative w-full flex items-center">
                  {isListEnabled && (
                      <button
                          onClick={() => handleSetClick(index)}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 px-3 py-1 text-white rounded-md text-xs font-bold transition-colors shadow-sm ${isUIBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'}`}
                          aria-label="Save current text to list"
                          title="Save to list"
                          disabled={isUIBlocked}
                      >
                          SET
                      </button>
                  )}
                  <textarea
                      id={`whiteboard-input-${index}`}
                      value={text}
                      onChange={(e) => handleTextChange(index, e.target.value)}
                      onInput={handleTextareaInput}
                      rows={1}
                      className={`${commonTextareaClasses} ${isListEnabled ? 'pl-16 pr-12' : ''}`}
                      placeholder="..."
                      aria-label={`入力欄: ${INPUT_LABELS[index]}`}
                      disabled={isUIBlocked}
                  />
                  {isListEnabled && (
                    <button
                        onClick={() => handleSelectClick(index)}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isUIBlocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200'}`}
                        aria-label="Select from saved options"
                        title="Select from list"
                        disabled={isUIBlocked}
                    >
                        <ListIcon />
                    </button>
                  )}
                </div>
              );
            })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 items-start">
            <div className="text-center">
                <h4 className="text-sm font-bold text-gray-600 mb-2">{LABELS[0]} リスト</h4>
                <div className="flex flex-col justify-center gap-2">
                    <button
                        onClick={handleImportClick1}
                        className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'}`}
                        disabled={isUIBlocked}
                    >
                        <ImportIcon />
                        <span className="ml-2">インポート</span>
                    </button>
                    <button
                        onClick={() => handleExportClick('field-1')}
                        className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                        disabled={isUIBlocked}
                        title={`${LABELS[0]}リストを.txtファイルとしてエクスポート`}
                    >
                        <ExportIcon />
                        <span className="ml-2">エクスポート</span>
                    </button>
                    <button
                        onClick={() => handleBulkDeleteClick('field-1')}
                        className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked || savedOptionsForField1.length === 0 ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                        disabled={isUIBlocked || savedOptionsForField1.length === 0}
                        title={`${LABELS[0]}リストの全項目を削除`}
                    >
                        <TrashIcon />
                        <span className="ml-2">一括削除</span>
                    </button>
                </div>
            </div>
            <div className="text-center">
                <h4 className="text-sm font-bold text-gray-600 mb-2">{LABELS[2]} リスト</h4>
                <div className="flex flex-col justify-center gap-2">
                    <button
                        onClick={handleImportClick2}
                        className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'}`}
                        disabled={isUIBlocked}
                    >
                        <ImportIcon />
                        <span className="ml-2">インポート</span>
                    </button>
                     <button
                        onClick={() => handleExportClick('field-2')}
                        className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                        disabled={isUIBlocked}
                        title={`${LABELS[2]}リストを.txtファイルとしてエクスポート`}
                    >
                        <ExportIcon />
                        <span className="ml-2">エクスポート</span>
                    </button>
                    <button
                        onClick={() => handleBulkDeleteClick('field-2')}
                        className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked || savedOptionsForField2.length === 0 ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                        disabled={isUIBlocked || savedOptionsForField2.length === 0}
                        title={`${LABELS[2]}リストの全項目を削除`}
                    >
                        <TrashIcon />
                        <span className="ml-2">一括削除</span>
                    </button>
                </div>
            </div>
        </div>
        <input
            type="file"
            ref={fileInputRef1}
            onChange={(e) => handleFileRead(e, 'field-1', setSavedOptionsForField1, LABELS[0])}
            className="hidden"
            accept=".txt"
            disabled={isUIBlocked}
        />
        <input
            type="file"
            ref={fileInputRef2}
            onChange={(e) => handleFileRead(e, 'field-2', setSavedOptionsForField2, LABELS[2])}
            className="hidden"
            accept=".txt"
            disabled={isUIBlocked}
        />
        <ListSelectionModal 
            isOpen={isModalOpen}
            options={modalProps.options}
            onSelect={handleModalSelect}
            onClose={handleModalClose}
            onDelete={modalProps.onDelete}
            isDeletable={isOptionDeletable}
        />
        <ConfirmationModal
            isOpen={confirmationModal.isOpen}
            message={confirmationModal.message}
            onConfirm={confirmationModal.onConfirm}
            onCancel={handleCancelConfirmation}
            isProcessing={isLoading}
        />
    </div>
  );
};
