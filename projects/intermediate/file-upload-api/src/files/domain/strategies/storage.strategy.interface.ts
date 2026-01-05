import { Readable } from 'stream';

export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface IStorageStrategy {
  /**
   * Save a file to storage
   * @param file The file to save
   * @param filename The filename to use in storage
   * @returns The storage path where the file was saved
   */
  save(file: StorageFile, filename: string): Promise<string>;

  /**
   * Get a file as a buffer
   * @param storagePath The path in storage
   * @returns The file contents as a buffer
   */
  get(storagePath: string): Promise<Buffer>;

  /**
   * Get a file as a readable stream
   * @param storagePath The path in storage
   * @returns A readable stream of the file
   */
  getStream(storagePath: string): Promise<Readable>;

  /**
   * Delete a file from storage
   * @param storagePath The path in storage
   */
  delete(storagePath: string): Promise<void>;

  /**
   * Get the URL for accessing the file
   * @param storagePath The path in storage
   * @returns The URL to access the file
   */
  getUrl(storagePath: string): Promise<string>;

  /**
   * Check if a file exists
   * @param storagePath The path in storage
   * @returns True if the file exists
   */
  exists(storagePath: string): Promise<boolean>;
}

export const STORAGE_STRATEGY = Symbol('STORAGE_STRATEGY');
