import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import CalculationDetailPage from '@/pages/calculation-detail.page';
import CalculationNewPage from '@/pages/calculation-new.page';
import CalculationsListPage from '@/pages/calculations-list.page';
import EmissionFactorsPage from '@/pages/emission-factors.page';
import HomePage from '@/pages/home.page';
import MaterialsPage from '@/pages/materials.page';
import NotFoundPage from '@/pages/not-found.page';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/calculations" element={<CalculationsListPage />} />
          <Route path="/calculations/new" element={<CalculationNewPage />} />
          <Route path="/calculations/:id" element={<CalculationDetailPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/emission-factors" element={<EmissionFactorsPage />} />
          {/* Беккомпат: alias на старі URL */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
