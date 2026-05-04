import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PlayPageError from '@/components/PlayPageError';
import AudioPlayer from './components/AudioPlayer';

type PlayPageContent =
  | 'loading'
  | 'success'
  | 'error'
  | 'expired'
  | 'not-found';

export default function PlayPage() {
  const { token } = useParams<{ token: string }>();

  const [renderContent, setRenderContent] = useState<PlayPageContent>(
    token ? 'loading' : 'error'
  );

  useEffect(() => {
    if (token) {
      fetch(`/api/validate/${token}`)
        .then((res) => res.json())
        .then((data) => {
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
    return <PlayPageError type="error" />;
  }

  if (renderContent === 'loading') {
    return (
      <div className="text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (
    renderContent === 'error' ||
    renderContent === 'expired' ||
    renderContent === 'not-found'
  ) {
    return <PlayPageError type={renderContent} />;
  }

  return (
    <div className="grid gap-4">
      <h1>Playing Song</h1>
      <AudioPlayer token={token} />
    </div>
  );
}
