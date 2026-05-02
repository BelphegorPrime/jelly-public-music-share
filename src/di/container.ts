import { container } from 'tsyringe';
import { TokenServiceInterface } from '../services/token/token.interface';
import { FileServiceInterface } from '../services/file/file.interface';
import { TokenServiceAdapter } from '../services/token/token.adapter';
import { FileService } from '../services/file/file.service';
import { CleanupService } from '../services/cleanup.service';
import { SongPlaybackService } from '../services/song.playback.service';
import { FileHandlerService } from '../services/file/file.handler.service';
import { SONG_DOWNLOAD_DIR } from '../config';
import { JellyfinService } from '../services/jellyfin/jellyfin.service';

// Register interfaces with their implementations
container.register<JellyfinService>('JellyfinService', { useClass: JellyfinService });
container.register<TokenServiceInterface>('TokenServiceInterface', { useClass: TokenServiceAdapter });
container.register<FileServiceInterface>('FileServiceInterface', { useClass: FileService });

// Register concrete services
container.register<CleanupService>(CleanupService, { useClass: CleanupService });
container.register<FileHandlerService>(FileHandlerService, { useClass: FileHandlerService });
container.register<SongPlaybackService>(SongPlaybackService, { useClass: SongPlaybackService });

// Register configuration values
container.register('SONG_DOWNLOAD_DIR', {
  useValue: SONG_DOWNLOAD_DIR
});

// Register the cleanup service as a singleton so there's only one instance that gets used globally
container.registerSingleton(CleanupService);

export { container };