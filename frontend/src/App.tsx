import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/RouteGuards';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ChatPage } from './pages/ChatPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { NotFoundPage } from './pages/NotFoundPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
