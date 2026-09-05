# AI Book Studio

AI Book Studio is a complete writing application for authors who want to plan, write, and export their books with AI assistance. It provides a full workflow from initial idea to export-ready manuscript, with tools for character development, world-building, plot management, scene planning, and AI-powered writing.

## Features

### Book Creation & Management
- **Create New Book Wizard** — Step-by-step guided setup for a new book: title, author, genre, subgenre, target audience, book type, target word count, and writing style preferences (narrative style, tone, point of view, tense, pacing, dialogue style, description level).
- **Dashboard** — View all your books, see progress at a glance, open or delete projects, and export project backups.
- **Book Overview** — A summary hub showing your book's stats, recent chapters, characters, and quick navigation to every section.

### Story Planning
- **Story Bible** — AI-generated or manually written story bible with premise, themes, tone, timeline, world rules, important facts, plot threads, open questions, and ending description.
- **Characters** — Full character management with name, age, gender, role, appearance, personality, background, occupation, goals, motivation, fears, strengths, weaknesses, character arc, secrets, and relationships. AI-assisted character generation available.
- **Locations & World** — Track settings with descriptions, atmosphere, geography, important objects, history, and world-specific rules (magic systems, technology, cultures, organizations, political systems, species, languages).
- **Plot Manager** — Organize plot points as main plots, subplots, or threads. Track conflict, resolution, involved characters, and linked chapters.
- **Chapter Outline** — Plan chapters with purpose, summary, main events, characters, location, conflict, emotional beat, important details, ending hook, and target word count.
- **Scene Planner** — Break chapters into individual scenes with location, time, characters, objective, conflict, emotion, action, important info, and scene transitions.

### Writing & Editing
- **Manuscript Editor** — A rich text editor with formatting (bold, italic, underline, headings, blockquotes, lists, alignment, undo/redo), word and character count, find and replace, auto-save, and chapter navigation.
- **AI Writing Assistant** — Generate full chapters, continue writing, rewrite, improve, expand, shorten, change tone, improve dialogue, make text more literary/cinematic/emotional, fix grammar, proofread, apply "show don't tell," increase tension, improve pacing, and create alternatives. Supports streaming responses.
- **Chapter Summaries** — AI-generated chapter summaries for long-book memory and continuity tracking.
- **Continuity Check** — AI-powered analysis that detects character inconsistencies, timeline problems, location mismatches, conflicting facts, plot holes, and relationship inconsistencies across chapters.

### Export & Backup
- **PDF Export** — Print-ready PDF with optional title page, copyright page, table of contents, and page numbers. Configurable page size, font size, line height, and margins.
- **DOCX Export** — Microsoft Word format with proper styles, headings, lists, and formatting.
- **EPUB Export** — E-book reader format with navigation, cover image support, and styled content.
- **Project Backup** — Export and import complete project files (`.bookstudio` format) containing all book data, characters, locations, plot points, chapters, scenes, notes, and version history.

### Additional Features
- **Notes** — Pinned and categorized notes for each book.
- **Cover Generator** — AI-assisted cover image generation with prompt customization.
- **Book Metadata** — Short and long descriptions, author bio, keywords, categories, marketing hook, tagline, and back cover text.
- **Settings** — AI provider configuration (OpenAI, Anthropic, Gemini, OpenRouter), API key management, model selection, temperature, max tokens, streaming toggle, theme (light/dark/system), editor width, auto-save interval, and credits tracking.
- **Onboarding** — First-run guided introduction for new users.
- **Dark Mode** — Full dark theme support with system preference detection.

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Development

The development server starts automatically. To run it manually:

```bash
npm run dev
```

The app will be available in your browser at the local development URL.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Using the Application

### 1. Create Your First Book
On the dashboard, click "Create New Book" and follow the wizard. Enter your book's title, author, genre, and writing style preferences. You can provide a short idea or premise to get started.

### 2. Set Up AI (Optional)
Go to Settings to configure your AI provider. Choose from OpenAI, Anthropic, Gemini, or OpenRouter. Enter your API key and select a model. This enables AI-assisted writing, character generation, story bible generation, chapter summaries, and continuity checking.

### 3. Plan Your Story
Use the Story Bible, Characters, Locations, Plot, Chapter Outline, and Scene Planner sections to build out your book's foundation. Each section can be filled in manually or generated with AI (if configured).

### 4. Write Your Manuscript
Open the Editor to write your chapters. Use the formatting toolbar, find and replace, and chapter navigation. If AI is configured, use the AI panel to generate or refine text. The editor auto-saves your work.

### 5. Check Continuity
Run the Continuity Check to catch inconsistencies across your chapters before publishing.

### 6. Export
Go to the Export section to download your book as PDF, DOCX, or EPUB. Configure page settings, include a title page, copyright page, table of contents, and cover image. You can also export a full project backup.

## Data Storage

All data is stored locally in your browser using IndexedDB. Your books, characters, locations, chapters, scenes, notes, and settings persist between sessions. No data is sent to any server except when you make AI API calls (which go directly to your configured AI provider).

## Tech Stack

- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **IndexedDB** for local data persistence
- **jsPDF** for PDF export
- **JSZip** for DOCX and EPUB export
- **file-saver** for file downloads
- **nanoid** for unique IDs
- **date-fns** for date formatting

## Project Structure

```
src/
  App.tsx                 # Main app component and page routing
  main.tsx                # Entry point
  index.css               # Global styles and Tailwind config
  components/             # Shared UI components
    ui.tsx                # Buttons, modals, inputs, toasts, etc.
    Sidebar.tsx           # Navigation sidebar
    TopBar.tsx            # Top bar with book selector and settings
    HelpModal.tsx         # Help dialog
  context/
    AppContext.tsx        # Global state management
  hooks/
    useToasts.ts          # Toast notification hook
  pages/                  # All application pages
    Dashboard.tsx         # Book list and project management
    CreateBookWizard.tsx  # New book creation wizard
    BookOverview.tsx      # Book summary hub
    StoryBible.tsx        # Story bible editor
    Characters.tsx        # Character management
    Locations.tsx         # Location and world-building
    Plot.tsx              # Plot point management
    Outline.tsx           # Chapter outline planner
    ScenePlanner.tsx      # Scene-level planning
    Editor.tsx            # Rich text manuscript editor
    Notes.tsx             # Notes
    Cover.tsx             # Cover image generator
    Metadata.tsx          # Book metadata editor
    Continuity.tsx        # AI continuity checker
    Export.tsx            # Export to PDF/DOCX/EPUB
    Settings.tsx          # App and AI settings
    Onboarding.tsx        # First-run onboarding
    License.tsx           # License info
  services/
    db.ts                 # IndexedDB data layer and repositories
    exports.ts            # PDF, DOCX, EPUB, and project backup export
    import.ts             # Manuscript import (plain text, DOCX, etc.)
    schema.ts             # Database schema and migrations
    ai/
      engine.ts           # AI generation logic and prompts
      providers.ts        # AI provider adapters (OpenAI, Anthropic, etc.)
  types/
    index.ts              # TypeScript type definitions
  utils/
    factories.ts          # Default object factories
```

## AI Providers

The app supports multiple AI providers. Configure your preferred provider and API key in Settings:

- **OpenAI** — GPT models (gpt-4, gpt-3.5-turbo, etc.)
- **Anthropic** — Claude models (claude-3-opus, claude-3-sonnet, etc.)
- **Gemini** — Google's Gemini models
- **OpenRouter** — Access multiple providers through one API

Your API key is stored locally in your browser and is only sent directly to the AI provider you choose.
