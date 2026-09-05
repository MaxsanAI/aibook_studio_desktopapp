import { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { useToasts } from '@/hooks/useToasts';
import { ToastContainer, Logo, Spinner } from '@/components/ui';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Dashboard } from '@/pages/Dashboard';
import { CreateBookWizard } from '@/pages/CreateBookWizard';
import { StoryBible } from '@/pages/StoryBible';
import { Characters } from '@/pages/Characters';
import { Locations } from '@/pages/Locations';
import { Plot } from '@/pages/Plot';
import { Outline } from '@/pages/Outline';
import { ScenePlanner } from '@/pages/ScenePlanner';
import { Editor } from '@/pages/Editor';
import { Notes } from '@/pages/Notes';
import { Cover } from '@/pages/Cover';
import { Metadata } from '@/pages/Metadata';
import { ExportPage } from '@/pages/Export';
import { Settings } from '@/pages/Settings';
import { Onboarding } from '@/pages/Onboarding';
import { BookOverview } from '@/pages/BookOverview';
import { Continuity } from '@/pages/Continuity';
import { License } from '@/pages/License';


// ---------------------------------------------------------------------------
// Page routing — simple state-based router
// ---------------------------------------------------------------------------

export type Page =
  | 'dashboard' | 'create-book' | 'book-overview' | 'story-bible' | 'characters'
  | 'locations' | 'plot' | 'outline' | 'scenes' | 'editor' | 'notes'
  | 'cover' | 'metadata' | 'export' | 'settings' | 'continuity' | 'license';

function AppInner() {
  const { settings, loading, currentBook } = useApp();
  const [page, setPage] = useState<Page>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toasts, dismiss, toastSuccess, toastError } = useToasts();

  useEffect(() => {
    if (!loading && settings && !settings.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [loading, settings]);

  // When current book changes, default to overview
  useEffect(() => {
    if (currentBook && page === 'dashboard') {
      setPage('book-overview');
    }
    if (!currentBook && page !== 'dashboard' && page !== 'create-book' && page !== 'settings' && page !== 'license') {
      setPage('dashboard');
    }
  }, [currentBook, page]);

  const navigate = useCallback((p: Page) => {
    setPage(p);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <Logo size={48} />
          <Spinner size={24} className="text-accent-500" />
        </div>
      </div>
    );
  }

  if (showOnboarding && settings) {
    return (
      <>
        <Onboarding
          onComplete={() => {
            setShowOnboarding(false);
            settings.onboardingCompleted = true;
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </>
    );
  }

  const showSidebar = currentBook !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {showSidebar && <Sidebar current={page} onNavigate={navigate} />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar page={page} onNavigate={navigate} />
        <main className="flex-1 overflow-hidden">
          {page === 'dashboard' && <Dashboard onNavigate={navigate} toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'create-book' && <CreateBookWizard onNavigate={navigate} toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'book-overview' && currentBook && <BookOverview onNavigate={navigate} />}
          {page === 'story-bible' && currentBook && <StoryBible toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'characters' && currentBook && <Characters toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'locations' && currentBook && <Locations toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'plot' && currentBook && <Plot toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'outline' && currentBook && <Outline onNavigate={navigate} toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'scenes' && currentBook && <ScenePlanner toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'editor' && currentBook && <Editor toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'notes' && currentBook && <Notes toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'cover' && currentBook && <Cover toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'metadata' && currentBook && <Metadata toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'continuity' && currentBook && <Continuity toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'export' && currentBook && <ExportPage toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'settings' && <Settings toastSuccess={toastSuccess} toastError={toastError} />}
          {page === 'license' && <License toastSuccess={toastSuccess} toastError={toastError} />}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
