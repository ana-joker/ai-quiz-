import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { StoredPdfData, StoredPdfMeta } from '../types';

const DB_NAME = 'AIQuizDB';
const STORE_NAME = 'processed_pdfs';
const DB_VERSION = 2; // Incremented version due to schema change (implicit removal of images)

interface AIQuizDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: StoredPdfData;
    indexes: { 'createdAt': Date };
  };
}

let dbPromise: Promise<IDBPDatabase<AIQuizDB>>;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AIQuizDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
           const store = db.createObjectStore(STORE_NAME, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
};

export const addPdfData = async (data: Omit<StoredPdfData, 'id' | 'createdAt'>): Promise<number> => {
  const db = await initDB();
  // Ensure 'images' property is not saved
  const { text, filename } = data as any;
  const dataToStore = { text, filename };

  const fullData: Omit<StoredPdfData, 'id'> = { ...dataToStore, createdAt: new Date() };
  return db.add(STORE_NAME, fullData as StoredPdfData);
};

export const getAllPdfsMeta = async (): Promise<StoredPdfMeta[]> => {
    const db = await initDB();
    const allData = await db.getAll(STORE_NAME);
    // Sort by most recent first
    allData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    // Return only metadata to keep the list lightweight
    return allData.map(({ id, filename, createdAt }) => ({ id: id!, filename, createdAt }));
};

export const getPdfData = async (id: number): Promise<StoredPdfData | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const deletePdf = async (id: number): Promise<void> => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};
