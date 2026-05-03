

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
      <PlayPageError type='error' />
    );
  }

  if (renderContent === 'loading') {
    return (
      <div className='text-center'>
        <p>Loading...</p>
      </div>
    );
  }

  if (renderContent === 'error' || renderContent === 'expired' || renderContent === 'not-found') {
    return (
      <PlayPageError type={renderContent} />
    );
  }

  // Success case - render audio player
  return (
    <div className='grid gap-4'>
      <h1>Playing Song</h1>
      <p>Audio file is loaded below:</p>

      <AudioPlayer token={token} />

      <div className="info">
          <p><strong>Note:</strong> The audio will play directly in your browser using the HTML5 audio element.</p>
          <p><small>This is a placeholder HTML interface page. Actual audio streaming happens via separate endpoint.</small></p>
      </div>
    </div>
  );
}
