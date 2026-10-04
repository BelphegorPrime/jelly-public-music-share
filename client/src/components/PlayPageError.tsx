import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayPageErrorProps {
  type: 'error' | 'expired' | 'not-found';
  token?: string;
}

const getTokenDurationMinutes = (token?: string): number | undefined => {
  if (!token) return undefined;

  try {
    const payload = token.split('.')[1];
    if (!payload) return undefined;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims = JSON.parse(atob(paddedBase64)) as { iat?: unknown; exp?: unknown };

    return typeof claims.iat === 'number' && typeof claims.exp === 'number'
      ? Math.round((claims.exp - claims.iat) / 60)
      : undefined;
  } catch {
    return undefined;
  }
};

const getAllowedRenewalCount = (token?: string): number => {
  if (!token) return 0;

  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims = JSON.parse(atob(paddedBase64)) as { allowedRenewalCount?: unknown };

    return typeof claims.allowedRenewalCount === 'number' && claims.allowedRenewalCount > 0
      ? claims.allowedRenewalCount
      : 0;
  } catch {
    return 0;
  }
};

const formatDuration = (totalMinutes: number) => {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    days > 0 && `${days} ${days === 1 ? 'day' : 'days'}`,
    hours > 0 && `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
    minutes > 0 && `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  ].filter(Boolean);

  return parts.join(' ') || 'less than a minute';
};

const PlayPageError: React.FC<PlayPageErrorProps> = ({ type, token }) => {
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const [replacementToken, setReplacementToken] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const tokenDurationMinutes = getTokenDurationMinutes(replacementToken ?? token);
  const allowedRenewalCount = getAllowedRenewalCount(token);
  const baseClasses = 'flex flex-col justify-center items-center text-center px-8 py-12 rounded min-h-[300px]';

  const requestNewLink = async () => {
    if (!token || requesting) return;

    setRequesting(true);
    setRequestError(null);
    try {
      const response = await fetch(`/api/validate/${token}/renew`, {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.error || 'Could not create a new link. Please try again.');
      }
      setReplacementToken(data.token);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Could not create a new link. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  switch (type) {
    case 'error':
      return (
        <div className={`${baseClasses} bg-red-100 dark:bg-red-950 border-l-4 border-red-600 dark:border-red-400`}>
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
            Error Occurred
          </h1>
          <p className="text-base text-red-800 dark:text-red-200 mb-6">
            There was an error playing the song.
          </p>
          <p className="text-lg font-bold text-red-900 dark:text-red-100">
            Please try again later.
          </p>
        </div>
      );
    case 'expired':
      return (
        <div className={`${baseClasses} bg-amber-100 dark:bg-amber-950 border-l-4 border-amber-500 dark:border-amber-400`}>
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
            Link Expired
          </h1>
          <p className="text-base text-amber-700 dark:text-amber-200 mb-6">
            This link has expired or has already been used.
          </p>
          {replacementToken ? (
            <Button onClick={() => navigate(`/play/${replacementToken}`)}>
              Open New Link
            </Button>
          ) : allowedRenewalCount > 0 ? (
            <Button onClick={requestNewLink} disabled={!token || requesting}>
              <RefreshCw className={`size-4 ${requesting ? 'animate-spin' : ''}`} />
              {requesting ? 'Requesting...' : 'Request New Link'}
            </Button>
          ) : (
            <p className="text-sm text-amber-900 dark:text-amber-200">
              No renewals remaining.
            </p>
          )}
          {requestError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{requestError}</p>}
          {tokenDurationMinutes !== undefined && (
            <p className="text-sm text-amber-900 dark:text-amber-200 mt-4 opacity-70">
              Links are valid for {formatDuration(tokenDurationMinutes)}
            </p>
          )}
        </div>
      );
    case 'not-found':
      return (
        <div className={`${baseClasses} bg-gray-100 dark:bg-gray-900 border-l-4 border-gray-500 dark:border-gray-400`}>
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Song Not Found
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-6">
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