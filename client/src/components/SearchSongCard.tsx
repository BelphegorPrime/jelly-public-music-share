import { useCallback, useState, type JSX } from "react";
import { Music, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputGroupCopyButton } from "@/components/input-group/buttons/input-group-copy-button";
import type { RequestedSong } from "@/SearchPage";
import type { SongData } from "@/types";
import './SearchSongCard.css';

type SearchSongCardProps = {
    song: SongData,
    requestedSongs: RequestedSong[],
    refreshRequestedSongs: () => void,
    showToast: (msg: string) => void
}

const request = async (songId: string, showToast: (msg: string) => void): Promise<{ playUrl: string, token: string } | null> => {
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songId })
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
}

const getButtonText = (requestStarted: boolean, requestFinished: boolean): JSX.Element => {
    if (requestStarted && !requestFinished) {
        return <>
            <span className="jumping-dot">.</span><span className="jumping-dot">.</span><span className="jumping-dot">.</span> Requested
        </>
    } else if (requestFinished) {
        return <>
            <Copy className='w-4 h-4 mr-2' /> Link Created
        </>
    }
    return <>
        <Copy className='w-4 h-4 mr-2' /> Create Link
    </>
}

export default function SearchSongCard({
    song,
    requestedSongs,
    refreshRequestedSongs,
    showToast
} : SearchSongCardProps): JSX.Element {
    const [data, setData] = useState<Awaited<ReturnType<typeof request>> | null>(null);
    const [requestStarted, setRequestStarted] = useState(false);

    const copyToClipboard = useCallback(async (url: string) => {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard');
    }, [showToast]);

    const handleRequest = useCallback(async () => {
        if (!song.id) {
            return
        }
        if (!data) {
                setRequestStarted(true);
                const requestData = await request(song.id, showToast);
                setData(requestData);
                refreshRequestedSongs();
        } else {
            copyToClipboard(data.playUrl);
        }
    }, [data, song.id, refreshRequestedSongs, showToast, copyToClipboard]);


    const requestsForSong = requestedSongs.filter(rs => rs.songId === song.id);
    console.log('Requested song for', song.name, ':', { requestsForSong });

    return (
        <Card key={song.id} className='rounded-2xl py-0'>
            <CardContent className='p-4 flex items-center gap-4'>
                <div className='w-14 h-14 rounded-xl flex items-center justify-center'>
                    {song.image ? (
                        <img src={song.image} className='w-full h-full rounded-xl object-cover' />
                    ) : (
                        <Music className='w-6 h-6' />
                    )}
                </div>

                <div className='flex-1'>
                    <div className='font-semibold'>
                        {song.name} {requestsForSong.length > 0 && <span className='text-sm text-gray-500'>({requestsForSong.length} requested)</span>}
                    </div>
                    <div className='text-sm'>
                        {song.artist} • {song.album || 'Unknown Album'}
                    </div>
                    <div className='text-sm'>
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

                <Button onClick={handleRequest} className='rounded-2xl'>
                    {getButtonText(requestStarted, !!data?.playUrl)}
                </Button>
            </CardContent>
        </Card>
    )
}