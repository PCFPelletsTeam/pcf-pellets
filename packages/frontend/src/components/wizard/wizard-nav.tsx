import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TOTAL_STEPS } from './schema';

interface WizardNavProps {
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  /** Disable both buttons (e.g. while POST in flight on step 5). */
  disabled?: boolean;
  /** Hide the Next button on the last step. */
  hideNext?: boolean;
}

export function WizardNav({
  step,
  onBack,
  onNext,
  nextLabel,
  disabled,
  hideNext,
}: WizardNavProps) {
  return (
    <div className="mt-6 flex items-center justify-between border-t pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={step === 1 || disabled}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад
      </Button>
      {!hideNext && (
        <Button type="button" onClick={onNext} disabled={disabled}>
          {nextLabel ?? (step === TOTAL_STEPS ? 'Завершити' : 'Далі')}
          {step !== TOTAL_STEPS && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
