export default function ChannelCard({ channel, isFavorite, onToggleFavorite, onClick }) {
  return (
    <div className="channel-card" onClick={() => onClick(channel)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(channel)}>
      <button
        className={`fav-btn ${isFavorite ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}
        aria-label={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
      >
        {isFavorite ? '★' : '☆'}
      </button>

      <div className="channel-logo-wrap">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="channel-logo"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="channel-logo-fallback"
          style={{ display: channel.logo ? 'none' : 'flex' }}
        >
          {channel.name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="channel-info">
        <div className="channel-name">{channel.name}</div>
        <div className="channel-meta">
          {channel.country && <span className="tag">{channel.country}</span>}
          {channel.quality && <span className="tag quality">{channel.quality}</span>}
        </div>
      </div>
    </div>
  );
}
