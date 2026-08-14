import fs from 'node:fs';
import path from 'node:path';
import { inject, injectable } from 'tsyringe';
import { NAVIDROME_URL, NAVIDROME_USERNAME, NAVIDROME_PASSWORD } from '../../../config';
import { LyricItem, MediaItem } from '../../../types/media-item.interface';
import { transcodeToMP3 } from '../../../utils/transCodeToMP3';
import SubsonicAPI, { Child, StructuredLyrics, SubsonicBaseResponse } from 'subsonic-api';
import { MediaServiceInterface } from '../media.service.interface';
import { getDurartionInMinutesAndSeconds } from '../../../utils/getDurartionInMinutesAndSeconds';

type SubsonicLyricsListOverwrite = SubsonicBaseResponse & {
  lyricsList: { structuredLyrics: StructuredLyrics[] };
}
const secondsToTicks = (seconds: number) => seconds * 10000000

const writeFile = (reader: ReadableStreamDefaultReader): ((location: string) => Promise<void>) => {
  const chunks: Uint8Array[] = [];
  // Read the stream in chunks
  const readChunk = async (location: string) => {
    const { done, value } = await reader.read();
    if (done) {
      // Write all chunks to file
      const buffer = Buffer.concat(chunks);
      await fs.promises.writeFile(location, buffer);
      return;
    }

    chunks.push(value);
    await readChunk(location);
  };
  return readChunk
}

@injectable()
export class NavidromeService implements MediaServiceInterface {
  private downloadDirectory: string;
  
  private baseUrl: string;
  private username: string;
  private password: string;
  private api: SubsonicAPI | null = null;

  constructor(
    @inject('SONG_DOWNLOAD_DIR') downloadDir: string,
  ) {
    this.downloadDirectory = downloadDir;
    
    this.baseUrl = NAVIDROME_URL;
    this.username = NAVIDROME_USERNAME;
    this.password = NAVIDROME_PASSWORD;
    if (this.baseUrl && this.username && this.password) {
      this.api = new SubsonicAPI({
        url: this.baseUrl,
        auth: {
          username: this.username,
          password: this.password,
        },
      });
    }
  }

  private async downloadCover(itemId: string, coverArtId: string): Promise<void> {
    if (!this.api) {
      return;
    }

    try {
      const imageDownloadLocation = path.join(this.downloadDirectory, `${itemId}_cover.jpg`);

      if (fs.existsSync(imageDownloadLocation)) {
        return; // File already exists, no need to download again
      }

      const imageResponse = await this.api.getCoverArt({
        id: coverArtId,
      });

      if (imageResponse.body) {
        const reader = imageResponse.body.getReader();
        await writeFile(reader)(imageDownloadLocation);
      }
    } catch (error) {
      console.error('NAVIDROME: Error downloading cover file:', error);
      throw error;
    }
  }

  private async convertToMediaItem(item: Child): Promise<MediaItem> {
    const seconds = Math.round(item.duration ? item.duration / 1000 : 0);

    if (item.coverArt) {
      await this.downloadCover(item.id, item.coverArt)
    }

    return {
      id: item.id || '',
      name: item.title || '',
      container: item.suffix,
      artist: item.artist || 'Unknown Artist',
      album: item.album,
      duration: item.duration ? 
        getDurartionInMinutesAndSeconds(secondsToTicks(seconds)) :
        [0, 0],
      image: `/api/image/${item.id}`,
      type: item.type,
      source: "NAVIDROME",
      metadata: { coverArt: item.coverArt },
    };
  }

  async getMusicById(itemId: string): Promise<MediaItem | null> {
    if (!this.api) {
      return null;
    }

    try {
      // Call Navidrome's Subsonic API to fetch a specific music item
      // Using getSong endpoint to get song details
      const response = await this.api.getSong({
        id: itemId,
      });

      const song = response.song;
      if (song) {
        return await this.convertToMediaItem(song);
      }
      
      return null;
    } catch (error) {
      console.error('NAVIDROME: Error fetching music by ID:', error);
      return null;
    }
  }

  async searchMusic(query: string): Promise<MediaItem[]> {
    // Return empty array if Navidrome not configured
    if (!this.api) {
      return [];
    }

    try {
      // Call Navidrome's Subsonic API to search for music
      // Using search3 endpoint to search for songs, albums, and artists
      const response = await this.api.search3({
        query: query,
        artistCount: 0, // Don't return artists in search results
        albumCount: 0, // Don't return albums in search results
        songCount: 50, // Limit to 50 songs
      });
      // Return the search results
      return await Promise.all(
        (response.searchResult3?.song || [])
          .map((song: any) => this.convertToMediaItem(song))
      );
    } catch (error) {
      console.error('NAVIDROME: Error searching music:', error);
      // Return empty array instead of throwing to handle missing Navidrome server gracefully
      return [];
    }
  }

  async download(itemId: string, itemInfo: MediaItem, destinationPath: string): Promise<void> {
    if (!this.api) {
      return;
    }

    // Generate unique filename and token using JWT service
    const extension = itemInfo.container ? `.${itemInfo.container}` : '.mp3';
    const safeFileName = `${itemInfo.name}${extension}`;
    const fileName = `${itemId}_${safeFileName}`;

    const downloadLocation = path.join("/tmp", fileName);

    if (itemInfo.metadata?.coverArt) {
      await this.downloadCover(itemId, itemInfo.metadata.coverArt)
    }

    try {
      // Call Navidrome's Subsonic API to download a specific music item
      // Using stream endpoint to get the audio file
      const response = await this.api.stream({
        id: itemId,
        format: 'raw', // Stream in raw format to preserve quality
      });

      // Handle the response stream properly
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      await writeFile(reader)(downloadLocation);
      
      // Transcode to MP3 after download (if needed)
      await transcodeToMP3(downloadLocation, destinationPath);
    } catch (error) {
      console.error('NAVIDROME: Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Maps structured lyrics to the LyricItem format
   * @param structuredLyrics The structured lyrics from Navidrome
   * @returns Mapped LyricItem or null if no lyrics
   */
  private mapStructuredLyrics(structuredLyrics: StructuredLyrics | undefined): LyricItem | null {
    if (!structuredLyrics || !structuredLyrics.line) {
      return null;
    }

    // Map the structured lyrics to the LyricItem format
    return {
      lyrics: structuredLyrics.line.map((line) => {
        const seconds = Math.round(line.start ? line.start / 1000 : 0);
        return {
          Text: line.value,
          Start: secondsToTicks(seconds)
        }
      }).sort((a, b) => (a.Start || 0) - (b.Start || 0))
    };
  }

  /**
   * Fetch lyrics for a given item ID
   * @param itemId The ID of the media item to fetch lyrics for
   * @returns Object containing lyrics text and format, or null if not found
   */
  async getLyrics(itemId: string): Promise<LyricItem | null> {
    if (!this.api) {
      return null;
    }

    try {
      const response = (await this.api.getLyricsBySongId({
        id: itemId
      })) as unknown as SubsonicLyricsListOverwrite;

      if (response.lyricsList && response.lyricsList.structuredLyrics && response.lyricsList.structuredLyrics.length > 0) {
        return this.mapStructuredLyrics(response.lyricsList.structuredLyrics.at(0));
      }
      
      return null;
    } catch (error) {
      throw new Error(`NAVIDROME: Error fetching lyrics for item ${itemId}: ${(error as Error).message}`);
    }
  }
}
