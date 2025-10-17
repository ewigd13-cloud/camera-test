const DB_NAME = 'PhotoBoothDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

export interface PhotoRecord {
  id: number;
  dataUrl: string;
  filename: string;
  createdAt: Date;
}

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject("IndexedDB error");
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
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
