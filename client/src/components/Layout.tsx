import React from 'react';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LayoutProps = React.PropsWithChildren & {
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100'>
      <div className='max-w-5xl mx-auto'>
        {/* Header */}
        <header className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-bold'>Jelly Public Music Share</h1>
              <p className='text-zinc-400 mt-2'>Share rare tracks instantly from Jellyfin.</p>
            </div>
            <Button variant='outline' className='rounded-2xl'>
              <Moon className='w-4 h-4 mr-2' /> Theme
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className='p-6'>
          {children}
        </main>
      </div>
    </div>
  );
}