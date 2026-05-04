import React from 'react';

interface PlayPageErrorProps {
  type: 'error' | 'expired' | 'not-found';
}

const PlayPageError: React.FC<PlayPageErrorProps> = ({ type }) => {
  const baseClasses =
    'flex flex-col justify-center items-center text-center px-8 py-12 rounded min-h-[300px]';

  switch (type) {
    case 'error':
      return (
        <div
          className={`${baseClasses} border-l-4 border-red-600 bg-red-100 dark:border-red-400 dark:bg-red-950`}
        >
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-red-900 dark:text-red-100">
            Error Occurred
          </h1>
          <p className="mb-6 text-base text-red-800 dark:text-red-200">
            There was an error playing the song.
          </p>
          <p className="text-lg font-bold text-red-900 dark:text-red-100">
            Please try again later.
          </p>
        </div>
      );
    case 'expired':
      return (
        <div
          className={`${baseClasses} border-l-4 border-amber-500 bg-amber-100 dark:border-amber-400 dark:bg-amber-950`}
        >
          <div className="mb-4 text-6xl">⏳</div>
          <h1 className="mb-2 text-2xl font-bold text-amber-900 dark:text-amber-100">
            Link Expired
          </h1>
          <p className="mb-6 text-base text-amber-700 dark:text-amber-200">
            This link has expired or has already been used.
          </p>
          <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
            Request a new link to access the song.
          </p>
          <p className="mt-4 text-sm text-amber-900 opacity-70 dark:text-amber-200">
            Links are valid for 24 hours
          </p>
        </div>
      );
    case 'not-found':
      return (
        <div
          className={`${baseClasses} border-l-4 border-gray-500 bg-gray-100 dark:border-gray-400 dark:bg-gray-900`}
        >
          <div className="mb-4 text-6xl">🔍</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Song Not Found
          </h1>
          <p className="mb-6 text-base text-gray-700 dark:text-gray-300">
            The requested song could not be found on our servers.
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Please contact support if you believe this is an error.
          </p>
        </div>
      );
    default:
      return null;
  }
};

export default PlayPageError;
