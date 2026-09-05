// IndexedDB schema configuration

export const DB_NAME = 'ai-book-studio';
export const DB_VERSION = 1;

export const STORES = {
  books: 'id',
  characters: 'id',
  locations: 'id',
  plotPoints: 'id',
  chapters: 'id',
  scenes: 'id',
  notes: 'id',
  versions: 'id',
  generationHistory: 'id',
  continuityIssues: 'id',
  settings: 'id',
} as const;

export type StoreName = keyof typeof STORES;

// Indexes to create (storeName -> indexProperty)
export const INDEXES = {
  characters: 'bookId',
  locations: 'bookId',
  plotPoints: 'bookId',
  chapters: 'bookId',
  scenes: 'bookId',
  notes: 'bookId',
  versions: 'chapterId',
  generationHistory: 'bookId',
  continuityIssues: 'bookId',
} as const;
