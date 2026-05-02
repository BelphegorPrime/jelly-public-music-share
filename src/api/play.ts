import express, { Request, Response } from 'express';
import { container } from '../di/container';
import { SongPlaybackService } from '../services/song.playback.service';
import { FileHandlerService } from '../services/file/file.handler.service';

const router = express.Router();
const playbackService = container.resolve(SongPlaybackService);
const fileHandlerService = container.resolve(FileHandlerService);

// GET /play/:token - Play a song using token (returns HTML interface)
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Play song and get file path
    const result = await playbackService.playSong(token, true);

    if (!result) {
      // Return error HTML page for invalid/expired tokens
      const htmlContent = fileHandlerService.getFileErrorHtml('expired');
      return res.status(401).type('html').send(htmlContent);
    }
    console.log('Play song result:', result);

    const { filePath } = result;

    // Check if file exists before attempting to stream
    try {
        await fileHandlerService.validateFileExists(filePath);
        console.log(`File exists, returning HTML page for playback: ${filePath}`);
    } catch (error) {
        console.log(`File doesn't exist: ${filePath}`);
        const htmlContent = fileHandlerService.getFileErrorHtml('not-found');
        return res.status(404).type('html').send(htmlContent);
    }

    // Return HTML page with embedded audio player instead of streaming audio
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Playing Song</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .audio-player { width: 100%; margin-top: 20px; }
        .info { background: #e9ecef; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>Playing Song</h1>
    <p>Audio file is loaded below:</p>

    <audio controls class="audio-player">
        <source src="/stream/${token}" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>

    <div class="info">
        <p><strong>Note:</strong> The audio will play directly in your browser using the HTML5 audio element.</p>
        <p><small>This is a placeholder HTML interface page. Actual audio streaming happens via separate endpoint.</small></p>
    </div>
</body>
</html>`;

    // Return HTML response instead of streaming audio
    return res.status(200).type('html').send(htmlTemplate);
  } catch (error) {
    console.log("Error in /play/:token route:", error);

    // Return error HTML for other failures
    const htmlContent = fileHandlerService.getFileErrorHtml('access-denied');
    res.status(500).type('html').send(htmlContent);
  }
});

export default router;