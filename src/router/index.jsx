import React from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PlaceholderPage from '../components/common/PlaceholderPage';

// Icons for Placeholder
import { 
  Pill, Syringe, Layers, Scale, FileText, 
  ShoppingCart, ClipboardList, Landmark, 
  BarChart3, TrendingUp, PieChart, Building2
} from 'lucide-react';

// Existing Pages (Moved)
import DashboardPage from '../modules/dashboard/DashboardPage';
import BranchesPage from '../modules/master-data/hierarchy/BranchesPage';
import AreasPage from '../modules/master-data/hierarchy/AreasPage';
import ClinicsPage from '../modules/master-data/hierarchy/ClinicsPage';
import DrugsManagementPage from '../modules/master-data/drugs/DrugsManagementPage';
import InsulinManagementPage from '../modules/master-data/insulin/InsulinManagementPage';
import SuppliesManagementPage from '../modules/master-data/supplies/SuppliesManagementPage';
import JudicialSetupPage from '../modules/master-data/judicial-setup/JudicialSetupPage';

// Transactions
import MonthlyTotalsPage from '../modules/transactions/monthly-totals/MonthlyTotalsPage';
import DetailedDrugDispensingPage from '../modules/transactions/drug-dispensing/DetailedDrugDispensingPage';
import MedicalTicketsPage from '../modules/transactions/medical-tickets/MedicalTicketsPage';
import InsulinDispensingPage from '../modules/transactions/insulin-dispensing/InsulinDispensingPage';
import JudicialDispensingPage from '../modules/transactions/judicial-dispensing/JudicialDispensingPage';
import GroupCostsPage from '../modules/transactions/group-costs/GroupCostsPage';

// Reports
import AnalyticalReportsPage from '../modules/reports/analytical/AnalyticalReportsPage';
import FinancialReportsPage from '../modules/reports/financial/FinancialReportsPage';
import ComparisonReportsPage from '../modules/reports/comparison/ComparisonReportsPage';

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },

      // --- Master Data Layer ---
      { path: 'master-data/hierarchy', element: <Navigate to="/master-data/hierarchy/branches" replace /> },
      { path: 'master-data/hierarchy/branches', element: <BranchesPage /> },
      { path: 'master-data/hierarchy/areas', element: <AreasPage /> },
      { path: 'master-data/hierarchy/clinics', element: <ClinicsPage /> },
      
      { path: 'master-data/drugs', element: <DrugsManagementPage /> },
      { path: 'master-data/insulin', element: <InsulinManagementPage /> },
      { path: 'master-data/supplies', element: <SuppliesManagementPage /> },
      { path: 'master-data/judicial-setup', element: <JudicialSetupPage /> },

      // --- Transaction Layer ---
      { path: 'transactions/monthly-totals', element: <MonthlyTotalsPage /> },
      { path: 'transactions/drug-dispensing', element: <DetailedDrugDispensingPage /> },
      { path: 'transactions/medical-tickets', element: <MedicalTicketsPage /> },
      { path: 'transactions/insulin-dispensing', element: <InsulinDispensingPage /> },
      { path: 'transactions/judicial-dispensing', element: <JudicialDispensingPage /> },
      { path: 'transactions/group-costs', element: <GroupCostsPage /> },


      // --- Reporting Layer ---
      { path: 'reports/analytical', element: <AnalyticalReportsPage /> },
      { path: 'reports/financial', element: <FinancialReportsPage /> },
      { path: 'reports/comparison', element: <ComparisonReportsPage /> },

      // Fallback for old links
      { path: 'monthly-dispensed', element: <Navigate to="/transactions/monthly-totals" replace /> },
      { path: 'insulin', element: <Navigate to="/transactions/insulin-dispensing" replace /> },
      { path: 'drug-groups', element: <Navigate to="/transactions/drug-dispensing" replace /> },
      { path: 'judicial', element: <Navigate to="/transactions/judicial-dispensing" replace /> },
      { path: 'reports', element: <Navigate to="/reports/analytical" replace /> },
    ],
  },
]);

export default router;
