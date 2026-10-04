import { MediaServiceInterface } from './media.service.interface';
import { JellyfinService } from './jellyfin/jellyfin.service';
import { NavidromeService } from './navidrome/navidrome.service';
import { container } from '../../di/container';
import { JELLYFIN_URL, NAVIDROME_URL } from '../../config';
import { LyricItem, MediaItem } from '../../types/media-item.interface';

export class MediaService implements MediaServiceInterface {
  private jellyfinService: JellyfinService | null = null;
  private navidromeService: NavidromeService | null = null;

  constructor() {
    // Determine which services are available
    if (JELLYFIN_URL) {
      this.jellyfinService = container.resolve(JellyfinService);
    }
    if (NAVIDROME_URL) {
      this.navidromeService = container.resolve(NavidromeService);
    }
    console.log('MediaService initialized with services:', {
      jellyfin: this.jellyfinService ? 'available' : 'not available',
      navidrome: this.navidromeService ? 'available' : 'not available'
    })
  }

  async getMusicById(itemId: string): Promise<MediaItem | null> {
    if (this.jellyfinService) {
      try {
        const result = await this.jellyfinService.getMusicById(itemId);
        if (result) return result;
      } catch (error) {
        console.warn('Jellyfin service failed to get music by ID:', error);
      }
    }
    
    if (this.navidromeService) {
      try {
        const result = await this.navidromeService.getMusicById(itemId);
        if (result) return result;
      } catch (error) {
        console.warn('Navidrome service failed to get music by ID:', error);
      }
    }
    
    return null;
  }

  async searchMusic(query: string): Promise<MediaItem[]> {
    const results: MediaItem[] = [];

    if (this.jellyfinService) {
      try {
        const result = await this.jellyfinService.searchMusic(query);
        if (result.length > 0) {
          results.push(...result);
        }
      } catch (error) {
        console.warn('Jellyfin service failed to search music:', error);
      }
    }
    
    if (this.navidromeService) {
      try {
        const result = await this.navidromeService.searchMusic(query);
        if (result.length > 0) {
          results.push(...result);
        }
      } catch (error) {
        console.warn('Navidrome service failed to search music:', error);
      }
    }
    
    return results;
  }

  async download(itemId: string, itemInfo: MediaItem, destinationPath: string): Promise<void> {
    // Try Jellyfin first, then Navidrome
    if (this.jellyfinService) {
      try {
        await this.jellyfinService.download(itemId, itemInfo, destinationPath);
        return;
      } catch (error) {
        console.warn('Jellyfin service failed to download:', error);
      }
    }
    
    if (this.navidromeService) {
      try {
        await this.navidromeService.download(itemId, itemInfo, destinationPath);
        return;
      } catch (error) {
        console.warn('Navidrome service failed to download:', error);
      }
    }
    
    throw new Error('No available media service to download from');
  }

  async getLyrics(itemId: string): Promise<LyricItem | null> {
    // Try Jellyfin first, then Navidrome
    if (this.jellyfinService) {
      try {
        const result = await this.jellyfinService.getLyrics(itemId);
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn('Jellyfin service failed to get lyrics:', error);
      }
    }

    if (this.navidromeService) {
      try {
        const result = await this.navidromeService.getLyrics(itemId);
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn('Navidrome service failed to get lyrics:', error);
      }
    }

    return null;
  }
}