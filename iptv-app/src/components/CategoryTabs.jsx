export const TABS = [
  { id: 'IL',            label: 'ישראל',   icon: '🇮🇱' },
  { id: 'sports',        label: 'ספורט',   icon: '⚽' },
  { id: 'general',       label: 'כללי',    icon: '📺' },
  { id: 'movies',        label: 'סרטים',   icon: '🎬' },
  { id: 'news',          label: 'חדשות',   icon: '📰' },
  { id: 'music',         label: 'מוזיקה',  icon: '🎵' },
  { id: 'entertainment', label: 'בידור',   icon: '🎭' },
  { id: 'kids',          label: 'ילדים',   icon: '🧸' },
  { id: '__fav__',       label: 'מועדפים', icon: '★'  },
];

export default function CategoryTabs({ active, onChange, favCount }) {
  return (
    <div className="nf-tabs" role="tablist">
      {TABS.map(tab => {
        if (tab.id === '__fav__' && favCount === 0) return null;
        return (
          <button
            key={tab.id}
            role="tab"
            className={`nf-tab ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
            aria-selected={active === tab.id}
          >
            <span className="nf-tab-icon">{tab.icon}</span>
            <span className="nf-tab-label">{tab.label}</span>
            {tab.id === '__fav__' && favCount > 0 && (
              <span className="nf-tab-count">{favCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
