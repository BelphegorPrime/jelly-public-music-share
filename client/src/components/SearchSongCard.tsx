import { useCallback, useState, type JSX } from 'react';
import { Music, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputGroupCopyButton } from '@/components/input-group/buttons/input-group-copy-button';
import type { RequestedSong } from '@/SearchPage';

type SearchSongCardProps = {
  token: string;
  song: SearchResult;
  requestedSongs: RequestedSong[];
  refreshRequestedSongs: () => void;
  showToast: (msg: string) => void;
};

type SearchResult = {
  id: string;
  image: string;
  name: string;
  artist: string;
  album?: string;
};

const request = async (
  token: string,
  songId: string,
  showToast: (msg: string) => void
): Promise<{ playUrl: string; token: string } | null> => {
  try {
    const res = await fetch('/api/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ songId }),
    });

    if (!res.ok) {
      showToast('Request failed');
      return null;
    }

    const data = await res.json();

    if (data.playUrl) {
      await navigator.clipboard.writeText(data.playUrl);
      showToast('Link copied to clipboard');
    } else {
      showToast('Failed to create link');
    }
    return data;
  } catch {
    showToast('Request failed');
  }

  return null;
};

const getButtonText = (
  requestStarted: boolean,
  requestFinished: boolean
): JSX.Element => {
  if (requestStarted && !requestFinished) {
    return <>Requested</>;
  } else if (requestFinished) {
    return (
      <>
        <Copy className="mr-2 h-4 w-4" /> Link Created
      </>
    );
  }
  return (
    <>
      <Copy className="mr-2 h-4 w-4" /> Create Link
    </>
  );
};

export default function SearchSongCard({
  token,
  song,
  requestedSongs,
  refreshRequestedSongs,
  showToast,
}: SearchSongCardProps): JSX.Element {
  const [data, setData] = useState<Awaited<ReturnType<typeof request>> | null>(
    null
  );
  const [requestStarted, setRequestStarted] = useState(false);

  const copyToClipboard = useCallback(
    async (url: string) => {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    },
    [showToast]
  );

  const handleRequest = useCallback(async () => {
    if (!data) {
      setRequestStarted(true);
      const requestData = await request(token, song.id, showToast);
      setData(requestData);
      refreshRequestedSongs();
    } else {
      copyToClipboard(data.playUrl);
    }
  }, [data, token, song.id, refreshRequestedSongs, showToast, copyToClipboard]);

  const requestsForSong = requestedSongs.filter((rs) => rs.songId === song.id);
  console.log('Requested song for', song.name, ':', { requestsForSong });

  return (
    <Card key={song.id} className="rounded-2xl py-0">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl">
          {song.image ? (
            <img
              src={song.image}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <Music className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1">
          <div className="font-semibold">
            {song.name}{' '}
            {requestsForSong.length > 0 && (
              <span className="text-sm text-gray-500">
                ({requestsForSong.length} requested)
              </span>
            )}
          </div>
          <div className="text-sm">
            {song.artist} • {song.album || 'Unknown Album'}
          </div>
          <div className="text-sm">
            <InputGroupCopyButton
              value={data?.playUrl || ''}
              placeholder="Shareable URL"
              onClick={() => {
                if (data?.playUrl) {
                  copyToClipboard(data.playUrl);
                }
              }}
              disabled
              readOnly
            />
          </div>
        </div>

        <Button onClick={handleRequest} className="rounded-2xl">
          {getButtonText(requestStarted, !!data?.playUrl)}
        </Button>
      </CardContent>
    </Card>
  );
}
