import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models"
import { JELLYFIN_URL } from "../config"
import { getDurartionInMinutesAndSeconds } from "./getDurartionInMinutesAndSeconds"

export type SongData = {
    id: string | undefined;
    name: string | null | undefined;
    album: string | null | undefined;
    artist: string;
    duration: [number, number]
    type: string | undefined,
    image: string | null
}

export const getSongData = (item: BaseItemDto): SongData => {
    return {
        id: item.Id,
        name: item.Name,
        album: item.Album,
        artist: item.ArtistItems?.[0]?.Name || 'Unknown Artist',
        duration: item.RunTimeTicks ? getDurartionInMinutesAndSeconds(item.RunTimeTicks) : [0,0], // Convert ticks to seconds
        type: item.Type,
        image: item.ImageTags?.Primary ? `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&maxWidth=200` : null
    }
}