import useMediaQuery from '@/hooks/useMediaQuery';
import MediaThemeTailwindAudio from 'player.style/tailwind-audio/react';
import { useEffect, useState } from 'react';

export default function AudioPlayer({ token }: { token: string }) {
    const [data, setData] = useState<{url: string} | null>(null);
    const isBig = useMediaQuery('(width >= 28rem)');

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
                const url = window.URL.createObjectURL(blob);
                setData({ url });
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

    const className = isBig ? "" : "fixed bottom-0 left-0 right-0 z-50";
    return (
        <>
            <h1 className={isBig ? "" : "hidden"}>Playing Song</h1>
            <MediaThemeTailwindAudio className={`w-full ${className}`}>
                <audio
                    id="audio-player"
                    slot="media"
                    src={data.url}
                    playsInline
                    crossOrigin="anonymous"
                />
            </MediaThemeTailwindAudio>
        </>
    );
}