import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import SearchSongCard from './components/SearchSongCard';
import type { SongData } from './types';

export type RequestedSong = {
  songId: string;
  token: string;
  playUrl: string;
  requestedAt: number;
  expiresAt: number;
}

const fetchRequestedSongs = async (token: string, callback: (requestedSongs: RequestedSong[]) => void) => {
  fetch("/api/request", {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json()
    })
    .then(data => {
      callback(data || []);
    })
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestedSongs, setRequestedSongs] = useState<RequestedSong[]>([]);
  const [results, setResults] = useState<SongData[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const refreshRequestedSongs = useCallback(() => {
    if (!token) {
        return;
    }
    fetchRequestedSongs(token, setRequestedSongs);
  }, [token]);

  useEffect( () => refreshRequestedSongs(), [refreshRequestedSongs]);

  const filtered = useMemo(() => results, [results]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  async function search() {
    if (!q.trim()){
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        showToast('Search failed');
        return;
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch {
      showToast('Search failed');
    }
    setLoading(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!token) {
    return null;
  }

  return (
    <>
      {/* Header with logout */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Music Library</h1>
          <p className='text-sm text-gray-600'>Welcome, {user?.username}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className='gap-2'
        >
          <LogOut className='w-4 h-4' /> Logout
        </Button>
      </div>

      {/* Search */}
      <Card className='rounded-2xl'>
        <CardContent className='p-4 flex gap-3'>
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder='Search songs, artists, albums...'
          />
          <Button onClick={search} className='rounded-2xl'>
            <Search className='w-4 h-4 mr-2' /> Search
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className='flex items-center gap-2 justify-center mt-4'>
          <Loader2 className='animate-spin w-4 h-4' /> Searching library...
        </div>
      )}

      {/* Results */}
      <div className='grid gap-4 mt-4'>
        {filtered.map(song => (
          <SearchSongCard
            key={song.id}
            song={song}
            requestedSongs={requestedSongs}
            refreshRequestedSongs={refreshRequestedSongs}
            token={token}
            showToast={showToast}
          />
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className='fixed bottom-6 right-6 text-white px-4 py-2 rounded-xl shadow-lg'>
          {toast}
        </div>
      )}
    </>
  );
}
