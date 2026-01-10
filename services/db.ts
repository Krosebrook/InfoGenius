/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GeneratedImage } from '../types';

const DB_NAME = 'InfoGeniusDB';
const STORE_NAME = 'saved_images';
const DB_VERSION = 1;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject("IndexedDB not supported");
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Error opening database');

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve();
  });
};

export const saveImageToDB = (image: GeneratedImage): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(image);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject('Error saving image');
    };
    request.onerror = () => reject('Error opening DB for save');
  });
};

export const removeImageFromDB = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject('Error deleting image');
    };
    request.onerror = () => reject('Error opening DB for delete');
  });
};

export const getAllSavedImages = (): Promise<GeneratedImage[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject('Error fetching images');
    };
    request.onerror = () => reject('Error opening DB for fetch');
  });
};
