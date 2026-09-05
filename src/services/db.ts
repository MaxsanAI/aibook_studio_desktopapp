import { DB_NAME, DB_VERSION, STORES, INDEXES, type StoreName } from './schema';
import type {
  Book, Character, Location, PlotPoint, Chapter, Scene, Note,
  ChapterVersion, GenerationHistoryEntry, ContinuityIssue, AppSettings,
} from '@/types';

// ---------------------------------------------------------------------------
// IndexedDB wrapper — promise-based, transactional, with atomic writes
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, keyPath] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath });
          const indexProp = (INDEXES as Record<string, string>)[name];
          if (indexProp) {
            store.createIndex(indexProp, indexProp, { unique: false });
          }
        }
      }
    };
  });
}

async function tx<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
  return tx<T[]>(storeName, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

async function getOne<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  return tx<T | undefined>(storeName, 'readonly', (s) => s.get(id) as IDBRequest<T | undefined>);
}

async function putItem<T>(storeName: StoreName, item: T): Promise<void> {
  await tx(storeName, 'readwrite', (s) => s.put(item) as IDBRequest<IDBValidKey>);
}

async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  await tx(storeName, 'readwrite', (s) => s.delete(id) as IDBRequest<undefined>);
}

async function clearStore(storeName: StoreName): Promise<void> {
  await tx(storeName, 'readwrite', (s) => s.clear() as IDBRequest<undefined>);
}

async function getByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Generic repository factory
// ---------------------------------------------------------------------------

interface Repository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  save(item: T): Promise<void>;
  delete(id: string): Promise<void>;
}

function createRepository<T extends { id: string }>(storeName: StoreName): Repository<T> {
  return {
    getAll: () => getAll<T>(storeName),
    getById: (id) => getOne<T>(storeName, id),
    save: (item) => putItem<T>(storeName, item),
    delete: (id) => deleteItem(storeName, id),
  };
}

// ---------------------------------------------------------------------------
// Store names mapping
// ---------------------------------------------------------------------------

export const booksRepo = createRepository<Book>('books');
export const charactersRepo = createRepository<Character>('characters');
export const locationsRepo = createRepository<Location>('locations');
export const plotPointsRepo = createRepository<PlotPoint>('plotPoints');
export const chaptersRepo = createRepository<Chapter>('chapters');
export const scenesRepo = createRepository<Scene>('scenes');
export const notesRepo = createRepository<Note>('notes');
export const versionsRepo = createRepository<ChapterVersion>('versions');
export const generationHistoryRepo = createRepository<GenerationHistoryEntry>('generationHistory');
export const continuityIssuesRepo = createRepository<ContinuityIssue>('continuityIssues');
export const settingsRepo = createRepository<AppSettings>('settings');

// ---------------------------------------------------------------------------
// Query helpers — get child entities by bookId
// ---------------------------------------------------------------------------

export async function getCharactersByBook(bookId: string): Promise<Character[]> {
  return getByIndex<Character>('characters', 'bookId', bookId);
}

export async function getLocationsByBook(bookId: string): Promise<Location[]> {
  return getByIndex<Location>('locations', 'bookId', bookId);
}

export async function getPlotPointsByBook(bookId: string): Promise<PlotPoint[]> {
  return getByIndex<PlotPoint>('plotPoints', 'bookId', bookId);
}

export async function getChaptersByBook(bookId: string): Promise<Chapter[]> {
  const chapters = await getByIndex<Chapter>('chapters', 'bookId', bookId);
  return chapters.sort((a, b) => a.number - b.number);
}

export async function getScenesByChapter(chapterId: string): Promise<Scene[]> {
  return getByIndex<Scene>('scenes', 'chapterId', chapterId);
}

export async function getScenesByBook(bookId: string): Promise<Scene[]> {
  return getByIndex<Scene>('scenes', 'bookId', bookId);
}

export async function getNotesByBook(bookId: string): Promise<Note[]> {
  return getByIndex<Note>('notes', 'bookId', bookId);
}

