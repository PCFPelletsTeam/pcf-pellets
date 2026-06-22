import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { PCFCalculation } from '@pcf/shared';
import { Form } from '@/components/ui/form';
import { buildDefaults, STEP_FIELDS, STEPS, TOTAL_STEPS, wizardSchema, type WizardFormData } from './schema';
import { Step1Period } from './step-1-period';
import { Step2RawMaterials } from './step-2-raw-materials';
import { Step3Energy } from './step-3-energy';
import { Step4Process } from './step-4-process';
import { Step5Results } from './step-5-results';
import { Step6Reports } from './step-6-reports';
import { WizardNav } from './wizard-nav';
import { WizardProgress } from './wizard-progress';

export function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [calculation, setCalculation] = useState<PCFCalculation | null>(null);

  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: buildDefaults(),
    mode: 'onTouched',
  });

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields && fields.length > 0) {
      const ok = await methods.trigger(fields as Parameters<typeof methods.trigger>[0]);
      if (!ok) return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else if (calculation) {
      // На останньому кроці "Завершити" → переходимо на детальний звіт.
      navigate(`/calculations/${calculation.id}`);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleJump = (target: number) => {
    // Дозволяємо стрибати тільки назад (на вже пройдений крок).
    if (target < step) setStep(target);
  };

  const currentStepMeta = STEPS.find((s) => s.n === step)!;

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={(e) => e.preventDefault()}>
          <WizardProgress currentStep={step} onJump={handleJump} />

          <div className="mb-2">
            <h2 className="text-lg font-semibold">{currentStepMeta.title}</h2>
          </div>

          <div className="rounded-lg border bg-card p-6">
            {step === 1 && <Step1Period />}
            {step === 2 && <Step2RawMaterials />}
            {step === 3 && <Step3Energy />}
            {step === 4 && <Step4Process />}
            {step === 5 && (
              <Step5Results
                calculation={calculation}
                onCalculationReady={setCalculation}
              />
            )}
            {step === 6 && <Step6Reports calculation={calculation} />}
          </div>

          <WizardNav
            step={step}
            onBack={handleBack}
            onNext={handleNext}
            nextLabel={
              step === 5
                ? calculation
                  ? 'До звітів'
                  : 'Чекаємо результат…'
                : step === TOTAL_STEPS
                  ? 'Відкрити звіт'
                  : undefined
            }
            disabled={step === 5 && !calculation}
          />
        </form>
      </Form>
    </FormProvider>
  );
}
