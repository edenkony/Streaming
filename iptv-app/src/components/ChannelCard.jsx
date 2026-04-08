import { countryFlag } from '../utils/flags';

export default function ChannelCard({ channel, isFavorite, onToggleFavorite, onClick }) {
  const flag = countryFlag(channel.country);

  return (
    <div
      className="nf-card"
      onClick={() => onClick(channel)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(channel)}
    >
      {/* Thumbnail */}
      <div className="nf-card-thumb">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            loading="lazy"
            className="nf-card-logo"
            onError={e => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="nf-card-fallback"
          style={{ display: channel.logo ? 'none' : 'flex' }}
        >
          {channel.name.charAt(0).toUpperCase()}
        </div>

        {/* Fav button */}
        <button
          className={`nf-fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleFavorite(channel.id); }}
          aria-label={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          {isFavorite ? '★' : '☆'}
        </button>

        {/* Quality badge */}
        {channel.quality && (
          <span className="nf-quality-badge">{channel.quality}</span>
        )}

        {/* Hover overlay */}
        <div className="nf-card-overlay">
          <span className="nf-play-icon">▶</span>
        </div>
      </div>

      {/* Info */}
      <div className="nf-card-info">
        <div className="nf-card-name">{channel.name}</div>
        {(flag || channel.country) && (
          <div className="nf-card-meta">
            {flag && <span>{flag}</span>}
            {channel.country && <span className="nf-country-code">{channel.country}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