export async function getVersionsByChapter(chapterId: string): Promise<ChapterVersion[]> {
  const versions = await getByIndex<ChapterVersion>('versions', 'chapterId', chapterId);
  return versions.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getGenerationHistoryByBook(bookId: string): Promise<GenerationHistoryEntry[]> {
  const history = await getByIndex<GenerationHistoryEntry>('generationHistory', 'bookId', bookId);
  return history.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getContinuityIssuesByBook(bookId: string): Promise<ContinuityIssue[]> {
  return getByIndex<ContinuityIssue>('continuityIssues', 'bookId', bookId);
}

// ---------------------------------------------------------------------------
// Cascade delete — remove a book and all its child entities
// ---------------------------------------------------------------------------

export async function deleteBookCascade(bookId: string): Promise<void> {
  const [characters, locations, plots, chapters, scenes, notes, history, issues] = await Promise.all([
    getCharactersByBook(bookId),
    getLocationsByBook(bookId),
    getPlotPointsByBook(bookId),
    getChaptersByBook(bookId),
    getScenesByBook(bookId),
    getNotesByBook(bookId),
    getGenerationHistoryByBook(bookId),
    getContinuityIssuesByBook(bookId),
  ]);

  // Get all chapter versions
  const allVersions = await Promise.all(
    chapters.map((ch) => getVersionsByChapter(ch.id))
  );
  const versionsFlat = allVersions.flat();

  await Promise.all([
    ...characters.map((c) => charactersRepo.delete(c.id)),
    ...locations.map((l) => locationsRepo.delete(l.id)),
    ...plots.map((p) => plotPointsRepo.delete(p.id)),
    ...chapters.map((c) => chaptersRepo.delete(c.id)),
    ...scenes.map((s) => scenesRepo.delete(s.id)),
    ...notes.map((n) => notesRepo.delete(n.id)),
    ...versionsFlat.map((v) => versionsRepo.delete(v.id)),
    ...history.map((h) => generationHistoryRepo.delete(h.id)),
    ...issues.map((i) => continuityIssuesRepo.delete(i.id)),
    booksRepo.delete(bookId),
  ]);
}

// ---------------------------------------------------------------------------
// Export / Import — full project backup as JSON
// ---------------------------------------------------------------------------

export interface ProjectBackup {
  version: string;
  exportedAt: number;
  book: Book;
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  chapters: Chapter[];
  scenes: Scene[];
  notes: Note[];
  versions: ChapterVersion[];
  generationHistory: GenerationHistoryEntry[];
  continuityIssues: ContinuityIssue[];
}

export async function exportProject(bookId: string): Promise<ProjectBackup> {
  const book = await booksRepo.getById(bookId);
  if (!book) throw new Error('Book not found');

  const [characters, locations, plotPoints, chapters, scenes, notes, history, issues] = await Promise.all([
    getCharactersByBook(bookId),
    getLocationsByBook(bookId),
    getPlotPointsByBook(bookId),
    getChaptersByBook(bookId),
    getScenesByBook(bookId),
    getNotesByBook(bookId),
    getGenerationHistoryByBook(bookId),
    getContinuityIssuesByBook(bookId),
  ]);

  const versions = await Promise.all(chapters.map((ch) => getVersionsByChapter(ch.id)));

  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    book,
    characters,
    locations,
    plotPoints,
    chapters,
    scenes,
    notes,
    versions: versions.flat(),
    generationHistory: history,
    continuityIssues: issues,
  };
}

export async function importProject(backup: ProjectBackup): Promise<string> {
  // Generate new IDs to avoid collisions if re-importing
  const newBookId = backup.book.id; // keep same ID for first import

  // Check if book already exists, if so generate new ID
  const existing = await booksRepo.getById(newBookId);
  const bookId = existing ? `${newBookId}-import-${Date.now()}` : newBookId;

  const book: Book = { ...backup.book, id: bookId, lastOpenedAt: Date.now() };
  await booksRepo.save(book);

  const idMap = new Map<string, string>();

  // Remap character IDs
  for (const char of backup.characters) {
    const newId = existing ? `${char.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : char.id;
    idMap.set(char.id, newId);
    await charactersRepo.save({ ...char, id: newId, bookId });
  }

  for (const loc of backup.locations) {
    const newId = existing ? `${loc.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : loc.id;
    idMap.set(loc.id, newId);
    await locationsRepo.save({ ...loc, id: newId, bookId });
  }

  for (const pp of backup.plotPoints) {
    const newId = existing ? `${pp.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : pp.id;
    idMap.set(pp.id, newId);
    await plotPointsRepo.save({ ...pp, id: newId, bookId });
  }

  for (const ch of backup.chapters) {
    const newId = existing ? `${ch.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : ch.id;
    idMap.set(ch.id, newId);
    await chaptersRepo.save({ ...ch, id: newId, bookId });
  }

  for (const sc of backup.scenes) {
    const newId = existing ? `${sc.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : sc.id;
    const newChapterId = idMap.get(sc.chapterId) ?? sc.chapterId;
    await scenesRepo.save({ ...sc, id: newId, bookId, chapterId: newChapterId });
  }

  for (const note of backup.notes) {
    const newId = existing ? `${note.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : note.id;
    await notesRepo.save({ ...note, id: newId, bookId });
  }

  for (const v of backup.versions) {
    const newId = existing ? `${v.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : v.id;
    const newChapterId = idMap.get(v.chapterId) ?? v.chapterId;
    await versionsRepo.save({ ...v, id: newId, chapterId: newChapterId });
  }

  for (const h of backup.generationHistory) {
    const newId = existing ? `${h.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : h.id;
    await generationHistoryRepo.save({ ...h, id: newId, bookId });
  }

  for (const ci of backup.continuityIssues) {
    const newId = existing ? `${ci.id}-imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : ci.id;
    await continuityIssuesRepo.save({ ...ci, id: newId, bookId });
  }

  return bookId;
}

// ---------------------------------------------------------------------------
// Atomic write — safe save that preserves previous version on failure
// ---------------------------------------------------------------------------

export async function safeSaveChapter(
  chapter: Chapter,
  previousContent: string,
  label?: string
): Promise<void> {
  // Save a version snapshot first
  if (previousContent && previousContent !== chapter.content) {
    const version: ChapterVersion = {
      id: `${chapter.id}-v-${Date.now()}`,
      chapterId: chapter.id,
      content: previousContent,
      wordCount: countWords(previousContent),
      label: label || 'Auto-save',
      createdAt: Date.now(),
    };
    await versionsRepo.save(version);
  }
  // Then save the chapter
  await chaptersRepo.save(chapter);
}

export function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  const words = stripped.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

export { clearStore, getAll as getAllFromStore };
