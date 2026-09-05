import { nanoid } from 'nanoid';
import type {
  Book, Chapter, Character, Location, Note, WritingStyle, BookBible,
  BookMetadata, AppSettings, Scene, PlotPoint,
} from '@/types';

// ---------------------------------------------------------------------------
// Factory functions for creating new entities with sensible defaults
// ---------------------------------------------------------------------------

export function createDefaultWritingStyle(): WritingStyle {
  return {
    narrativeStyle: 'Linear',
    tone: 'Engaging',
    pointOfView: 'Third Person Limited',
    tense: 'Past',
    complexity: 'Accessible',
    pacing: 'Moderate',
    dialogueStyle: 'Natural',
    descriptionLevel: 'Moderate',
    paragraphStyle: 'Standard',
    customInstructions: '',
    professionalMode: true,
  };
}

export function createDefaultBible(): BookBible {
  return {
    premise: '',
    themes: [],
    genre: 'Fiction',
    subgenre: '',
    tone: '',
    writingStyleSummary: '',
    pointOfView: '',
    timeline: '',
    worldRules: [],
    importantFacts: [],
    plotThreads: [],
    openQuestions: [],
    ending: '',
  };
}

export function createDefaultMetadata(): BookMetadata {
  return {
    shortDescription: '',
    longDescription: '',
    authorBio: '',
    keywords: [],
    categories: [],
    marketingHook: '',
    tagline: '',
    backCoverText: '',
  };
}

export function createBook(params: Partial<Book> & { title: string }): Book {
  const now = Date.now();
  return {
    id: nanoid(),
    author: 'Unknown Author',
    idea: '',
    genre: 'Fiction',
    subgenre: '',
    language: 'English',
    targetAudience: 'General',
    bookType: 'Novel',
    bookLength: 'Standard Novel',
    targetWordCount: 70000,
    writingStyle: createDefaultWritingStyle(),
    bible: createDefaultBible(),
    coverDataUrl: null,
    coverPrompt: '',
    metadata: createDefaultMetadata(),
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    currentChapterId: null,
    ...params,
  };
}

export function createChapter(bookId: string, number: number, title?: string): Chapter {
  const now = Date.now();
  return {
    id: nanoid(),
    bookId,
    title: title || `Chapter ${number}`,
    number,
    purpose: '',
    summaryText: '',
    mainEvents: '',
    characters: [],
    location: '',
    conflict: '',
    emotionalBeat: '',
    importantDetails: '',
    endingHook: '',
    targetWordCount: 3000,
    content: '',
    aiSummary: null,
    status: 'outline',
    createdAt: now,
    updatedAt: now,
  };
}

export function createCharacter(bookId: string): Character {
  const now = Date.now();
  const colors = ['#e8891c', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
  return {
    id: nanoid(),
    bookId,
    name: 'New Character',
    age: '',
    gender: '',
    role: '',
    appearance: '',
    personality: '',
    background: '',
    occupation: '',
    goals: '',
    motivation: '',
    fear: '',
    strengths: '',
    weaknesses: '',
    relationships: [],
    arc: '',
    secrets: '',
    importantFacts: '',
    status: 'active',
    color: colors[Math.floor(Math.random() * colors.length)],
    createdAt: now,
    updatedAt: now,
  };
}

export function createLocation(bookId: string): Location {
  const now = Date.now();
  return {
    id: nanoid(),
    bookId,
    name: 'New Location',
    description: '',
    appearance: '',
    atmosphere: '',
    geography: '',
    importantObjects: '',
    history: '',
    rules: '',
    connectedCharacters: [],
    sceneCount: 0,
    worldRules: '',
    magicSystem: '',
    technology: '',
    cultures: '',
    organizations: '',
    politicalSystems: '',
    species: '',
    languages: '',
    isWorldEntry: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createPlotPoint(bookId: string, type: 'main' | 'subplot' | 'thread'): PlotPoint {
  const now = Date.now();
  return {
    id: nanoid(),
    bookId,
    type,
    title: 'New Plot Point',
    description: '',
    conflict: '',
    resolution: '',
    involvedCharacters: [],
    chapterIds: [],
    order: 0,
    status: 'planned',
    createdAt: now,
    updatedAt: now,
  };
}

export function createScene(chapterId: string, bookId: string, number: number): Scene {
  const now = Date.now();
  return {
    id: nanoid(),
    chapterId,
    bookId,
    number,
    location: '',
    time: '',
    characters: [],
    objective: '',
    conflict: '',
    emotion: '',
    action: '',
    importantInfo: '',
    transition: '',
    sceneEnding: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function createNote(bookId: string): Note {
  const now = Date.now();
  return {
    id: nanoid(),
    bookId,
    title: 'New Note',
    content: '',
    category: 'General',
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultSettings(): AppSettings {
  return {
    id: 'app-settings',
    theme: 'system',
    fontSize: 16,
    editorWidth: 'normal',
    autosaveInterval: 30,
    defaultExportFormat: 'pdf',
    defaultLanguage: 'English',
    aiSettings: {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
      streamingEnabled: true,
    },
    credits: 10000,
    licenseKey: '',
    licenseStatus: 'unlicensed',
    licenseActivatedAt: null,
    lastLicenseCheck: null,
    onboardingCompleted: false,
    customExportPresets: [],
  };
}

// ---------------------------------------------------------------------------
// Word count utility (works on HTML content)
// ---------------------------------------------------------------------------

export function countWords(html: string): number {
  if (!html) return 0;
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ');
  return stripped.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export function readingTime(words: number): string {
  const minutes = Math.ceil(words / 250);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  const day = 86400000;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < day) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}
