import { Modal } from '@/components/ui';
import { BookOpen, Sparkles, Download } from 'lucide-react';

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Getting Started" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-surface-800 dark:text-surface-100">
            <BookOpen size={18} className="text-accent-500" />
            The Writing Workflow
          </h3>
          <ol className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-400">
            <li><strong className="text-surface-700 dark:text-surface-300">1. Build your story</strong> — Start in the Story Bible to define your premise, themes, and world. Add characters and locations.</li>
            <li><strong className="text-surface-700 dark:text-surface-300">2. Plan chapters</strong> — Use the Outline builder to create chapter outlines, then plan individual scenes.</li>
            <li><strong className="text-surface-700 dark:text-surface-300">3. Write with AI</strong> — Open the Manuscript editor. Use the AI panel to generate chapters, continue writing, or refine prose.</li>
            <li><strong className="text-surface-700 dark:text-surface-300">4. Check continuity</strong> — Run a continuity check to catch inconsistencies across chapters.</li>
            <li><strong className="text-surface-700 dark:text-surface-300">5. Export</strong> — Generate a cover, fill in metadata, and export to PDF, DOCX, or EPUB.</li>
          </ol>
        </div>

        <div className="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
            <Sparkles size={16} className="text-accent-500" />
            AI Setup
          </h3>
          <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
            To use AI features, go to Settings → AI and enter your API key. You can use OpenAI, Anthropic, Google Gemini, or OpenRouter. Each AI action uses credits (tokens).
          </p>
        </div>

        <div className="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
            <Download size={16} className="text-accent-500" />
            Keyboard Shortcuts
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-surface-600 dark:text-surface-400">
            <div><kbd className="rounded bg-white dark:bg-surface-900 px-1.5 py-0.5 text-xs border border-surface-200 dark:border-surface-700">Ctrl+S</kbd> Save</div>
            <div><kbd className="rounded bg-white dark:bg-surface-900 px-1.5 py-0.5 text-xs border border-surface-200 dark:border-surface-700">Ctrl+Z</kbd> Undo</div>
            <div><kbd className="rounded bg-white dark:bg-surface-900 px-1.5 py-0.5 text-xs border border-surface-200 dark:border-surface-700">Ctrl+Shift+Z</kbd> Redo</div>
            <div><kbd className="rounded bg-white dark:bg-surface-900 px-1.5 py-0.5 text-xs border border-surface-200 dark:border-surface-700">Ctrl+F</kbd> Find</div>
            <div><kbd className="rounded bg-white dark:bg-surface-900 px-1.5 py-0.5 text-xs border border-surface-200 dark:border-surface-700">Ctrl+Enter</kbd> AI Generate</div>
            <div><kbd className="rounded bg-white dark:bg-surface-900 px-1.5 py-0.5 text-xs border border-surface-200 dark:border-surface-700">Esc</kbd> Close dialog</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
