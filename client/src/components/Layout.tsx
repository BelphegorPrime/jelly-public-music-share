import React from 'react';
import { ThemeIcon } from './ThemeIcon';
import { LinkPreviewMeta } from './LinkPreviewMeta';

type LayoutProps = React.PropsWithChildren & {
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <LinkPreviewMeta 
        title="Jelly Public Music Share" 
        description="Share rare tracks instantly from Jellyfin." 
        image="/favicon.svg" 
      />
      <div className='min-h-screen'>
        <div className='max-w-5xl mx-auto'>
          {/* Header */}
          <header className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-4xl font-bold'>Jelly Public Music Share</h1>
                <p className='mt-2'>Share rare tracks instantly from Jellyfin.</p>
              </div>
              <ThemeIcon className='w-4 h-4 mr-2' />
            </div>
          </header>

          {/* Main content */}
          <main className='p-6'>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
