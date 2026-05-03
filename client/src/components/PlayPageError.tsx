import React from 'react';

interface PlayPageErrorProps {
  type: 'error' | 'expired' | 'not-found';
}

const PlayPageError: React.FC<PlayPageErrorProps> = ({ type }) => {
  switch (type) {
    case 'error':
      return (
        <div>
          <h1>Error Occurred</h1>
          <p>There was an error playing the song.</p>
          <div className="error">
            <p><strong>Please try again later.</strong></p>
          </div>
        </div>
      );
    case 'expired':
      return (
        <div>
          <h1>Invalid or Expired Link</h1>
          <p>The link you used has expired or has already been used.</p>
          <div className="error">
            <p><strong>Please ensure you are using a valid link that has not yet expired.</strong></p>
          </div>
          <p><small>This link was valid for 1 day.</small></p>
        </div>
      );
    case 'not-found':
      return (
        <div>
          <h1>File Not Found</h1>
          <p>The requested song could not be found.</p>
          <div className="error">
            <p><strong>The song file is missing from our servers.</strong></p>
          </div>
          <p><small>Please contact support if you believe this is an error.</small></p>
        </div>
      );
    default:
      return null;
  }

};

export default PlayPageError;