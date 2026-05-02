import { useState } from 'react';

type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  image?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }

  async function request(songId: string) {
    const res = await fetch('/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId })
    });

    const data = await res.json();

    if (data.playUrl) {
      await navigator.clipboard.writeText(data.playUrl);
      alert('Copied share link');
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>Public Music Share</h1>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search songs"
          style={{ flex: 1, padding: 12 }}
        />
        <button onClick={search}>Search</button>
      </div>

      {loading && <p>Searching...</p>}

      {results.map((song) => (
        <div key={song.id} style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {song.image && <img src={song.image} width="60" />}
          <div style={{ flex: 1 }}>
            <strong>{song.name}</strong><br />
            {song.artist} – {song.album}
          </div>
          <button onClick={() => request(song.id)}>Share</button>
        </div>
      ))}
    </div>
  );
}