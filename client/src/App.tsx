import { Routes, Route, Navigate } from 'react-router-dom';
import SearchPage from './SearchPage';
import PlayPage from './PlayPage';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthProvider';
import { ThemeProvider } from './contexts/ThemeProvider';

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/play/:token" element={<PlayPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
