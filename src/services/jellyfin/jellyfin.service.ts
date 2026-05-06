import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Jellyfin, Api } from '@jellyfin/sdk';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import { BaseItemDto, LyricLine } from '@jellyfin/sdk/lib/generated-client/models';
import { JELLYFIN_URL, JELLYFIN_USERNAME, JELLYFIN_API_KEY } from '../../config';

const execPromise = promisify(exec);

export class JellyfinService {
  private baseUrl: string;
  private username: string;
  private apiKey: string;
  private jellyfinSdk: Jellyfin;
  private api: Api;
  private itemsApi: ReturnType<typeof getItemsApi>;
  private userApi: ReturnType<typeof getUserApi>;
  private libraryApi: ReturnType<typeof getLibraryApi>;
  private lyricsApi: ReturnType<typeof getLyricsApi>;

  constructor() {
    this.baseUrl = JELLYFIN_URL;
    this.username = JELLYFIN_USERNAME;
    this.apiKey = JELLYFIN_API_KEY;

    this.jellyfinSdk = new Jellyfin({
      clientInfo: {
        name: 'Jelly Public Music Share',
        version: '1.0.0'
      },
      deviceInfo: {
        name: 'Jelly Public Music Share',
        id: 'jelly-public-music-share-device',
      }
    });
    this.api = this.jellyfinSdk.createApi(
      this.baseUrl,
      this.apiKey
    );
    this.itemsApi = getItemsApi(this.api);
    this.userApi = getUserApi(this.api);
    this.libraryApi = getLibraryApi(this.api);
    this.lyricsApi = getLyricsApi(this.api);
  }

  async getMusicLibrary(ids?: string[]): Promise<Array<BaseItemDto>> {
    // Return empty array if Jellyfin not configured
    if (!this.baseUrl || !this.username || !this.apiKey) {
      return [];
    }

    try {
      // First get the user ID by username
      const usersResponse = await this.userApi.getUsers();
      const user = usersResponse.data.find(u => u.Name === this.username);

      if (!user?.Id) {
        console.error(`User '${this.username}' not found`);
        return [];
      }

      // Then fetch items using the user ID
      const response = await this.itemsApi.getItems({
        ids,
        userId: user.Id,
        includeItemTypes: ['Audio'],
        recursive: true,
        fields: []
      });

      return response.data.Items || [];
    } catch (error) {
      console.error('Error fetching music library:', error);
      // Return empty array instead of throwing to handle missing Jellyfin server gracefully
      return [];
    }
  }

  async getMusicById(itemId: string): Promise<BaseItemDto | null> {
    if (!this.baseUrl || !this.username || !this.apiKey) {
      return null;
    }

    const items = await this.getMusicLibrary([itemId]);
    const item = items.find(i => i.Id === itemId);
    if (item) {
      return item;
    }
    return null;
  }

  async searchMusic(query: string): Promise<any[]> {
    // Return empty array if Jellyfin not configured
    if (!this.baseUrl || !this.username || !this.apiKey) {
      return [];
    }

    try {
      const response = await this.itemsApi.getItems({
        searchTerm: query,
        isMissing: false,
        limit: 800,
        recursive: true,
        imageTypeLimit: 1,
        enableTotalRecordCount: false,
        fields: ['PrimaryImageAspectRatio', 'CanDelete', 'MediaSourceCount'],
        includeItemTypes: ['Playlist', 'MusicAlbum', 'Audio'],
      });
      console.log(`Search for "${query}" returned ${response.data.Items?.length || 0} items`);

      return response.data.Items || [];
    } catch (error) {
      console.error('Error searching music:', error);
      // Return empty array instead of throwing to handle missing Jellyfin server gracefully
      return [];
    }
  }

  async download(itemId: string, itemInfo: BaseItemDto, destinationPath: string): Promise<void> {
    // Generate unique filename and token using JWT service
    const extension = itemInfo.Container ? `.${itemInfo.Container}` : '.mp3';
    const safeFileName = `${itemInfo.Name}${extension}`;
    const fileName = `${itemId}_${safeFileName}`;

    const downloadLocation = path.join("/tmp", fileName);

    const response = await this.libraryApi.getFile(
      { itemId },
      {
        responseType: "stream"
      }
    );

    const stream = response.data as unknown as Readable;

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(downloadLocation);

      stream.pipe(writer);

      writer.on("finish", () => resolve(undefined));
      writer.on("error", reject);
    });

    // Transcode to MP3 after download
    await this.transcodeToMP3(downloadLocation, destinationPath);
  }

  /**
   * Fetch lyrics for a given item ID
   * @param itemId The ID of the media item to fetch lyrics for
   * @returns Object containing lyrics text and format, or null if not found
   */
  async getLyrics(itemId: string): Promise<{ lyrics: LyricLine[] } | null> {
    if (!this.baseUrl || !this.apiKey) {
      return null;
    }

    try {
      const { data } = await this.lyricsApi.getLyrics({ itemId })

      if (data.Lyrics) {
        return { lyrics: data.Lyrics}
      }

      return null;
    } catch (error) {
      console.error(`Error fetching lyrics for item ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Transcode audio file to MP3 format using ffmpeg
   * @param filePath Path to the file to be transcoded
   * @param destinationPath Path where the transcoded file should be saved
   */
  private async transcodeToMP3(filePath: string, destinationPath: string): Promise<void> {
    try {
      // Run ffmpeg command to convert to MP3
      const command = `ffmpeg -i "${filePath}" -acodec libmp3lame "${destinationPath}"`;

      console.log(`Transcoding ${filePath} to MP3...`);
      await execPromise(command);

      // Remove original file (since we're replacing it)
      await fs.promises.unlink(filePath);

      console.log(`Transcoded successfully: ${destinationPath}`);
    } catch (error) {
      console.error('Error transcoding to MP3:', error);
      // Continue with original file if transcoding fails
    }
  }
}