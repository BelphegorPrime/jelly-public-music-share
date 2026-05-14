import React from 'react';

interface LinkPreviewMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  songData?: {
    name?: string;
    artist?: string;
    album?: string;
    imageUrl?: string;
  };
}

export const LinkPreviewMeta: React.FC<LinkPreviewMetaProps> = ({ 
  title = 'Jelly Public Music Share', 
  description = 'Share music with friends and family', 
  image = '/favicon.svg',
  url = window.location.href,
  type = 'website',
  songData
}) => {
  const finalTitle = songData?.name && songData?.artist 
    ? `${songData.name} by ${songData.artist}` 
    : title;
  
  const finalDescription = songData?.album
    ? `Listen to ${songData.name} from ${songData.album}`
    : description;
  
  const finalImage = songData?.imageUrl || image;

  return (
    <>
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
    </>
  );
};
