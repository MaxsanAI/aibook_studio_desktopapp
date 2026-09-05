import type { Book, Chapter, Character, BookType, WritingStyle, BookBible, BookMetadata } from '@/types';
import { nanoid } from 'nanoid';
import { booksRepo, chaptersRepo, charactersRepo } from './db';

// ---------------------------------------------------------------------------
// Manuscript Import — TXT, MD
// ---------------------------------------------------------------------------

export interface ImportResult {
  book: Book;
  chapters: Chapter[];
  characterNames: string[];
  locationNames: string[];
  totalWords: number;
}

export async function importManuscript(
  file: File,
  author: string,
  existingBook?: Book
): Promise<ImportResult> {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  let title = file.name.replace(/\.[^.]+$/, '');
  let chapters: { title: string; content: string }[] = [];
  let characterNames: string[] = [];
  let locationNames: string[] = [];

  if (ext === 'md' || ext === 'markdown') {
    const result = parseMarkdown(text);
    title = result.title || title;
    chapters = result.chapters;
  } else {
    chapters = parsePlainText(text);
  }

  // Try to extract character names (capitalized words that appear frequently)
  characterNames = extractCharacterNames(text);
  locationNames = extractLocationNames(text);

  const totalWords = countWordsInText(text);

  const now = Date.now();
  const bookId = existingBook?.id || nanoid();

  const writingStyle: WritingStyle = {
    narrativeStyle: 'Linear',
    tone: existingBook?.writingStyle.tone || 'Engaging',
    pointOfView: existingBook?.writingStyle.pointOfView || 'Third Person Limited',
    tense: existingBook?.writingStyle.tense || 'Past',
    complexity: existingBook?.writingStyle.complexity || 'Accessible',
    pacing: existingBook?.writingStyle.pacing || 'Moderate',
    dialogueStyle: existingBook?.writingStyle.dialogueStyle || 'Natural',
    descriptionLevel: existingBook?.writingStyle.descriptionLevel || 'Moderate',
    paragraphStyle: existingBook?.writingStyle.paragraphStyle || 'Standard',
    customInstructions: existingBook?.writingStyle.customInstructions || '',
    professionalMode: existingBook?.writingStyle.professionalMode ?? true,
  };

  const bible: BookBible = existingBook?.bible || {
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

  const metadata: BookMetadata = existingBook?.metadata || {
    shortDescription: '',
    longDescription: '',
    authorBio: '',
    keywords: [],
    categories: [],
    marketingHook: '',
    tagline: '',
    backCoverText: '',
  };

  const book: Book = existingBook || {
    id: bookId,
    title,
    author: author || 'Unknown Author',
    idea: `Imported from ${file.name}`,
    genre: 'Fiction',
    subgenre: '',
    language: 'English',
    targetAudience: 'General',
    bookType: 'Novel' as BookType,
    bookLength: 'Standard Novel',
    targetWordCount: Math.max(totalWords, 50000),
    writingStyle,
    bible,
    coverDataUrl: null,
    coverPrompt: '',
    metadata,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    currentChapterId: null,
  };

  book.updatedAt = now;
  book.lastOpenedAt = now;
  await booksRepo.save(book);

  // Create chapter records
  const chapterRecords: Chapter[] = [];
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const chapterId = nanoid();
    const chapter: Chapter = {
      id: chapterId,
      bookId,
      title: ch.title || `Chapter ${i + 1}`,
      number: i + 1,
      purpose: '',
      summaryText: '',
      mainEvents: '',
      characters: [],
      location: '',
      conflict: '',
      emotionalBeat: '',
      importantDetails: '',
      endingHook: '',
      targetWordCount: Math.round(countWordsInText(ch.content) * 1.2),
      content: ch.content,
      aiSummary: null,
      status: 'written',
      createdAt: now,
      updatedAt: now,
    };
    await chaptersRepo.save(chapter);
    chapterRecords.push(chapter);
  }

  // Create basic character records for extracted names
  for (const name of characterNames.slice(0, 10)) {
    const charId = nanoid();
    const character: Character = {
      id: charId,
      bookId,
      name,
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
      importantFacts: `Extracted from imported manuscript.`,
      status: 'active',
      color: generateCharColor(),
      createdAt: now,
      updatedAt: now,
    };
    await charactersRepo.save(character);
  }

  // Set current chapter to first
  if (chapterRecords.length > 0) {
    book.currentChapterId = chapterRecords[0].id;
    await booksRepo.save(book);
  }

  return { book, chapters: chapterRecords, characterNames, locationNames, totalWords };
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseMarkdown(text: string): { title: string; chapters: { title: string; content: string }[] } {
  const lines = text.split('\n');
  let title = '';
  const chapters: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    // H1 = book title or chapter title
    if (line.startsWith('# ')) {
      if (!title) {
        title = line.slice(2).trim();
      } else {
        if (currentContent.length > 0 || currentTitle) {
          chapters.push({ title: currentTitle, content: contentToHtml(currentContent.join('\n')) });
        }
        currentTitle = line.slice(2).trim();
        currentContent = [];
      }
    } else if (line.startsWith('## ')) {
      if (currentContent.length > 0 || currentTitle) {
        chapters.push({ title: currentTitle, content: contentToHtml(currentContent.join('\n')) });
      }
      currentTitle = line.slice(3).trim();
      currentContent = [];
    } else if (line.startsWith('### ')) {
      currentContent.push(`<h3>${line.slice(4).trim()}</h3>`);
    } else if (line.startsWith('> ')) {
      currentContent.push(`<blockquote>${line.slice(2).trim()}</blockquote>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      currentContent.push(`<ul><li>${line.slice(2).trim()}</li></ul>`);
    } else if (line.match(/^\d+\.\s/)) {
      const itemText = line.replace(/^\d+\.\s/, '');
      currentContent.push(`<ol><li>${itemText}</li></ol>`);
    } else if (line.trim() === '---') {
      currentContent.push('<hr/>');
    } else if (line.trim()) {
      // Bold and italic
      const processed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      currentContent.push(`<p>${processed}</p>`);
    }
  }

  if (currentContent.length > 0 || currentTitle) {
    chapters.push({ title: currentTitle, content: contentToHtml(currentContent.join('\n')) });
  }

  return { title, chapters };
}

function parsePlainText(text: string): { title: string; content: string }[] {
  // Split by "Chapter X" headings
  const chapterRegex = /(?:^|\n)\s*(?:Chapter|CHAPTER|chapter)\s+(\d+|[IVXLCDM]+)\s*[:.\-\n]\s*([^\n]*)/g;
  const matches: { index: number; number: string; title: string }[] = [];
  let match;

  while ((match = chapterRegex.exec(text)) !== null) {
    matches.push({ index: match.index, number: match[1], title: match[2].trim() });
  }

  if (matches.length === 0) {
    // No chapter markers — treat whole text as one chapter
    return [{ title: 'Chapter 1', content: contentToHtml(text) }];
  }

  const chapters: { title: string; content: string }[] = [];

  // Content before first chapter heading = preamble
  if (matches[0].index > 0) {
    const preamble = text.slice(0, matches[0].index).trim();
    if (preamble.length > 100) {
      chapters.push({ title: 'Introduction', content: contentToHtml(preamble) });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const chapterText = text.slice(start, end).trim();
    // Remove the chapter heading line from content
    const contentStart = chapterText.indexOf('\n');
    const content = contentStart >= 0 ? chapterText.slice(contentStart + 1).trim() : chapterText;
    chapters.push({
      title: `Chapter ${matches[i].number}: ${matches[i].title}`.replace(/:\s*$/, ''),
      content: contentToHtml(content),
    });
  }

  return chapters;
}

function contentToHtml(text: string): string {
  if (text.includes('<p>') || text.includes('<h')) return text;
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  return paragraphs.map((p) => {
    const trimmed = p.trim();
    if (trimmed.startsWith('<')) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');
}

function extractCharacterNames(text: string): string[] {
  // Find capitalized words that appear multiple times (likely character names)
  const words = text.match(/\b[A-Z][a-z]{2,15}\b/g) || [];
  const counts: Record<string, number> = {};
  for (const word of words) {
    const w = word.toLowerCase();
    if (['the', 'and', 'but', 'for', 'not', 'you', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'let', 'put', 'say', 'she', 'too', 'use', 'yes'].includes(w)) continue;
    counts[word] = (counts[word] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

function extractLocationNames(text: string): string[] {
  // Find capitalized words preceded by "in", "at", "to", "from", "near"
  const locationPattern = /(?:^|\s)(?:in|at|to|from|near|inside|outside|beyond)\s+([A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15})?)/g;
  const locations: string[] = [];
  let match;
  while ((match = locationPattern.exec(text)) !== null) {
    const name = match[1];
    if (!locations.includes(name)) locations.push(name);
  }
  return locations.slice(0, 10);
}

function countWordsInText(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, ' ');
  return stripped.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function generateCharColor(): string {
  const colors = ['#e8891c', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
  return colors[Math.floor(Math.random() * colors.length)];
}
