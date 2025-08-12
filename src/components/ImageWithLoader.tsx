import React, { useState } from 'react';

type Props = {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholderHeight?: number;
};

export default function ImageWithLoader({ src, alt = '', className, style, placeholderHeight = 180 }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: placeholderHeight, borderRadius: 10, overflow: 'hidden', ...style }}>
      {!loaded && !failed && (
        <div className="overlay" style={{ background: 'rgba(0,0,0,0.18)' }}>
          <div className="spinner" />
        </div>
      )}
      {!failed ? (
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#1a1a2a' }} />
      )}
    </div>
  );
}

