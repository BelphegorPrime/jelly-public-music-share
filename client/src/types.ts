export type SongData = {
    id: string | undefined;
    name: string | null | undefined;
    album: string | null | undefined;
    artist: string;
    duration: [number, number];
    type: string | undefined;
    image: string | null;
    source: "JELLYFIN" | "NAVIDROME";
}