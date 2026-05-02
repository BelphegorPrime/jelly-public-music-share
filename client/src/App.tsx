import { Routes, Route } from 'react-router-dom';
import SearchPage from './SearchPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
    </Routes>
  );
}
