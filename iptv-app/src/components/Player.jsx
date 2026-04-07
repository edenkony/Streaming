import { useEffect, useRef, useState, useCallback } from 'react';

// Lazy-load HLS.js to keep initial bundle small
let HlsModule = null;
async function getHls() {
  if (!HlsModule) {
    const mod = await import('hls.js');
    HlsModule = mod.default;
  }
  return HlsModule;
}

export default function Player({ channel, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [streamIndex, setStreamIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const containerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const [showControls, setShowControls] = useState(true);

  const streams = channel?.streams || [];
  const currentUrl = streams[streamIndex];

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const loadStream = useCallback(
    async (url) => {
      if (!videoRef.current || !url) return;
      setError(null);
      destroyHls();

      const video = videoRef.current;
      const Hls = await getHls();

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            tryNextStream();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => video.play().catch(() => {}));
      } else {
        setError('הדפדפן שלך לא תומך בהפעלת HLS.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [destroyHls]
  );

  const tryNextStream = useCallback(() => {
    setStreamIndex((prev) => {
      const next = prev + 1;
      if (next >= streams.length) {
        setError('כל הסטרימים נכשלו. אין זרם זמין כרגע.');
        return prev;
      }
      return next;
    });
  }, [streams.length]);

  useEffect(() => {
    if (currentUrl) loadStream(currentUrl);
    return destroyHls;
  }, [currentUrl, loadStream, destroyHls]);

  useEffect(() => {
    const handleFull = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFull);
    return () => document.removeEventListener('fullscreenchange', handleFull);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    setMuted(next);
    video.muted = next;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'f') toggleFullscreen();
      if (e.key === ' ') handleVideoClick();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!channel) return null;

  return (
    <div className="player-overlay" role="dialog" aria-modal="true">
      <div
        ref={containerRef}
        className={`player-container ${isFullscreen ? 'fullscreen' : ''}`}
        onMouseMove={showControlsTemporarily}
      >
        {/* Header */}
        <div className={`player-header ${showControls ? 'visible' : ''}`}>
          <button className="player-close" onClick={onClose} aria-label="סגור נגן">
            ✕
          </button>
          <div className="player-channel-info">
            {channel.logo && (
              <img
                src={channel.logo}
                alt={channel.name}
                className="player-logo"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <div>
              <div className="player-channel-name">{channel.name}</div>
              {channel.country && (
                <div className="player-channel-meta">
                  {channel.country}
                  {channel.quality && ` · ${channel.quality}`}
                  {streams.length > 1 && ` · סטרים ${streamIndex + 1}/${streams.length}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video */}
        <video
          ref={videoRef}
          className="player-video"
          onClick={handleVideoClick}
          playsInline
          crossOrigin="anonymous"
        />

        {/* Error */}
        {error && (
          <div className="player-error">
            <div className="player-error-icon">⚠️</div>
            <div>{error}</div>
            {streamIndex < streams.length - 1 && (
              <button onClick={tryNextStream} className="btn-retry">
                נסה סטרים הבא
              </button>
            )}
          </div>
        )}

        {/* Paused overlay */}
        {paused && !error && (
          <div className="player-paused-icon" onClick={handleVideoClick}>▶</div>
        )}

        {/* Bottom controls */}
        <div className={`player-controls ${showControls ? 'visible' : ''}`}>
          <button
            className="ctrl-btn"
            onClick={handleVideoClick}
            aria-label={paused ? 'נגן' : 'השהה'}
          >
            {paused ? '▶' : '⏸'}
          </button>

          <button className="ctrl-btn" onClick={toggleMute} aria-label="השתק">
            {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            aria-label="עוצמת קול"
          />

          <span className="ctrl-spacer" />

          {streams.length > 1 && (
            <button className="ctrl-btn" onClick={tryNextStream} title="סטרים הבא">
              ⏭
            </button>
          )}

          <button className="ctrl-btn" onClick={toggleFullscreen} aria-label="מסך מלא">
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </div>
    </div>
  );
}
