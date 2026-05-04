import fs from 'fs';
import { FileServiceInterface } from './file.interface';

export class FileService implements FileServiceInterface {
  async saveFile(sourcePath: string, destinationPath: string): Promise<void> {
    // This is a simplified implementation
    // In a real implementation, you'd copy or move the file from source to destination
    await fs.promises.copyFile(sourcePath, destinationPath);
  }

  async readFile(path: string): Promise<Buffer> {
    return fs.promises.readFile(path);
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    await fs.promises.unlink(path);
  }
}