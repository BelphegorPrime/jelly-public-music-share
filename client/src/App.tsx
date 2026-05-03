import { Routes, Route } from 'react-router-dom';
import SearchPage from './SearchPage';
import PlayPage from './PlayPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/play/:token" element={<PlayPage />} />
    </Routes>
  );
}
