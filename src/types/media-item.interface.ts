import { LyricLine } from '@jellyfin/sdk/lib/generated-client/models';

export interface MediaItem {
  id: string | undefined;
  name: string | null | undefined;
  artist: string;
  album: string | null | undefined;
  duration: [number, number];
  type: string | undefined;
  image: string | null;
  source: "JELLYFIN" | "NAVIDROME";
  container: string | null | undefined;
  metadata?: Record<string, any>
}

export interface LyricItem {
    lyrics: LyricLine[]
}
