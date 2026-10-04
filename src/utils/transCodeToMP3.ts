import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util'; 

const execPromise = promisify(exec);

/**
 * Transcode audio file to MP3 format using ffmpeg
 * @param filePath Path to the file to be transcoded
 * @param destinationPath Path where the transcoded file should be saved
 */
export const  transcodeToMP3 = async (filePath: string, destinationPath: string): Promise<void> => {
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