import { useState, useMemo, useCallback } from 'react';
import { useIPTVData } from './hooks/useIPTVData';
import { useFavorites } from './hooks/useFavorites';
import ChannelCard from './components/ChannelCard';
import CategoryTabs from './components/CategoryTabs';
import SearchBar from './components/SearchBar';
import CountryFilter from './components/CountryFilter';
import Player from './components/Player';
import './App.css';

const PAGE_SIZE = 60;

export default function App() {
  const { channels, categories, countries, loading, error, progress } = useIPTVData();
  const { favorites, toggle: toggleFav, isFavorite } = useFavorites();

  const [activeCategory, setActiveCategory] = useState('__all__');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [page, setPage] = useState(1);

  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat);
    setPage(1);
  }, []);

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  const handleCountry = useCallback((c) => {
    setSelectedCountry(c);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let list = channels;

    if (activeCategory === '__fav__') {
      list = list.filter((c) => isFavorite(c.id));
    } else if (activeCategory !== '__all__') {
      list = list.filter((c) => c.categories.includes(activeCategory));
    }

    if (selectedCountry) {
      list = list.filter((c) => c.country === selectedCountry);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    return list;
  }, [channels, activeCategory, selectedCountry, searchQuery, isFavorite]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  if (loading) {
    return (
      <div className="loading-screen" dir="rtl">
        <div className="loading-logo">📺</div>
        <div className="loading-title">טוען ערוצים...</div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-sub">מאחזר נתוני ערוצים מ-IPTV-org</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen" dir="rtl">
        <div className="error-icon">⚠️</div>
        <div className="error-title">שגיאה בטעינת הנתונים</div>
        <div className="error-msg">{error}</div>
        <button className="btn-retry" onClick={() => window.location.reload()}>
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="app" dir="rtl">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">📺</span>
          <span className="brand-name">IPTV ישראל</span>
        </div>
        <div className="header-stats">
          {channels.length.toLocaleString('he-IL')} ערוצים זמינים
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <SearchBar value={searchQuery} onChange={handleSearch} />
        <CountryFilter countries={countries} value={selectedCountry} onChange={handleCountry} />
      </div>

      {/* Category tabs */}
      <CategoryTabs
        categories={categories}
        active={activeCategory}
        onChange={handleCategoryChange}
        favCount={favorites.size}
      />

      {/* Results count */}
      <div className="results-count">
        {filtered.length === 0
          ? 'לא נמצאו ערוצים'
          : `${filtered.length.toLocaleString('he-IL')} ערוצים`}
        {searchQuery && ` עבור "${searchQuery}"`}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div>אין ערוצים התואמים את החיפוש שלך</div>
        </div>
      ) : (
        <>
          <div className="channel-grid">
            {paginated.map((ch) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                isFavorite={isFavorite(ch.id)}
                onToggleFavorite={toggleFav}
                onClick={setSelectedChannel}
              />
            ))}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button className="btn-load-more" onClick={() => setPage((p) => p + 1)}>
                טען עוד ({filtered.length - paginated.length} נותרו)
              </button>
            </div>
          )}
        </>
      )}

      {/* Player modal */}
      {selectedChannel && (
        <Player
          channel={selectedChannel}
          onClose={() => setSelectedChannel(null)}
        />
      )}
    </div>
  );
}
