import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PCFCalculation } from '@pcf/shared';
import { ReportsPanel } from '@/components/reports/reports-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Step6Props {
  calculation: PCFCalculation | null;
}

export function Step6Reports({ calculation }: Step6Props) {
  return (
    <div className="space-y-6">
      {calculation && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div>
              <p className="text-sm text-muted-foreground">Розрахунок збережено</p>
              <p className="font-medium">{calculation.input.facilityName}</p>
              <p className="font-mono text-xs text-muted-foreground">id: {calculation.id}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-primary">
                {Number(calculation.pcfKgCo2ePerKgPellets).toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">kg CO₂e/kg pellets</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-1 text-base font-semibold">Експорт</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Файл генерується на сервері (з SHA-256 hash для перевірки цілісності) і
          одразу завантажується. До звіту можна повернутись зі сторінки розрахунку
          у будь-який час.
        </p>
      </div>

      {calculation && <ReportsPanel calculationId={calculation.id} />}

      {calculation && (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to={`/calculations/${calculation.id}`}>
              Відкрити детальний вигляд <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
