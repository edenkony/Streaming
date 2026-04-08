import { useRef } from 'react';
import ChannelCard from './ChannelCard';

export default function ChannelRow({ title, channels, isFavorite, onToggleFavorite, onClick }) {
  const trackRef = useRef(null);

  function scroll(dir) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  if (!channels.length) return null;

  return (
    <section className="nf-row">
      <h2 className="nf-row-title">{title}</h2>
      <div className="nf-row-wrap">
        <button className="nf-row-arrow nf-row-arrow-right" onClick={() => scroll(-1)} aria-label="גלול ימינה">‹</button>
        <div className="nf-row-track" ref={trackRef}>
          {channels.map(ch => (
            <div key={ch.id} className="nf-row-item">
              <ChannelCard
                channel={ch}
                isFavorite={isFavorite(ch.id)}
                onToggleFavorite={onToggleFavorite}
                onClick={onClick}
              />
            </div>
          ))}
        </div>
        <button className="nf-row-arrow nf-row-arrow-left" onClick={() => scroll(1)} aria-label="גלול שמאלה">›</button>
      </div>
    </section>
  );
}
