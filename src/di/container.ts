import { container } from 'tsyringe';
import { FileServiceInterface } from '../services/file/file.interface';
import { FileService } from '../services/file/file.service';
import { CleanupService } from '../services/cleanup.service';
import { SongPlaybackService } from '../services/song.playback.service';
import { RequestedSongsService } from '../services/requested-songs.service';
import { FileHandlerService } from '../services/file/file.handler.service';
import { AuthTokenService } from '../services/token/auth-token.service';
import { EphemeralTokenService } from '../services/token/ephemeral-token.service';
import { SONG_DOWNLOAD_DIR, TOKEN_USAGE_DATA_FILE, REQUESTED_SONGS_DATA_FILE } from '../config';
import { JellyfinService } from '../services/jellyfin/jellyfin.service';
import { DatabaseService } from '../db/database.service';
import { RequestedSongsRepository } from '../db/repositories/requested-songs.repository';
import { EphemeralTokensRepository } from '../db/repositories/ephemeral-tokens.repository';

// Register interfaces with their implementations
container.register<JellyfinService>('JellyfinService', { useClass: JellyfinService });
container.register<FileServiceInterface>('FileServiceInterface', { useClass: FileService });

// Register singleton token services
container.registerSingleton(AuthTokenService);
container.registerSingleton(EphemeralTokenService);
container.registerSingleton(DatabaseService);

// Register database repositories as singletons
container.registerSingleton(RequestedSongsRepository);
container.registerSingleton(EphemeralTokensRepository);

// Register concrete services
container.register<CleanupService>(CleanupService, { useClass: CleanupService });
container.register<FileHandlerService>(FileHandlerService, { useClass: FileHandlerService });
container.register<SongPlaybackService>(SongPlaybackService, { useClass: SongPlaybackService });
container.register<RequestedSongsService>(RequestedSongsService, { useClass: RequestedSongsService });

// Register configuration values
container.register('SONG_DOWNLOAD_DIR', {
  useValue: SONG_DOWNLOAD_DIR
});
container.register('TOKEN_USAGE_DATA_FILE', {
  useValue: TOKEN_USAGE_DATA_FILE
});
container.register('REQUESTED_SONGS_DATA_FILE', {
  useValue: REQUESTED_SONGS_DATA_FILE
});

// Register the cleanup service and requested songs service as singletons so there's only one instance that gets used globally
container.registerSingleton(CleanupService);
container.registerSingleton(RequestedSongsService);

export { container };