import { useState, useEffect, useCallback } from 'react';
import type { LyricsData } from '@/PlayPage';
import useMediaQuery from '@/hooks/useMediaQuery';

// const ticksToSeconds = (ticks: number) => (ticks / 10000000).toFixed(2)

export default function LyricsDisplay({ lyricsData }: { lyricsData: LyricsData | null }) {
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const isWide = useMediaQuery('(width >= 28rem)');

  const calculateCurrentLyricIndex = useCallback((element: HTMLAudioElement | null) => {
    if (!element || !lyricsData || !lyricsData.lyrics || lyricsData.lyrics.length === 0) {
      return -1;
    }

    if (typeof element.currentTime !== 'number') {
      console.warn('currentTime property not available on audio element:', element);
      return -1;
    }

    const currentTicks = element.currentTime * 10000000;
    for (let i = lyricsData.lyrics.length - 1; i >= 0; i--) {
      if (lyricsData.lyrics[i].Start <= currentTicks) {
        return i;
      }
    }
    return -1;
  }, [lyricsData]);

  useEffect(() => {
    if (audioElement) {
      return undefined;
    }

    let intervalId: number | undefined;
    const findAudio = () => {
      const element = document.getElementById('audio-player');
      if (element instanceof HTMLAudioElement) {
        setAudioElement(element);
        return true;
      }
      return false;
    };

    if (!findAudio()) {
      intervalId = window.setInterval(findAudio, 250);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [audioElement]);

  useEffect(() => {
    if (!audioElement) {
      return undefined;
    }

    const updateLyrics = () => setCurrentLyricIndex(calculateCurrentLyricIndex(audioElement));

    audioElement.addEventListener('timeupdate', updateLyrics);
    updateLyrics();

    return () => {
      audioElement.removeEventListener('timeupdate', updateLyrics);
    };
  }, [audioElement, calculateCurrentLyricIndex]);

  if (!lyricsData || !lyricsData.lyrics) {
    return null;
  }

  return (
    <div className='py-4'>
        <div className={`space-y-1 text-sm ${isWide ? "" : "mb-20"}`}>
            {lyricsData.lyrics.map((entry, index) => {
                const isCurrent = index === currentLyricIndex
                return (
                    <div 
                        key={index} 
                        className={`transition-all ${
                        isCurrent
                            ? 'font-semibold'
                            : 'text-gray-800 dark:text-gray-300'
                        }`}
                    >
                        <div className={isCurrent ? 'text-primary' : 'text-gray-800 dark:text-gray-300'}>
                            {entry.Text}
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
}
