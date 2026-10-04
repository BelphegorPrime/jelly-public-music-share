import { LyricItem, MediaItem } from '../../types/media-item.interface';

export interface MediaServiceInterface {
  getMusicById(itemId: string): Promise<MediaItem | null>;
  searchMusic(query: string): Promise<MediaItem[]>;
  download(itemId: string, itemInfo: MediaItem, destinationPath: string): Promise<void>;
  getLyrics(itemId: string): Promise<LyricItem | null>;
}
