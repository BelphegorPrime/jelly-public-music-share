import { Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SongData } from "@/types";

type PlaySongCardProps = {
    song: SongData | null
}

export default function PlaySongCard({
    song,
} : PlaySongCardProps) {
    if (!song) {
        return null
    }

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
                        {song.name}
                    </div>
                    <div className='text-sm'>
                        {song.artist}
                    </div>
                    <div className='text-sm'>
                        {song.album || 'Unknown Album'}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}