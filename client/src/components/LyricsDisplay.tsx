import { useState, useEffect, useRef, useCallback } from 'react';
import type { LyricsData } from '@/PlayPage';
import useMediaQuery from '@/hooks/useMediaQuery';

// const ticksToSeconds = (ticks: number) => (ticks / 10000000).toFixed(2)

export default function LyricsDisplay({ lyricsData }: { lyricsData: LyricsData | null }) {
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firstUpdateRef = useRef(true);
  const isBig = useMediaQuery('(width >= 28rem)');

  // Find current lyric index based on playback time
  const calculateCurrentLyricIndex = useCallback((element: HTMLAudioElement | null) => {
    if (!element || !lyricsData || !lyricsData.lyrics || lyricsData.lyrics?.length === 0) {
      return -1;
    }

    // Verify that currentTime property exists
    if (typeof element.currentTime !== 'number') {
      console.warn('currentTime property not available on audio element:', element);
      return -1;
    }

    // Convert current time (seconds) to ticks
    const currentTicks = element.currentTime * 10000000;

    // Find the last lyric that has started
    for (let i = lyricsData.lyrics?.length - 1; i >= 0; i--) {
      if (lyricsData.lyrics[i].Start <= currentTicks) {
        return i;
      }
    }
    return -1;
  }, [lyricsData])

  // Update lyrics in real-time while playing
  useEffect(() => {
    const element = document.getElementById("audio-player");
    if (element instanceof HTMLAudioElement) {
      audioRef.current = element;
      
      const updateLyrics = () => {
        const newIndex = calculateCurrentLyricIndex(element);
        setCurrentLyricIndex(newIndex);
      };

      // Listen for time updates
      element.addEventListener('timeupdate', updateLyrics);
      
      // Initial update
      if (firstUpdateRef.current) {
        updateLyrics();
        firstUpdateRef.current = false;
      }
      
      return () => {
        element.removeEventListener('timeupdate', updateLyrics);
      };
    }
  }, [lyricsData, calculateCurrentLyricIndex]);

  if (!lyricsData || !lyricsData.lyrics) {
    return null;
  }

  return (
    <div className='py-4'>
        <div className={`space-y-1 text-sm ${isBig ? "" : "mb-20"}`}>
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
