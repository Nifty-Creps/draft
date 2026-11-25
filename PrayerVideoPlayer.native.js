import React from 'react';
import { WebView } from 'react-native-webview';

export default function PrayerVideoPlayer({ videoId, startSeconds, autoPlay, title }) {
  const source = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?start=${Math.max(0, Math.floor(startSeconds))}&autoplay=${autoPlay ? 1 : 0}&playsinline=1&rel=0`;

  return (
    <WebView
      source={{ uri: source }}
      style={{ flex: 1, backgroundColor: '#101412' }}
      originWhitelist={['https://*']}
      javaScriptEnabled
      domStorageEnabled
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={!autoPlay}
      bounces={false}
      accessible
      accessibilityLabel={title}
    />
  );
}
