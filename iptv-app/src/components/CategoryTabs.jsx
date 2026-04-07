const CATEGORY_ICONS = {
  news: '📰',
  sports: '⚽',
  movies: '🎬',
  entertainment: '🎭',
  music: '🎵',
  kids: '🧸',
  documentary: '🎥',
  cooking: '🍳',
  travel: '✈️',
  auto: '🚗',
  science: '🔬',
  legislative: '🏛️',
  religious: '⛪',
  shop: '🛍️',
  weather: '🌤️',
  education: '📚',
  business: '💼',
  general: '📺',
};

const CATEGORY_NAMES_HE = {
  news: 'חדשות',
  sports: 'ספורט',
  movies: 'סרטים',
  entertainment: 'בידור',
  music: 'מוזיקה',
  kids: 'ילדים',
  documentary: 'תיעודי',
  cooking: 'בישול',
  travel: 'טיול',
  auto: 'רכב',
  science: 'מדע',
  legislative: 'פרלמנט',
  religious: 'דת',
  shop: 'קניות',
  weather: 'מזג אוויר',
  education: 'חינוך',
  business: 'עסקים',
  general: 'כללי',
};

export default function CategoryTabs({ categories, active, onChange, favCount }) {
  return (
    <div className="category-tabs" role="tablist">
      <button
        role="tab"
        className={`cat-tab ${active === '__all__' ? 'active' : ''}`}
        onClick={() => onChange('__all__')}
        aria-selected={active === '__all__'}
      >
        📺 הכל
      </button>
      {favCount > 0 && (
        <button
          role="tab"
          className={`cat-tab ${active === '__fav__' ? 'active' : ''}`}
          onClick={() => onChange('__fav__')}
          aria-selected={active === '__fav__'}
        >
          ★ מועדפים ({favCount})
        </button>
      )}
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          className={`cat-tab ${active === cat.id ? 'active' : ''}`}
          onClick={() => onChange(cat.id)}
          aria-selected={active === cat.id}
        >
          {CATEGORY_ICONS[cat.id] || '📺'}{' '}
          {CATEGORY_NAMES_HE[cat.id] || cat.name}
        </button>
      ))}
    </div>
  );
}
