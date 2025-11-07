
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

const SYSTEM_DEFAULT_OPTIONS_FIELD_3 = ['定期点検', '6ヶ月点検', '年次点検', '定期清掃'];

const ListSelectionModal: React.FC<{
  isOpen: boolean;
  groupsData: AppData['groups'];
  allGroups: string[];
  selectedGroup: string;
  onGroupChange: (newGroup: string) => void;
  listId: 'field-1' | 'field-2' | 'field-3' | null;
  onSelect: (value: string) => void;
  onClose: () => void;
  onDelete: (group: string, value: string) => void;
}> = ({ isOpen, groupsData, allGroups, selectedGroup, onGroupChange, listId, onSelect, onClose, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen || !listId) return null;
    
    const customOptions = groupsData[selectedGroup]?.[listId] || [];
    let options: string[] = [];

    if (listId === 'field-3') {
        options = [...new Set([...SYSTEM_DEFAULT_OPTIONS_FIELD_3, ...customOptions])];
    } else {
        options = customOptions;
    }

    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const listLabels: { [key: string]: string } = { 'field-1': '設備', 'field-2': '対象', 'field-3': '種類' };
    const listName = listId ? listLabels[listId] : '項目';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{listName}を選択</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="modal-group-selector" className="block text-sm font-medium text-gray-700 mb-1">グループ</label>
                        <select
                            id="modal-group-selector"
                            value={selectedGroup}
                            onChange={(e) => onGroupChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Select group"
                        >
                            {allGroups.map(group => <option key={group} value={group}>{group}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="modal-search-input" className="block text-sm font-medium text-gray-700 mb-1">絞り込み</label>
                        <input
                            id="modal-search-input"
                            type="text"
                            placeholder="検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Filter options"
                        />
                    </div>
                </div>
                <ul className="max-h-64 overflow-y-auto border rounded-md bg-gray-50">
                    {options.length > 0 ? (
                        filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isDefaultItem = listId === 'field-3' && SYSTEM_DEFAULT_OPTIONS_FIELD_3.includes(option);
                                return (
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
                                     {!isDefaultItem && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(selectedGroup, option);
                                            }}
                                            className="p-2 rounded-full ml-2 flex-shrink-0 transition-colors text-red-500 hover:text-red-700 hover:bg-red-100"
                                            aria-label={`Delete option: ${option}`}
                                            title="Delete"
                                        >
                                            <TrashIcon />
                                        </button>
                                     )}
                                </li>
                            )})
                        ) : (
                            <li className="p-3 text-gray-500">一致する項目がありません。</li>
                        )
                    ) : (
                      <li className="p-3 text-gray-500">保存されている項目がありません。</li>
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
  confirmText?: string;
}> = ({ isOpen, message, onConfirm, onCancel, isProcessing, confirmText = '削除' }) => {
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
                    {isProcessing ? `${confirmText}中...` : confirmText}
                </button>
            </div>
        </div>
    </div>
  );
};

const MOCK_API_DELAY = 300;
const DATA_KEY = 'whiteboard-app-data';

interface AppData {
    activeGroup: string;
    groups: {
        [groupName: string]: {
            'field-1': string[];
            'field-2': string[];
            'field-3': string[];
        };
    };
}

const DEFAULT_GROUP_NAME = '共通';

