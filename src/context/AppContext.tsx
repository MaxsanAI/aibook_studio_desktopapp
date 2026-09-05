import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  Book, Character, Location, PlotPoint, Chapter, Scene, Note, AppSettings,
  GenerationHistoryEntry, ContinuityIssue,
} from '@/types';
import {
  booksRepo, charactersRepo, locationsRepo, plotPointsRepo, chaptersRepo,
  scenesRepo, notesRepo, settingsRepo, generationHistoryRepo, continuityIssuesRepo,
  getCharactersByBook, getLocationsByBook, getPlotPointsByBook, getChaptersByBook,
  getScenesByBook, getNotesByBook, getGenerationHistoryByBook, getContinuityIssuesByBook,
  deleteBookCascade,
} from '@/services/db';
import { createDefaultSettings } from '@/utils/factories';

// ---------------------------------------------------------------------------
// Global App State — the single source of truth for the current session
// ---------------------------------------------------------------------------

interface AppState {
  // Settings
  settings: AppSettings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;

  // Books
  books: Book[];
  currentBook: Book | null;
  loadBooks: () => Promise<void>;
  openBook: (bookId: string) => Promise<void>;
  saveBook: (book: Book) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  closeBook: () => void;

  // Child entities for current book
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  chapters: Chapter[];
  scenes: Scene[];
  notes: Note[];
  generationHistory: GenerationHistoryEntry[];
  continuityIssues: ContinuityIssue[];
  currentChapter: Chapter | null;
  setCurrentChapter: (chapter: Chapter | null) => void;
  saveChapter: (chapter: Chapter) => Promise<void>;
  refreshBookData: () => Promise<void>;

  // Entity saves
  saveCharacter: (char: Character) => Promise<void>;
  saveLocation: (loc: Location) => Promise<void>;
  savePlotPoint: (pp: PlotPoint) => Promise<void>;
  saveScene: (scene: Scene) => Promise<void>;
  saveNote: (note: Note) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  deletePlotPoint: (id: string) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveGenerationHistory: (entry: GenerationHistoryEntry) => Promise<void>;
  saveContinuityIssues: (issues: ContinuityIssue[]) => Promise<void>;

