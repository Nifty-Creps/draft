import React from 'react';

export default function PrayerVideoPlayer({ videoId, startSeconds, autoPlay, title }) {
  const source = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?start=${Math.max(0, Math.floor(startSeconds))}&autoplay=${autoPlay ? 1 : 0}&playsinline=1&rel=0`;

  return React.createElement('iframe', {
    title,
    src: source,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullScreen: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    style: { display: 'block', width: '100%', height: '100%', border: 0 },
  });
}
