import { Calculator, Database, Factory, Leaf } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Огляд', icon: Leaf, end: true },
  { to: '/calculations', label: 'Розрахунки', icon: Calculator, end: false },
  { to: '/materials', label: 'Матеріали', icon: Factory, end: false },
  { to: '/emission-factors', label: 'EF довідник', icon: Database, end: false },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-6">
        <NavLink to="/" className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-semibold tracking-tight">PCF Pellets</span>
        </NavLink>

        <nav className="flex items-center gap-1 text-sm">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto text-xs text-muted-foreground">
          ISO 14067 · CBAM · Catena-X CX-0029
        </div>
      </div>
    </header>
  );
}