  // Loading state
  loading: boolean;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryEntry[]>([]);
  const [continuityIssues, setContinuityIssues] = useState<ContinuityIssue[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Settings ---
  const loadSettings = useCallback(async () => {
    const existing = await settingsRepo.getById('app-settings');
    if (existing) {
      setSettings(existing);
    } else {
      const defaults = createDefaultSettings();
      await settingsRepo.save({ ...defaults, id: 'app-settings' });
      setSettings(defaults);
    }
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      settingsRepo.save({ ...updated, id: 'app-settings' });
      return updated;
    });
  }, []);

  // --- Books ---
  const loadBooks = useCallback(async () => {
    const allBooks = await booksRepo.getAll();
    allBooks.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    setBooks(allBooks);
  }, []);

  const openBook = useCallback(async (bookId: string) => {
    const book = await booksRepo.getById(bookId);
    if (!book) return;
    book.lastOpenedAt = Date.now();
    await booksRepo.save(book);
    setCurrentBook(book);

    const [chars, locs, plots, chaps, scns, nts, hist, issues] = await Promise.all([
      getCharactersByBook(bookId),
      getLocationsByBook(bookId),
      getPlotPointsByBook(bookId),
      getChaptersByBook(bookId),
      getScenesByBook(bookId),
      getNotesByBook(bookId),
      getGenerationHistoryByBook(bookId),
      getContinuityIssuesByBook(bookId),
    ]);
    setCharacters(chars);
    setLocations(locs);
    setPlotPoints(plots);
    setChapters(chaps);
    setScenes(scns);
    setNotes(nts);
    setGenerationHistory(hist);
    setContinuityIssues(issues);

    // Set current chapter
    if (book.currentChapterId) {
      const ch = chaps.find((c) => c.id === book.currentChapterId);
      if (ch) setCurrentChapter(ch);
    } else if (chaps.length > 0) {
      setCurrentChapter(chaps[0]);
    } else {
      setCurrentChapter(null);
    }

    await loadBooks();
  }, [loadBooks]);

  const saveBook = useCallback(async (book: Book) => {
    book.updatedAt = Date.now();
    await booksRepo.save(book);
    setCurrentBook(book);
    setBooks((prev) => {
      const idx = prev.findIndex((b) => b.id === book.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = book;
        return updated;
      }
      return [book, ...prev];
    });
  }, []);

  const deleteBook = useCallback(async (bookId: string) => {
    await deleteBookCascade(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (currentBook?.id === bookId) {
      setCurrentBook(null);
      setCharacters([]);
      setLocations([]);
      setPlotPoints([]);
      setChapters([]);
      setScenes([]);
      setNotes([]);
      setGenerationHistory([]);
      setContinuityIssues([]);
      setCurrentChapter(null);
    }
  }, [currentBook]);

  const closeBook = useCallback(() => {
    setCurrentBook(null);
    setCharacters([]);
    setLocations([]);
    setPlotPoints([]);
    setChapters([]);
    setScenes([]);
    setNotes([]);
    setGenerationHistory([]);
    setContinuityIssues([]);
    setCurrentChapter(null);
  }, []);

  const refreshBookData = useCallback(async () => {
    if (!currentBook) return;
    const [chars, locs, plots, chaps, scns, nts, hist, issues] = await Promise.all([
      getCharactersByBook(currentBook.id),
      getLocationsByBook(currentBook.id),
      getPlotPointsByBook(currentBook.id),
      getChaptersByBook(currentBook.id),
      getScenesByBook(currentBook.id),
      getNotesByBook(currentBook.id),
      getGenerationHistoryByBook(currentBook.id),
      getContinuityIssuesByBook(currentBook.id),
    ]);
    setCharacters(chars);
    setLocations(locs);
    setPlotPoints(plots);
    setChapters(chaps);
    setScenes(scns);
    setNotes(nts);
    setGenerationHistory(hist);
    setContinuityIssues(issues);
  }, [currentBook]);

  // --- Chapter ---
  const saveChapter = useCallback(async (chapter: Chapter) => {
    chapter.updatedAt = Date.now();
    await chaptersRepo.save(chapter);
    setChapters((prev) => {
      const idx = prev.findIndex((c) => c.id === chapter.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = chapter;
        return updated;
      }
      return [...prev, chapter];
    });
    if (currentChapter?.id === chapter.id) {
      setCurrentChapter(chapter);
    }
  }, [currentChapter]);

  // --- Characters ---
  const saveCharacter = useCallback(async (char: Character) => {
    char.updatedAt = Date.now();
    await charactersRepo.save(char);
    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c.id === char.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = char;
        return updated;
      }
      return [...prev, char];
    });
  }, []);

  const deleteCharacter = useCallback(async (id: string) => {
    await charactersRepo.delete(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // --- Locations ---
  const saveLocation = useCallback(async (loc: Location) => {
    loc.updatedAt = Date.now();
    await locationsRepo.save(loc);
    setLocations((prev) => {
      const idx = prev.findIndex((l) => l.id === loc.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = loc;
        return updated;
      }
      return [...prev, loc];
    });
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    await locationsRepo.delete(id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // --- Plot Points ---
  const savePlotPoint = useCallback(async (pp: PlotPoint) => {
    pp.updatedAt = Date.now();
    await plotPointsRepo.save(pp);
    setPlotPoints((prev) => {
      const idx = prev.findIndex((p) => p.id === pp.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = pp;
        return updated;
      }
      return [...prev, pp];
    });
  }, []);

  const deletePlotPoint = useCallback(async (id: string) => {
    await plotPointsRepo.delete(id);
    setPlotPoints((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // --- Scenes ---
  const saveScene = useCallback(async (scene: Scene) => {
    scene.updatedAt = Date.now();
    await scenesRepo.save(scene);
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === scene.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = scene;
        return updated;
      }
      return [...prev, scene];
    });
  }, []);

  const deleteScene = useCallback(async (id: string) => {
    await scenesRepo.delete(id);
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // --- Notes ---
  const saveNote = useCallback(async (note: Note) => {
    note.updatedAt = Date.now();
    await notesRepo.save(note);
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = note;
        return updated;
      }
      return [...prev, note];
    });
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await notesRepo.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // --- Generation History ---
  const saveGenerationHistory = useCallback(async (entry: GenerationHistoryEntry) => {
    await generationHistoryRepo.save(entry);
    setGenerationHistory((prev) => [entry, ...prev]);
  }, []);

  // --- Continuity Issues ---
  const saveContinuityIssues = useCallback(async (issues: ContinuityIssue[]) => {
    // Delete old issues for this book and save new ones
    const oldIssues = await getContinuityIssuesByBook(currentBook?.id || '');
    await Promise.all(oldIssues.map((i) => continuityIssuesRepo.delete(i.id)));
    await Promise.all(issues.map((i) => continuityIssuesRepo.save(i)));
    setContinuityIssues(issues);
  }, [currentBook]);

  // --- Initial load ---
  useEffect(() => {
    (async () => {
      await loadSettings();
      await loadBooks();
      setLoading(false);
    })();
  }, [loadSettings, loadBooks]);

  // --- Apply theme ---
  useEffect(() => {
    if (!settings) return;
    const apply = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark);
    };
    if (settings.theme === 'dark') apply(true);
    else if (settings.theme === 'light') apply(false);
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings]);

  const value: AppState = {
    settings, loadSettings, updateSettings,
    books, currentBook, loadBooks, openBook, saveBook, deleteBook, closeBook,
    characters, locations, plotPoints, chapters, scenes, notes,
    generationHistory, continuityIssues,
    currentChapter, setCurrentChapter, saveChapter, refreshBookData,
    saveCharacter, saveLocation, savePlotPoint, saveScene, saveNote,
    deleteCharacter, deleteLocation, deletePlotPoint, deleteScene, deleteNote,
    saveGenerationHistory, saveContinuityIssues,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
