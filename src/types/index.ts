// ============================================================================
// AI Book Studio — Core Type Definitions
// ============================================================================

export type ID = string;
export type Timestamp = number;

// ---------------------------------------------------------------------------
// Book / Project
// ---------------------------------------------------------------------------

export type BookType =
  | 'Novel' | 'Short Story' | 'Novella' | 'Memoir' | 'Biography'
  | 'Self Help' | 'Business' | 'Nonfiction' | 'Fantasy' | 'Romance'
  | 'Mystery' | 'Thriller' | 'Horror' | 'Science Fiction'
  | 'Historical Fiction' | "Children's Book" | 'Other';

export type BookLength = 'Short' | 'Novella' | 'Standard Novel' | 'Long Novel' | 'Custom';

export type PointOfView = 'First Person' | 'Second Person' | 'Third Person Limited' | 'Third Person Omniscient' | 'Mixed';
export type Tense = 'Past' | 'Present' | 'Mixed';
export type NarrativeStyle = 'Linear' | 'Non-linear' | 'Epistolary' | 'Stream of Consciousness' | 'Frame Story';
export type Pacing = 'Slow-burn' | 'Moderate' | 'Fast-paced' | 'Variable';

export interface WritingStyle {
  narrativeStyle: NarrativeStyle;
  tone: string;
  pointOfView: PointOfView;
  tense: Tense;
  complexity: string;
  pacing: Pacing;
  dialogueStyle: string;
  descriptionLevel: string;
  paragraphStyle: string;
  customInstructions: string;
  professionalMode: boolean;
}

export interface BookBible {
  premise: string;
  themes: string[];
  genre: string;
  subgenre: string;
  tone: string;
  writingStyleSummary: string;
  pointOfView: string;
  timeline: string;
  worldRules: string[];
  importantFacts: string[];
  plotThreads: PlotThread[];
  openQuestions: string[];
  ending: string;
}

export interface PlotThread {
  id: ID;
  name: string;
  description: string;
  status: 'open' | 'resolved' | 'abandoned';
}

export interface Book {
  id: ID;
  title: string;
  author: string;
  idea: string;
  genre: string;
  subgenre: string;
  language: string;
  targetAudience: string;
  bookType: BookType;
  bookLength: BookLength;
  targetWordCount: number;
  writingStyle: WritingStyle;
  bible: BookBible;
  coverDataUrl: string | null;
  coverPrompt: string;
  metadata: BookMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastOpenedAt: Timestamp;
  currentChapterId: ID | null;
}

