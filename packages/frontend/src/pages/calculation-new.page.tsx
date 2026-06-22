import { PageHeader } from '@/components/common/page-header';
import { Wizard } from '@/components/wizard/wizard';

export default function CalculationNewPage() {
  return (
    <>
      <PageHeader
        title="Новий PCF-розрахунок"
        description="6-кроковий wizard: визначте період і режим, додайте сировину та енергоносії, отримайте розрахунок з audit trail."
      />
      <Wizard />
    </>
  );
}
