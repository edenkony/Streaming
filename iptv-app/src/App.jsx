import { useState, useMemo, useCallback, useEffect } from 'react';
import { useIPTVData } from './hooks/useIPTVData';
import { useFavorites } from './hooks/useFavorites';
import { useAuth } from './hooks/useAuth';
import ChannelCard from './components/ChannelCard';
import CategoryTabs from './components/CategoryTabs';
import SearchBar from './components/SearchBar';
import CountryFilter from './components/CountryFilter';
import Player from './components/Player';
import AuthPage from './components/AuthPage';
import UserMenu from './components/UserMenu';
import DebugPage from './components/DebugPage';
import './App.css';

const PAGE_SIZE = 60;

// Supabase is optional — if env vars are missing, skip auth gate
const SUPABASE_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

// /debug route (works with any base path)
const IS_DEBUG = window.location.pathname.replace(/\/$/, '').endsWith('/debug');

export default function App() {
  // Always render debug page regardless of auth
  if (IS_DEBUG) return <DebugPage />;

  return <MainApp />;
}

function MainApp() {
  const { user, authLoading, signOut } = useAuth();

  const {
    channels, categories, countries,
    initialLoading, categoryLoading, error, progress,
    loadCategory,
  } = useIPTVData();

  const { favorites, toggle: toggleFav, isFavorite, favLoading } = useFavorites(user);

  const [activeCategory,  setActiveCategory]  = useState('__initial__');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [page,            setPage]            = useState(1);

  // Load category data when active category changes
  useEffect(() => {
    if (initialLoading) return;
    loadCategory(activeCategory, [...favorites]);
    setPage(1);
  }, [activeCategory, initialLoading]); // eslint-disable-line

  // Reload favorites tab when favorites list changes
  useEffect(() => {
    if (activeCategory === '__fav__' && !initialLoading) {
      loadCategory('__fav__', [...favorites]);
    }
  }, [favorites]); // eslint-disable-line

  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setSelectedCountry('');
  }, []);

  const handleShowFavorites = useCallback(() => {
    handleCategoryChange('__fav__');
  }, [handleCategoryChange]);

  const filtered = useMemo(() => {
    let list = channels;
    if (selectedCountry) list = list.filter((c) => c.country === selectedCountry);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [channels, selectedCountry, searchQuery]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore   = paginated.length < filtered.length;

  // ── Auth loading (only when Supabase is configured) ──
  if (SUPABASE_CONFIGURED && authLoading) {
    return (
      <div className="loading-screen" dir="rtl">
        <div className="loading-logo">📺</div>
        <div className="loading-title">טוען...</div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: '30%' }} />
        </div>
      </div>
    );
  }

  // ── Auth gate (only when Supabase is configured) ──
  if (SUPABASE_CONFIGURED && !user) return <AuthPage />;

  // ── Data loading ──
  if (initialLoading) {
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
        <button className="btn-retry" onClick={() => window.location.reload()}>נסה שוב</button>
      </div>
    );
  }

  const isInitialTab = activeCategory === '__initial__';

  return (
    <div className="app" dir="rtl">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">📺</span>
          <span className="brand-name">IPTV ישראל</span>
        </div>
        <div className="header-end">
          <div className="header-stats">
            {channels.length.toLocaleString('he-IL')} ערוצים
          </div>
          {/* Show user menu only when Supabase is configured and user is logged in */}
          {SUPABASE_CONFIGURED && user && (
            <UserMenu
              user={user}
              onSignOut={signOut}
              onShowFavorites={handleShowFavorites}
            />
          )}
          <a href="debug" className="debug-link" title="Diagnostic">🔧</a>
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <SearchBar value={searchQuery} onChange={(q) => { setSearchQuery(q); setPage(1); }} />
        <CountryFilter countries={countries} value={selectedCountry} onChange={(c) => { setSelectedCountry(c); setPage(1); }} />
      </div>

      {/* Category tabs */}
      <CategoryTabs
        categories={categories}
        active={activeCategory}
        onChange={handleCategoryChange}
        favCount={favorites.size}
        isInitialTab={isInitialTab}
      />

      {/* Category loading spinner */}
      {(categoryLoading || favLoading) && (
        <div className="category-loading">
          <div className="spinner" />
          <span>טוען ערוצים...</span>
        </div>
      )}

      {/* Results count */}
      {!categoryLoading && (
        <div className="results-count">
          {filtered.length === 0
            ? 'לא נמצאו ערוצים'
            : `${filtered.length.toLocaleString('he-IL')} ערוצים`}
          {searchQuery && ` עבור "${searchQuery}"`}
          {isInitialTab && !searchQuery && !selectedCountry && (
            <span className="results-badge">ספורט + ישראל</span>
          )}
        </div>
      )}

      {/* Grid */}
      {!categoryLoading && (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeCategory === '__fav__' ? '★' : '📭'}
            </div>
            <div>
              {activeCategory === '__fav__'
                ? 'עוד לא הוספת ערוצים למועדפים'
                : 'אין ערוצים התואמים את החיפוש שלך'}
            </div>
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
        )
      )}

      {/* Player */}
      {selectedChannel && (
        <Player channel={selectedChannel} onClose={() => setSelectedChannel(null)} />
      )}
    </div>
  );
}