const api = {
    getAppData: async (): Promise<AppData> => {
        return new Promise(resolve => {
            setTimeout(() => {
                try {
                    const data = window.localStorage.getItem(DATA_KEY);
                    if (data) {
                        resolve(JSON.parse(data));
                    } else {
                        const defaultData: AppData = {
                            activeGroup: DEFAULT_GROUP_NAME,
                            groups: {
                                [DEFAULT_GROUP_NAME]: { 'field-1': [], 'field-2': [], 'field-3': [] }
                            }
                        };
                        resolve(defaultData);
                    }
                } catch {
                    const defaultData: AppData = {
                        activeGroup: DEFAULT_GROUP_NAME,
                        groups: {
                            [DEFAULT_GROUP_NAME]: { 'field-1': [], 'field-2': [], 'field-3': [] }
                        }
                    };
                    resolve(defaultData);
                }
            }, MOCK_API_DELAY / 2);
        });
    },
    saveAppData: async (data: AppData): Promise<{ success: boolean; message?: string }> => {
        return new Promise(resolve => {
            setTimeout(() => {
                try {
                    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
                    resolve({ success: true });
                } catch (error) {
                    let message = 'サーバーへの保存に失敗しました。';
                    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                        message = 'サーバーの保存容量が一杯です。';
                    }
                    resolve({ success: false, message });
                }
            }, MOCK_API_DELAY / 2);
        });
    },
    migrateOldData: async (): Promise<boolean> => {
        const oldKey1 = 'server-storage-field-1';
        const oldKey2 = 'server-storage-field-2';
        const oldKey3 = 'server-storage-field-3';
        const oldData1 = window.localStorage.getItem(oldKey1);
        const oldData2 = window.localStorage.getItem(oldKey2);
        const oldData3 = window.localStorage.getItem(oldKey3);

        if (!oldData1 && !oldData2 && !oldData3) {
            return false; // No old data to migrate
        }

        console.log("Migrating old data to new group structure...");
        
        try {
            const list1 = oldData1 ? JSON.parse(oldData1) : [];
            const list2 = oldData2 ? JSON.parse(oldData2) : [];
            let list3 = oldData3 ? JSON.parse(oldData3) : [];
            // Filter out system default items from migrated data to avoid duplication
            list3 = list3.filter((item: string) => !SYSTEM_DEFAULT_OPTIONS_FIELD_3.includes(item));
            
            const newData: AppData = {
                activeGroup: DEFAULT_GROUP_NAME,
                groups: {
                    [DEFAULT_GROUP_NAME]: {
                        'field-1': list1,
                        'field-2': list2,
                        'field-3': list3,
                    }
                }
            };
            await api.saveAppData(newData);

            window.localStorage.removeItem(oldKey1);
            window.localStorage.removeItem(oldKey2);
            window.localStorage.removeItem(oldKey3);
            console.log("Migration successful.");
            return true;
        } catch (error) {
            console.error("Error migrating old data:", error);
            return false;
        }
    }
};

const OFFLINE_QUEUE_KEY = 'offline-action-queue';

