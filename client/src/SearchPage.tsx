import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Music, Copy, Loader2, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

type SearchResult = {
  id: string,
  artist: string,
  duration: [number, number],
  image: string,
  name: string,
  type: string
  album?: string,
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const filtered = useMemo(() => results, [results]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function search() {
    if (!q.trim()) return;

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

  async function request(songId: string) {
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songId })
      });

      if (!res.ok) {
        showToast('Request failed');
        return;
      }

      const data = await res.json();

      if (data.playUrl) {
        await navigator.clipboard.writeText(data.playUrl);
        showToast('Link copied to clipboard');
      } else {
        showToast('Failed to create link');
      }
    } catch {
      showToast('Request failed');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
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
          <Card key={song.id} className='rounded-2xl'>
            <CardContent className='p-4 flex items-center gap-4'>

              <div className='w-14 h-14 rounded-xl flex items-center justify-center'>
                {song.image ? (
                  <img src={song.image} className='w-full h-full rounded-xl object-cover' />
                ) : (
                  <Music className='w-6 h-6' />
                )}
              </div>

              <div className='flex-1'>
                <div className='font-semibold'>{song.name}</div>
                <div className='text-sm'>
                  {song.artist} • {song.album || 'Unknown Album'}
                </div>
              </div>

              <Button
                onClick={() => request(song.id)}
                className='rounded-2xl'
              >
                <Copy className='w-4 h-4 mr-2' /> Create Link
              </Button>

            </CardContent>
          </Card>
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
