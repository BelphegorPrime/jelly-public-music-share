export interface FileServiceInterface {
  saveFile(sourcePath: string, destinationPath: string): Promise<void>;
  readFile(path: string): Promise<Buffer>;
  fileExists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
}
