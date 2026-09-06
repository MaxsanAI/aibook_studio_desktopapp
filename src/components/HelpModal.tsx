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
        <div className="overflow-hidden rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 p-4 text-white">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-white" />
              <div>
                <h3 className="text-sm font-semibold text-white">Build apps with Bolt</h3>
                <p className="text-xs text-white/90">Create full-stack web apps from a prompt. Try it free.</p>
              </div>
            </div>
            <a
              href="https://bolt.cello.so/SGMjFQLEpDn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-accent-600 shadow-sm transition-all hover:bg-surface-50 whitespace-nowrap"
            >
              <Sparkles size={16} />
              Try Bolt
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
