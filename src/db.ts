
// URLのパス（GitHub Pagesのリポジトリ名など）から一意の識別子を生成します。
const getDBIdentifier = () => {
  // window.location.pathname は `/<repo-name>/` のような形式になります。
  const pathParts = window.location.pathname.split('/').filter(part => part !== '');
  
  // 開発サーバー(localhost)のようにパスが存在しない場合や、予期せぬ形式の場合のフォールバック処理です。
  if (pathParts.length === 0) {
    // NODE_ENV を使って開発環境かどうかを判定します。
    // 開発環境では 'dev'、それ以外（本番のルートドメインなど）では 'default' を返します。
    return process.env.NODE_ENV === 'development' ? 'dev' : 'default';
  }
  
  // GitHub Pages 環境では、最初のパス部分（リポジトリ名）を識別子として使用します。
  return pathParts[0];
};

// 識別子を使って、環境ごとに一意のデータベース名を生成します。
const DB_NAME = `PhotoBoothDB_${getDBIdentifier()}`;
const DB_VERSION = 1;
const STORE_NAME = 'photos';

export interface PhotoRecord {
  id: number;
  dataUrl: string;
  filename: string;
  createdAt: Date;
}

let db: IDBDatabase;

// DBインスタンスを環境ごとに保持するためのオブジェクト
const dbInstances: { [key: string]: IDBDatabase } = {};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // 現在の環境に対応するDBインスタンスがあればそれを返す
    if (dbInstances[DB_NAME]) {
      return resolve(dbInstances[DB_NAME]);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error(`IndexedDB error (${DB_NAME}):`, (event.target as IDBOpenDBRequest).error);
      reject(`IndexedDB error (${DB_NAME})`);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // 成功したインスタンスを保存
      dbInstances[DB_NAME] = db;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const store = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const addPhoto = async (dataUrl: string, filename: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const photo = { dataUrl, filename, createdAt: new Date() };

    const request = store.add(photo);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error("Error adding photo:", (event.target as IDBRequest).error);
      reject("Error adding photo");
    };
  });
};

export const getAllPhotos = async (): Promise<PhotoRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const request = index.getAll();

    request.onsuccess = (event) => {
      const photos = (event.target as IDBRequest<PhotoRecord[]>).result;
      // Reverse to show newest first
      resolve(photos.reverse());
    };

    request.onerror = (event) => {
      console.error("Error getting photos:", (event.target as IDBRequest).error);
      reject("Error getting photos");
    };
  });
};


export const deletePhotos = async (ids: number[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
  
      transaction.oncomplete = () => {
        resolve();
      };
  
      transaction.onerror = (event) => {
        console.error("Transaction error deleting photos:", (event.target as IDBTransaction).error);
        reject("Transaction error deleting photos");
      };
  
      if (ids.length === 0) {
        return resolve();
      }

      ids.forEach(id => {
        const request = store.delete(id);
        request.onerror = (event) => {
          console.error(`Error deleting photo with id ${id}:`, (event.target as IDBRequest).error);
          // Don't reject, just log and continue
        };
      });
    });
  };