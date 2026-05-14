

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PlayPageError from '@/components/PlayPageError';
import AudioPlayer from './components/AudioPlayer';
import LyricsDisplay from './components/LyricsDisplay';
import { LinkPreviewMeta } from '@/components/LinkPreviewMeta';
import type { SongData } from './types';
import PlaySongCard from './components/PlaySongCard';

type PlayPageContent = 'loading' | 'success' | 'error' | 'expired' | 'not-found';

type LyricRow = {
  Start:  number;
  Text: string;
  Cues: Record<string, unknown>[];
}

export type LyricsData = {
  lyrics: LyricRow[] | null
}

const fetchSongData = async (token: string) => {
  try {
    const response = await fetch(`/api/songData/${token}`);
    if (response.ok) {
      return await response.json();
    } else {
      console.log('SongData not available for this song');
    }
  } catch (error) {
    console.error('Error fetching songData:', error);
  }
};

const fetchLyrics = async (token: string) => {
  try {
    const response = await fetch(`/api/lyrics/${token}`);
    if (response.ok) {
      return await response.json();
    } else {
      console.log('Lyrics not available for this song');
    }
  } catch (error) {
    console.error('Error fetching lyrics:', error);
  }
};

export default function PlayPage() {
  const { token } = useParams<{ token: string }>();

  const [renderContent, setRenderContent] = useState<PlayPageContent>(token ? 'loading' : 'error');
  const [songData, setSongData] = useState<{ itemInfo: SongData | null } | null>(null);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);

  useEffect(() => {
    if (token) {
      fetch(`/api/validate/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setRenderContent('success');

            fetchSongData(token).then(data => {
              console.log(data)
              return data
            }).then(setSongData)
            fetchLyrics(token).then(data => {
              console.log(data)
              return data
            }).then(setLyricsData);
          } else if (data.expired) {
            setRenderContent('expired');
          } else if (data.notFound) {
            setRenderContent('not-found');
          } else {
            setRenderContent('error');
          }
        })
        .catch(() => setRenderContent('error'));
    }
  }, [token]);

  if (!token) {
    return (
      <PlayPageError type='error' />
    );
  }

  if (renderContent === 'loading') {
    return (
      <div className='text-center'>
        <p>Loading...</p>
      </div>
    );
  }

  if (renderContent === 'error' || renderContent === 'expired' || renderContent === 'not-found') {
    return (
      <PlayPageError type={renderContent} />
    );
  }

  // Extract song data for meta tags
  const songInfo = songData?.itemInfo;
  const songMetaData = songInfo ? {
    name: songInfo.name ?? undefined,
    artist: songInfo.artist ?? undefined,
    album: songInfo.album ?? undefined,
    imageUrl: songInfo.image ?? undefined
  } : undefined;

  return (
    <div className='grid gap-4'>
      <LinkPreviewMeta 
        songData={songMetaData} 
        url={`${window.location.origin}/play/${token}`} 
      />
      <PlaySongCard song={songData?.itemInfo || null} />
      <AudioPlayer token={token} />
      <LyricsDisplay lyricsData={lyricsData} />
    </div>
  );
}
