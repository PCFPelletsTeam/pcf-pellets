import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-2 text-lg font-medium">Сторінку не знайдено</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Перевірте URL або поверніться на головну.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">На головну</Link>
      </Button>
    </div>
  );
}
