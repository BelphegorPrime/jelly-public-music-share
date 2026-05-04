import React from 'react';
import { ThemeIcon } from './ThemeIcon';

type LayoutProps = React.PropsWithChildren & {};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Jelly Public Music Share</h1>
              <p className="mt-2">Share rare tracks instantly from Jellyfin.</p>
            </div>
            <ThemeIcon className="mr-2 h-4 w-4" />
          </div>
        </header>

        {/* Main content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
