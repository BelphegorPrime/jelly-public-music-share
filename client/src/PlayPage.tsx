

import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PlayPageError from '@/components/PlayPageError';
import AudioPlayer from './components/AudioPlayer';

type PlayPageContent = 'loading' | 'success' | 'error' | 'expired' | 'not-found';

export default function PlayPage() {
  const { token } = useParams<{ token: string }>();

  const [renderContent, setRenderContent] = useState<PlayPageContent>(token ? 'loading' : 'error');

  useEffect(() => {
    if (token) {
      fetch(`/api/validate/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setRenderContent('success');
          } else if (data.expired) {
            setRenderContent('expired');
          } else if (data.notFound) {
            setRenderContent('not-found');
          } else {
            setRenderContent('error');
          }
        })
        .catch(() => setRenderContent('error'));
    }
  }, [token]);

  if (!token) {
    return (
      <div className='min-h-screen bg-zinc-950 text-zinc-100 p-6'>
        <PlayPageError type='error' />
      </div>
    );
  }

  if (renderContent === 'loading') {
    return (
      <div className='min-h-screen bg-zinc-950 text-zinc-100 p-6 flex items-center justify-center'>
        <div className='text-center'>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (renderContent === 'error' || renderContent === 'expired' || renderContent === 'not-found') {
    return (
      <div className='min-h-screen bg-zinc-950 text-zinc-100 p-6'>
        <PlayPageError type={renderContent} />
      </div>
    );
  }

  // Success case - render audio player
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100 p-6'>
      <div className='max-w-5xl mx-auto space-y-6'>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold'>Jelly Public Music Share</h1>
            <p className='text-zinc-400 mt-2'>Share rare tracks instantly from Jellyfin.</p>
          </div>
          <Button variant='outline' className='rounded-2xl'>
            <Moon className='w-4 h-4 mr-2' /> Theme
          </Button>
        </div>

        {/* Results */}
        <div className='grid gap-4'>
          <h1>Playing Song</h1>
          <p>Audio file is loaded below:</p>

          <AudioPlayer token={token} />

          <div className="info">
              <p><strong>Note:</strong> The audio will play directly in your browser using the HTML5 audio element.</p>
              <p><small>This is a placeholder HTML interface page. Actual audio streaming happens via separate endpoint.</small></p>
          </div>
        </div>
      </div>
    </div>
  );
}
