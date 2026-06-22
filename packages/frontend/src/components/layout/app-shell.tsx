import { Outlet } from 'react-router-dom';
import { Header } from './header';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
