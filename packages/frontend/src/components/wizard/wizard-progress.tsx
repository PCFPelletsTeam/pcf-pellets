import { Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { STEPS, TOTAL_STEPS } from './schema';

interface WizardProgressProps {
  currentStep: number;
  /** Куди стрибати при кліку на крок (опціонально). Якщо не задано — кліки заблоковані. */
  onJump?: (step: number) => void;
}

export function WizardProgress({ currentStep, onJump }: WizardProgressProps) {
  const percent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Крок {currentStep} з {TOTAL_STEPS}
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      <Progress value={percent} className="mb-4 h-2" />
      <ol className="grid grid-cols-6 gap-2">
        {STEPS.map((step) => {
          const isDone = step.n < currentStep;
          const isCurrent = step.n === currentStep;
          const clickable = onJump && (isDone || isCurrent);
          return (
            <li key={step.n}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onJump?.(step.n)}
                className={cn(
                  'flex w-full flex-col items-center gap-1.5 rounded-md p-2 text-xs transition-colors',
                  isCurrent && 'bg-primary/10 text-primary',
                  isDone && 'text-foreground hover:bg-muted',
                  !isDone && !isCurrent && 'text-muted-foreground/60',
                  !clickable && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium',
                    isCurrent && 'border-primary bg-primary text-primary-foreground',
                    isDone && 'border-primary bg-primary text-primary-foreground',
                    !isDone && !isCurrent && 'border-muted-foreground/30',
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.n}
                </span>
                <span className="text-center leading-tight">{step.short}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
