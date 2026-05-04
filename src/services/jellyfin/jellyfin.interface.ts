import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

export interface JellyfinServiceInterface {
  getMusicById(itemId: string): Promise<BaseItemDto | null>;
  getMusicLibrary(ids?: string[]): Promise<Array<BaseItemDto>>;
  searchMusic(query: string): Promise<any[]>;
  download(itemId: string, itemInfo: BaseItemDto, destinationPath: string): Promise<void>;
}