"use client";

import {
  AudioPlayer as AudioPlayerComponent,
  AudioPlayerControlBar,
  AudioPlayerDurationDisplay,
  AudioPlayerElement,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@/components/ai-elements/audio-player";
import type { Experimental_SpeechResult as SpeechResult } from "ai";
import { useEffect, useState } from "react";

export default function AudioPlayer({ token }: { token: string }) {
  const [data, setData] = useState<SpeechResult["audio"] | null>(null);

  useEffect(() => {
    if (!token){
        return;
    }
    
    const fetchData = async () => {
        try {
            const response = await fetch(`/api/stream/${token}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const base64String = btoa(
                new Uint8Array(arrayBuffer).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ""
                )
            );
            const mediaType = blob.type || "audio/mpeg";
            const newData: SpeechResult["audio"] = {
                base64: base64String,
                mediaType,
                format: "mp3",
                uint8Array: new Uint8Array(arrayBuffer),
            };
            setData(newData);
        } catch (error) {
            console.error("Error fetching audio data:", error);
        }
    };

    if (!data) {
      fetchData();
    }
  }, [token, data]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex size-full items-center justify-center">
      <AudioPlayerComponent>
        <AudioPlayerElement data={data} />
        <AudioPlayerControlBar>
          <AudioPlayerPlayButton />
          <AudioPlayerSeekBackwardButton seekOffset={10} />
          <AudioPlayerSeekForwardButton seekOffset={10} />
          <AudioPlayerTimeDisplay />
          <AudioPlayerTimeRange />
          <AudioPlayerDurationDisplay />
          <AudioPlayerMuteButton />
          <AudioPlayerVolumeRange />
        </AudioPlayerControlBar>
      </AudioPlayerComponent>
    </div>
  );
};
