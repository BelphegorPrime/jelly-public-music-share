import { Routes, Route } from 'react-router-dom';
import SearchPage from './SearchPage';
import PlayPage from './PlayPage';
import Layout from './components/Layout';
import { ThemeProvider } from './contexts/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/play/:token" element={<PlayPage />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}
