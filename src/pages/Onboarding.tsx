import { useState } from 'react';
import { Logo, Button } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { BookOpen, Sparkles, Download, Plus, FileText, FolderOpen } from 'lucide-react';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { updateSettings } = useApp();
  const [step, setStep] = useState(0);

  const handleFinish = () => {
    updateSettings({ onboardingCompleted: true });
    onComplete();
  };

  const steps = [
    {
      icon: <BookOpen size={48} className="text-accent-500" />,
      title: 'Build your story',
      desc: 'Create your story bible, develop characters, build your world, and plan your chapters with AI assistance.',
    },
    {
      icon: <Sparkles size={48} className="text-accent-500" />,
      title: 'Write with AI',
      desc: 'Generate full chapters, continue writing, refine prose, and maintain continuity across your entire book.',
    },
    {
      icon: <Download size={48} className="text-accent-500" />,
      title: 'Export your finished book',
      desc: 'Generate a cover, write metadata, and export to PDF, DOCX, or EPUB with professional formatting.',
    },
  ];

  if (step < 3) {
    const s = steps[step];
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="max-w-lg px-8 text-center animate-fade-in">
          <Logo size={40} className="justify-center mb-12" />
          <p className="text-sm font-medium text-accent-600 dark:text-accent-400 mb-4">Welcome to AI Book Studio</p>
          <div className="mb-8">{s.icon}</div>
          <h2 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-3">{s.title}</h2>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{s.desc}</p>
          <div className="flex items-center justify-center gap-2 mt-8 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-accent-500' : 'w-2 bg-surface-300 dark:bg-surface-700'}`} />
            ))}
          </div>
          <div className="flex justify-center gap-3">
            {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button variant="primary" onClick={() => setStep(step + 1)}>Next</Button>
            <Button variant="ghost" onClick={handleFinish}>Skip</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="max-w-lg px-8 text-center animate-fade-in">
        <Logo size={40} className="justify-center mb-8" />
        <h2 className="font-display text-2xl font-semibold text-surface-800 dark:text-surface-100 mb-2">Ready to begin?</h2>
        <p className="text-surface-600 dark:text-surface-400 mb-8">From idea to finished book. Let's start writing.</p>
        <div className="space-y-3">
          <Button variant="primary" size="lg" icon={<Plus size={18} />} className="w-full" onClick={handleFinish}>
            Create New Book
          </Button>
          <Button variant="secondary" size="lg" icon={<FolderOpen size={18} />} className="w-full" onClick={handleFinish}>
            Open Existing Project
          </Button>
          <Button variant="ghost" size="lg" icon={<FileText size={18} />} className="w-full" onClick={handleFinish}>
            Import Existing Book
          </Button>
        </div>
      </div>
    </div>
  );
}