type OfflineAction = 
  | { type: 'add'; group: string; listId: string; item: string }
  | { type: 'delete'; group: string; listId: string; item: string }
  | { type: 'replace'; group: string; listId: string; newList: string[] }
  | { type: 'deleteGroup'; group: string }
  | { type: 'setActiveGroup'; group: string };

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
        // For 'replace' and 'setActiveGroup', remove previous actions of the same type for the same target
        const filteredQueue = queue.filter(a => {
            if (action.type === 'replace' && a.type === 'replace' && a.group === action.group && a.listId === action.listId) return false;
            if (action.type === 'setActiveGroup' && a.type === 'setActiveGroup') return false;
            return true;
        });
        filteredQueue.push(action);
        window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
    },
    clearQueue: () => {
        window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
};

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
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  
  const [appData, setAppData] = useState<AppData | null>(null);
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' }>({
    message: '',
    type: 'success',
  });
  const notificationTimerRef = useRef<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const activeGroup = appData?.activeGroup ?? DEFAULT_GROUP_NAME;
  const allGroups = appData ? Object.keys(appData.groups) : [DEFAULT_GROUP_NAME];
  const groupsData = appData?.groups ?? { [DEFAULT_GROUP_NAME]: { 'field-1': [], 'field-2': [], 'field-3': [] }};
  const savedOptionsForField1 = appData?.groups[activeGroup]?.['field-1'] ?? [];
  const savedOptionsForField2 = appData?.groups[activeGroup]?.['field-2'] ?? [];

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

  const fetchInitialData = useCallback(async () => {
    setIsProcessing(true);
    try {
        const migrated = await api.migrateOldData();
        if (migrated) {
            showNotification("データを新しい形式に更新しました。", 'success');
        }
        let data = await api.getAppData();
        
        if (Object.keys(data.groups).length === 0) {
            data.groups[DEFAULT_GROUP_NAME] = { 'field-1': [], 'field-2': [], 'field-3': [] };
            data.activeGroup = DEFAULT_GROUP_NAME;
        }
        if (!data.groups[data.activeGroup]) {
            data.activeGroup = Object.keys(data.groups)[0] || DEFAULT_GROUP_NAME;
        }
        setAppData(data);
    } catch (error) {
        console.error("Failed to fetch initial data:", error);
        showNotification("データの読み込みに失敗しました。", 'error');
    } finally {
        setIsProcessing(false);
    }
  }, [showNotification]);


  const syncOfflineChanges = useCallback(async () => {
    const queue = offlineManager.getQueue();
    if (queue.length === 0) return;

    console.log(`[SYNC] Starting sync for ${queue.length} offline actions.`);
    setIsSyncing(true);
    showNotification("オンラインに復帰しました。変更を同期中...", 'success');
    
    let currentData = await api.getAppData();
    
    try {
        for (const action of queue) {
            switch (action.type) {
                case 'add':
                    if (currentData.groups[action.group]?.[action.listId as keyof typeof currentData.groups[string]] && !currentData.groups[action.group][action.listId as keyof typeof currentData.groups[string]].includes(action.item)) {
                        currentData.groups[action.group][action.listId as keyof typeof currentData.groups[string]].unshift(action.item);
                    }
                    break;
                case 'delete':
                     if (currentData.groups[action.group]?.[action.listId as keyof typeof currentData.groups[string]]) {
                        currentData.groups[action.group][action.listId as keyof typeof currentData.groups[string]] = currentData.groups[action.group][action.listId as keyof typeof currentData.groups[string]].filter(i => i !== action.item);
                    }
                    break;
                case 'replace':
                    if (!currentData.groups[action.group]) {
                        currentData.groups[action.group] = { 'field-1': [], 'field-2': [], 'field-3': [] };
                    }
                    currentData.groups[action.group][action.listId as keyof typeof currentData.groups[string]] = action.newList;
                    break;
                case 'deleteGroup':
                    delete currentData.groups[action.group];
                    if (currentData.activeGroup === action.group) {
                        currentData.activeGroup = Object.keys(currentData.groups)[0] || DEFAULT_GROUP_NAME;
                    }
                    break;
                case 'setActiveGroup':
                    currentData.activeGroup = action.group;
                    break;
            }
        }
        await api.saveAppData(currentData);
        offlineManager.clearQueue();
        showNotification("同期が完了しました。", 'success');
    } catch (error) {
        console.error("[SYNC] Error processing offline queue:", error);
        showNotification("同期中にエラーが発生しました。変更が失われた可能性があります。", 'error');
    } finally {
        await fetchInitialData();
        setIsSyncing(false);
    }
}, [showNotification, fetchInitialData]);


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
    fetchInitialData();
  }, [fetchInitialData]);
  
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

    let listId: 'field-1' | 'field-2' | 'field-3';
    if (index === 1) listId = 'field-1';
    else if (index === 3) listId = 'field-2';
    else if (index === 5) listId = 'field-3';
    else return;

    if (listId === 'field-3' && SYSTEM_DEFAULT_OPTIONS_FIELD_3.includes(textToSave)) {
        showNotification("基本項目はリストに追加できません。", 'error');
        return;
    }
    
    const currentOptions = appData?.groups[activeGroup]?.[listId] ?? [];

    if (currentOptions.includes(textToSave)) {
        showNotification("既に登録されています", 'error');
        return;
    }
    
    if (!isOnline) {
        setAppData(currentData => {
            if (!currentData) return null;
            const newData = JSON.parse(JSON.stringify(currentData)); // deep copy
            if (!newData.groups[activeGroup]) {
                newData.groups[activeGroup] = { 'field-1': [], 'field-2': [], 'field-3': [] };
            }
            const list = newData.groups[activeGroup]?.[listId] ?? [];
            if (!list.includes(textToSave)) {
                newData.groups[activeGroup][listId].unshift(textToSave);
            }
            return newData;
        });
        offlineManager.addToQueue({ type: 'add', group: activeGroup, listId, item: textToSave });
        showNotification("オフラインです。ローカルに保存しました。", 'success');
        return;
    }

    setIsProcessing(true);
    try {
      const currentData = await api.getAppData();
      if (!currentData.groups[activeGroup]) {
          currentData.groups[activeGroup] = { 'field-1': [], 'field-2': [], 'field-3': [] };
      }
      currentData.groups[activeGroup][listId] = [textToSave, ...(currentData.groups[activeGroup]?.[listId] ?? [])];
      const response = await api.saveAppData(currentData);
      if (response.success) {
        await fetchInitialData();
        showNotification("保存されました", 'success');
      } else {
        showNotification(response.message || "保存に失敗しました", 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleImportClick1 = () => fileInputRef1.current?.click();
  const handleImportClick2 = () => fileInputRef2.current?.click();
  
  const handleExportClick = (listId: 'field-1' | 'field-2') => {
    const listData = listId === 'field-1' ? savedOptionsForField1 : savedOptionsForField2;
    const listName = listId === 'field-1' ? LABELS[0] : LABELS[2];
    const filename = `${listName}(${activeGroup}).txt`;

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
        listId: 'field-1' | 'field-2',
        listName: string
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                if (!buffer) {
                    showNotification('ファイルの読み込みに失敗しました。', 'error');
                    return;
                }

                let text: string;
                const uint8 = new Uint8Array(buffer);

                if (uint8.length >= 3 && uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
                    text = new TextDecoder('utf-8').decode(uint8.slice(3));
                } else if (uint8.length >= 2 && uint8[0] === 0xFF && uint8[1] === 0xFE) {
                    text = new TextDecoder('utf-16le').decode(uint8.slice(2));
                } else if (uint8.length >= 2 && uint8[0] === 0xFE && uint8[1] === 0xFF) {
                    text = new TextDecoder('utf-16be').decode(uint8.slice(2));
                } else {
                    try {
                        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                    } catch (error) {
                        try {
                            text = new TextDecoder('shift-jis').decode(buffer);
                        } catch (shiftJisError) {
                             showNotification('ファイルの文字コードを認識できませんでした。', 'error');
                             return;
                        }
                    }
                }

                const linesFromFile = Array.from(new Set(text.split(/\r?\n/).filter(line => line.trim() !== '')));
                
                if (linesFromFile.length === 0) {
                    showNotification('ファイルが空か、有効な項目がありませんでした。', 'error');
                    return;
                }

                const match = file.name.match(/\((.*?)\)\.txt$/);
                const groupFromFile = match ? match[1].trim() : activeGroup;
                
                const processImport = (currentData: AppData): { newData: AppData, newItemsCount: number } => {
                    const newData = JSON.parse(JSON.stringify(currentData));
                    if (!newData.groups[groupFromFile]) {
                        newData.groups[groupFromFile] = { 'field-1': [], 'field-2': [], 'field-3': [] };
                    }
                    const currentItems = newData.groups[groupFromFile]?.[listId] ?? [];
                    const newItems = linesFromFile.filter(line => !currentItems.includes(line));
                    newData.groups[groupFromFile][listId] = [...newItems, ...currentItems];
                    return { newData, newItemsCount: newItems.length };
                };
                
                if(!isOnline) {
                    const { newData, newItemsCount } = processImport(appData!);
                    if (newItemsCount > 0) {
                        offlineManager.addToQueue({ type: 'replace', group: groupFromFile, listId, newList: newData.groups[groupFromFile][listId] });
                        showNotification(`オフラインのためローカルに${newItemsCount}件追加しました。`, 'success');
                    } else {
                        showNotification('追加する新しい項目がありませんでした。', 'success');
                    }
                    newData.activeGroup = groupFromFile;
                    offlineManager.addToQueue({ type: 'setActiveGroup', group: groupFromFile });
                    setAppData(newData);
                    return;
                }

                setIsProcessing(true);
                try {
                    const currentData = await api.getAppData();
                    const { newData, newItemsCount } = processImport(currentData);

                    if (newItemsCount === 0) {
                        showNotification('追加する新しい項目がありませんでした。', 'success');
                    } else {
                        showNotification(`グループ「${groupFromFile}」の「${listName}」リストに${newItemsCount}件追加しました。`, 'success');
                    }
                    newData.activeGroup = groupFromFile;
                    const response = await api.saveAppData(newData);
                    if (response.success) {
                        setAppData(newData);
                    } else {
                        await fetchInitialData(); 
                        showNotification(response.message || "リストの更新に失敗しました。", 'error');
                    }
                } finally {
                    setIsProcessing(false);
                }
            };
            reader.readAsArrayBuffer(file);
        }
        if (event.target) event.target.value = '';
    };


  const handleModalSelect = (value: string) => {
    if (currentTargetIndex !== null) handleTextChange(currentTargetIndex, value);
    setIsModalOpen(false);
  };
  const handleModalClose = () => setIsModalOpen(false);
  const handleCancelConfirmation = () => setConfirmationModal({ isOpen: false, message: '', onConfirm: () => {} });

  const handleConfirmBulkDelete = async (listId: 'field-1' | 'field-2') => {
    const listName = listId === 'field-1' ? LABELS[0] : LABELS[2];
  
    if (!isOnline) {
      setAppData(currentData => {
        if (!currentData) return null;
        const newData = JSON.parse(JSON.stringify(currentData));
        newData.groups[activeGroup][listId] = [];
        return newData;
      });
      offlineManager.addToQueue({ type: 'replace', group: activeGroup, listId, newList: [] });
      showNotification(`オフラインです。「${listName}」リストをローカルで削除しました。`, 'success');
      handleCancelConfirmation();
      return;
    }
  
    setIsProcessing(true);
    try {
        const currentData = await api.getAppData();
        currentData.groups[activeGroup][listId] = [];
        const response = await api.saveAppData(currentData);
        if (response.success) {
            await fetchInitialData();
            showNotification(`「${listName}」リストの全項目を削除しました。`, 'success');
        } else {
            showNotification(response.message || '削除に失敗しました。', 'error');
        }
    } finally {
        setIsProcessing(false);
        handleCancelConfirmation();
    }
  };
  
  const handleBulkDeleteClick = (listId: 'field-1' | 'field-2') => {
    const listName = listId === 'field-1' ? LABELS[0] : LABELS[2];
    setConfirmationModal({
      isOpen: true,
      message: `本当にグループ「${activeGroup}」の「${listName}」リストの全ての項目を削除しますか？`,
      onConfirm: () => handleConfirmBulkDelete(listId),
    });
  };

  const performSingleItemDelete = async (group: string, listId: 'field-1'|'field-2'|'field-3', itemToDelete: string) => {
    if (!isOnline) {
        setAppData(currentData => {
            if (!currentData) return null;
            const newData = JSON.parse(JSON.stringify(currentData));
            const list = newData.groups[group]?.[listId] ?? [];
            newData.groups[group][listId] = list.filter(i => i !== itemToDelete);
            return newData;
        });
        offlineManager.addToQueue({ type: 'delete', group, listId, item: itemToDelete });
        showNotification("オフラインです。ローカルで削除しました。", 'success');
        handleCancelConfirmation();
        return;
    }

    setIsProcessing(true);
    try {
        const currentData = await api.getAppData();
        const list = currentData.groups[group]?.[listId] ?? [];
        currentData.groups[group][listId] = list.filter(item => item !== itemToDelete);
        const response = await api.saveAppData(currentData);

        if (response.success) {
            await fetchInitialData();
            showNotification("項目を削除しました。", 'success');
        } else {
            showNotification(response.message || "削除に失敗しました。", 'error');
        }
    } finally {
      setIsProcessing(false);
      handleCancelConfirmation();
    }
  };

  const handleModalItemDelete = (group: string, item: string) => {
    const listId = getListIdFromIndex(currentTargetIndex);
    if (!listId) return;

    if (listId === 'field-3' && SYSTEM_DEFAULT_OPTIONS_FIELD_3.includes(item)) {
        showNotification("基本項目は削除できません。", 'error');
        return;
    }

    setIsModalOpen(false);
    setConfirmationModal({
        isOpen: true,
        message: `グループ「${group}」のリストから「${item}」を削除しますか？`,
        onConfirm: () => performSingleItemDelete(group, listId, item),
    });
  };

    
    const handleGroupChange = async (newGroup: string) => {
        if (newGroup === activeGroup || !appData) return;
        
        const oldTexts = [...texts];
        const newTexts = [...texts];
        newTexts[1] = '';
        newTexts[3] = '';
        setTexts(newTexts);

        const optimisticData = { ...appData, activeGroup: newGroup };
        setAppData(optimisticData);
    
        if (!isOnline) {
            offlineManager.addToQueue({ type: 'setActiveGroup', group: newGroup });
            return;
        }
    
        setIsProcessing(true);
        try {
            const currentData = await api.getAppData();
            const dataToSave = { ...currentData, activeGroup: newGroup };
            
            const response = await api.saveAppData(dataToSave);
            if (!response.success) {
                setAppData(appData); // Revert on failure
                setTexts(oldTexts);
                showNotification(response.message || "グループの切り替えに失敗しました", 'error');
            }
        } catch(e) {
            setAppData(appData); // Revert on failure
            setTexts(oldTexts);
            showNotification("グループの切り替え中にエラーが発生しました", 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const getListIdFromIndex = (index: number | null): 'field-1' | 'field-2' | 'field-3' | null => {
        if (index === 1) return 'field-1';
        if (index === 3) return 'field-2';
        if (index === 5) return 'field-3';
        return null;
    };

  const isUIBlocked = isProcessing || isSyncing || appData === null;
  
  const commonInputClasses = "w-full bg-transparent text-center text-lg font-marker text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition py-3 px-1 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-500";
  const commonTextareaClasses = `${commonInputClasses} resize-none overflow-hidden`;

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
        <Notification message={notification.message} type={notification.type} />
        <div className="grid grid-cols-[3fr_7fr] gap-x-2 gap-y-1 items-start">
            {texts.map((text, index) => {
              if ([0, 2, 4, 6, 8].includes(index)) {
                return <textarea key={index} id={`whiteboard-input-${index}`} value={text} readOnly rows={1} className={`${commonTextareaClasses} bg-gray-200 cursor-not-allowed sm:mt-0`} aria-label={`ラベル: ${LABELS[index]}`} />;
              }
              if (index === 9) {
                  return <textarea key={index} id={`whiteboard-input-${index}`} value={text} readOnly rows={1} className={`${commonTextareaClasses} bg-gray-200 cursor-not-allowed`} aria-label={`入力欄: ${INPUT_LABELS[index]}`} />;
              }
              if (index === 7) {
                return <input key={index} id={`whiteboard-input-${index}`} type="date" value={text} onChange={(e) => handleTextChange(index, e.target.value)} className={commonInputClasses} aria-label={`入力欄: ${INPUT_LABELS[index]}`} disabled={isUIBlocked} />;
              }
              const isListEnabled = index === 1 || index === 3 || index === 5;
              return (
                <div key={index} className="relative w-full flex items-center">
                  {isListEnabled && (
                      <button onClick={() => handleSetClick(index)} className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 px-3 py-1 text-white rounded-md text-xs font-bold transition-colors shadow-sm ${isUIBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'}`} aria-label="現在のテキストをリストに保存" title="リストに保存" disabled={isUIBlocked}>SET</button>
                  )}
                  <textarea id={`whiteboard-input-${index}`} value={text} onChange={(e) => handleTextChange(index, e.target.value)} onInput={handleTextareaInput} rows={1} className={`${commonTextareaClasses} ${isListEnabled ? 'pl-16 pr-12' : ''}`} placeholder="..." aria-label={`入力欄: ${INPUT_LABELS[index]}`} disabled={isUIBlocked} />
                  {isListEnabled && (
                    <button onClick={() => handleSelectClick(index)} className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isUIBlocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-200'}`} aria-label="保存済みリストから選択" title="リストから選択" disabled={isUIBlocked}><ListIcon /></button>
                  )}
                </div>
              );
            })}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-300 flex items-center justify-center flex-wrap gap-4">
            <div>
                <label htmlFor="main-group-selector" className="block text-sm font-bold text-gray-600 mb-1 text-center">
                操作対象グループ
                </label>
                <select
                id="main-group-selector"
                value={activeGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                disabled={isUIBlocked}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                {allGroups.map(group => <option key={group} value={group}>{group}</option>)}
                </select>
            </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="text-center">
                <h4 className="text-sm font-bold text-gray-600 mb-2">{LABELS[0]} リスト ({activeGroup})</h4>
                <div className="flex flex-col justify-center gap-2">
                    <button onClick={handleImportClick1} className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'}`} disabled={isUIBlocked}><ImportIcon /><span className="ml-2">インポート</span></button>
                    <button onClick={() => handleExportClick('field-1')} className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`} disabled={isUIBlocked} title={`${LABELS[0]}リストを.txtファイルとしてエクスポート`}><ExportIcon /><span className="ml-2">エクスポート</span></button>
                    <button onClick={() => handleBulkDeleteClick('field-1')} className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked || savedOptionsForField1.length === 0 ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`} disabled={isUIBlocked || savedOptionsForField1.length === 0} title={`${LABELS[0]}リストの全項目を削除`}><TrashIcon /><span className="ml-2">一括削除</span></button>
                </div>
            </div>
            <div className="text-center">
                <h4 className="text-sm font-bold text-gray-600 mb-2">{LABELS[2]} リスト ({activeGroup})</h4>
                <div className="flex flex-col justify-center gap-2">
                    <button onClick={handleImportClick2} className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'}`} disabled={isUIBlocked}><ImportIcon /><span className="ml-2">インポート</span></button>
                    <button onClick={() => handleExportClick('field-2')} className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`} disabled={isUIBlocked} title={`${LABELS[2]}リストを.txtファイルとしてエクスポート`}><ExportIcon /><span className="ml-2">エクスポート</span></button>
                    <button onClick={() => handleBulkDeleteClick('field-2')} className={`flex w-full items-center justify-center text-white font-bold py-2 px-3 rounded-md transition-transform transform hover:scale-105 shadow text-xs ${isUIBlocked || savedOptionsForField2.length === 0 ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`} disabled={isUIBlocked || savedOptionsForField2.length === 0} title={`${LABELS[2]}リストの全項目を削除`}><TrashIcon /><span className="ml-2">一括削除</span></button>
                </div>
            </div>
        </div>
        <input type="file" ref={fileInputRef1} onChange={(e) => handleFileRead(e, 'field-1', LABELS[0])} className="hidden" accept=".txt" disabled={isUIBlocked} />
        <input type="file" ref={fileInputRef2} onChange={(e) => handleFileRead(e, 'field-2', LABELS[2])} className="hidden" accept=".txt" disabled={isUIBlocked} />
        <ListSelectionModal 
            isOpen={isModalOpen} 
            groupsData={groupsData} 
            allGroups={allGroups}
            selectedGroup={activeGroup}
            onGroupChange={handleGroupChange}
            listId={getListIdFromIndex(currentTargetIndex)}
            onSelect={handleModalSelect} 
            onClose={handleModalClose} 
            onDelete={handleModalItemDelete}
        />
        <ConfirmationModal isOpen={confirmationModal.isOpen} message={confirmationModal.message} onConfirm={confirmationModal.onConfirm} onCancel={handleCancelConfirmation} isProcessing={isProcessing} confirmText={confirmationModal.confirmText} />
    </div>
  );
};