export interface BookMetadata {
  shortDescription: string;
  longDescription: string;
  authorBio: string;
  keywords: string[];
  categories: string[];
  marketingHook: string;
  tagline: string;
  backCoverText: string;
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

export interface Character {
  id: ID;
  bookId: ID;
  name: string;
  age: string;
  gender: string;
  role: string;
  appearance: string;
  personality: string;
  background: string;
  occupation: string;
  goals: string;
  motivation: string;
  fear: string;
  strengths: string;
  weaknesses: string;
  relationships: CharacterRelationship[];
  arc: string;
  secrets: string;
  importantFacts: string;
  status: string;
  color: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CharacterRelationship {
  id: ID;
  characterName: string;
  type: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Locations / World
// ---------------------------------------------------------------------------

export interface Location {
  id: ID;
  bookId: ID;
  name: string;
  description: string;
  appearance: string;
  atmosphere: string;
  geography: string;
  importantObjects: string;
  history: string;
  rules: string;
  connectedCharacters: string[];
  sceneCount: number;
  // Fantasy / sci-fi extended fields
  worldRules: string;
  magicSystem: string;
  technology: string;
  cultures: string;
  organizations: string;
  politicalSystems: string;
  species: string;
  languages: string;
  isWorldEntry: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Plot
// ---------------------------------------------------------------------------

export type PlotType = 'main' | 'subplot' | 'thread';

export interface PlotPoint {
  id: ID;
  bookId: ID;
  type: PlotType;
  title: string;
  description: string;
  conflict: string;
  resolution: string;
  involvedCharacters: string[];
  chapterIds: ID[];
  order: number;
  status: 'planned' | 'active' | 'resolved';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Chapters & Scenes
// ---------------------------------------------------------------------------

export interface ChapterSummary {
  summary: string;
  importantEvents: string[];
  charactersInvolved: string[];
  locations: string[];
  newFacts: string[];
  unresolvedThreads: string[];
  characterChanges: string[];
  timelineEvents: string[];
  importantObjects: string[];
}

export interface Chapter {
  id: ID;
  bookId: ID;
  title: string;
  number: number;
  purpose: string;
  summaryText: string;
  mainEvents: string;
  characters: string[];
  location: string;
  conflict: string;
  emotionalBeat: string;
  importantDetails: string;
  endingHook: string;
  targetWordCount: number;
  content: string;
  aiSummary: ChapterSummary | null;
  status: 'outline' | 'draft' | 'written' | 'edited';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Scene {
  id: ID;
  chapterId: ID;
  bookId: ID;
  number: number;
  location: string;
  time: string;
  characters: string[];
  objective: string;
  conflict: string;
  emotion: string;
  action: string;
  importantInfo: string;
  transition: string;
  sceneEnding: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface Note {
  id: ID;
  bookId: ID;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Version History
// ---------------------------------------------------------------------------

export interface ChapterVersion {
  id: ID;
  chapterId: ID;
  content: string;
  wordCount: number;
  label: string;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// AI Settings & Generation
// ---------------------------------------------------------------------------

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
}

export interface GenerationHistoryEntry {
  id: ID;
  bookId: ID;
  chapterId: ID | null;
  action: string;
  prompt: string;
  result: string;
  tokensUsed: number;
  creditsUsed: number;
  status: 'success' | 'failed' | 'cancelled';
  createdAt: Timestamp;
}

export type AIAction =
  | 'continue' | 'rewrite' | 'improve' | 'expand' | 'shorten'
  | 'change-tone' | 'improve-dialogue' | 'make-literary' | 'make-cinematic'
  | 'make-emotional' | 'improve-description' | 'fix-grammar' | 'proofread'
  | 'show-dont-tell' | 'increase-tension' | 'improve-pacing'
  | 'create-alternative' | 'custom';

// ---------------------------------------------------------------------------
// Continuity
// ---------------------------------------------------------------------------

export type ContinuitySeverity = 'error' | 'warning' | 'info';

export interface ContinuityIssue {
  id: ID;
  bookId: ID;
  severity: ContinuitySeverity;
  category: string;
  description: string;
  chapterNumbers: number[];
  suggestion: string;
  resolved: boolean;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Application Settings
// ---------------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark' | 'system';
export type ExportFormat = 'pdf' | 'docx' | 'epub';

export interface ExportPreset {
  id: string;
  name: string;
  format: ExportFormat;
  pageSize: string;
  width: number; // inches
  height: number; // inches
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
  lineHeight: number;
  includeTitlePage: boolean;
  includeCopyright: boolean;
  includeTOC: boolean;
  includePageNumbers: boolean;
  includeCover: boolean;
}

export interface AppSettings {
  id: string;
  theme: ThemeMode;
  fontSize: number;
  editorWidth: 'narrow' | 'normal' | 'wide';
  autosaveInterval: number; // seconds
  defaultExportFormat: ExportFormat;
  defaultLanguage: string;
  aiSettings: AISettings;
  credits: number;
  licenseKey: string;
  licenseStatus: 'unlicensed' | 'active' | 'expired' | 'revoked';
  licenseActivatedAt: Timestamp | null;
  lastLicenseCheck: Timestamp | null;
  onboardingCompleted: boolean;
  customExportPresets: ExportPreset[];
}

// ---------------------------------------------------------------------------
// License
// ---------------------------------------------------------------------------

export interface LicenseInfo {
  key: string;
  status: 'unlicensed' | 'active' | 'expired' | 'revoked';
  deviceName: string;
  activatedAt: Timestamp | null;
  expiresAt: Timestamp | null;
  type: 'lifetime' | 'subscription' | 'trial';
}

// ---------------------------------------------------------------------------
// Continuity Check Result
// ---------------------------------------------------------------------------

export interface ContinuityCheckResult {
  issues: ContinuityIssue[];
  checkedAt: Timestamp;
  totalChapters: number;
}
