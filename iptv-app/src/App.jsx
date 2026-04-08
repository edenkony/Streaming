import { useState, useMemo, useCallback, useEffect } from 'react';
import { useIPTVData } from './hooks/useIPTVData';
import { useFavorites } from './hooks/useFavorites';
import { useAuth } from './hooks/useAuth';
import ChannelCard from './components/ChannelCard';
import ChannelRow from './components/ChannelRow';
import CategoryTabs, { TABS } from './components/CategoryTabs';
import CountrySidebar from './components/CountrySidebar';
import Player from './components/Player';
import AuthPage from './components/AuthPage';
import UserMenu from './components/UserMenu';
import DebugPage from './components/DebugPage';
import './App.css';

const PAGE_SIZE = 50;

const SUPABASE_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

const IS_DEBUG = window.location.pathname.replace(/\/$/, '').endsWith('/debug');

// Category → row title map for Israel home view
const IL_ROW_TITLES = {
  sports:        'ספורט',
  news:          'חדשות',
  entertainment: 'בידור',
  music:         'מוזיקה',
  general:       'כללי',
  movies:        'סרטים',
  kids:          'ילדים',
  documentary:   'תיעודי',
  business:      'עסקים',
};

export default function App() {
  if (IS_DEBUG) return <DebugPage />;
  return <MainApp />;
}

function MainApp() {
  const { user, authLoading, signOut } = useAuth();
  const { allChannels, categories, countries, loading, error, progress } = useIPTVData();
  const { favorites, toggle: toggleFav, isFavorite } = useFavorites(user);

  const [activeTab,       setActiveTab]       = useState('IL');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [page,            setPage]            = useState(1);

  // Reset page on tab/search/country change
  useEffect(() => { setPage(1); }, [activeTab, searchQuery, selectedCountry]);

  const handleTabChange = useCallback(tab => {
    setActiveTab(tab);
    setSearchQuery('');
    setSelectedCountry('');
    setSidebarOpen(false);
  }, []);

  // ── Filtered channels for current tab ──
  const tabChannels = useMemo(() => {
    let list = allChannels;

    if (activeTab === '__fav__') {
      list = list.filter(c => isFavorite(c.id));
    } else if (activeTab === 'IL') {
      list = list.filter(c => c.country === 'IL');
    } else {
      // category tab
      list = list.filter(c => c.categories.includes(activeTab));
    }

    if (selectedCountry) list = list.filter(c => c.country === selectedCountry);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }

    return list;
  }, [allChannels, activeTab, selectedCountry, searchQuery, isFavorite]);

  // ── Israel home rows (Netflix style) ──
  const ilRows = useMemo(() => {
    if (activeTab !== 'IL' || searchQuery.trim() || selectedCountry) return null;
    const ilChannels = allChannels.filter(c => c.country === 'IL');

    return Object.entries(IL_ROW_TITLES)
      .map(([catId, title]) => ({
        catId,
        title,
        channels: ilChannels.filter(c => c.categories.includes(catId)),
      }))
      .filter(row => row.channels.length > 0);
  }, [activeTab, allChannels, searchQuery, selectedCountry]);

  // ── Grid pagination ──
  const paginated = useMemo(
    () => tabChannels.slice(0, page * PAGE_SIZE),
    [tabChannels, page]
  );
  const hasMore = paginated.length < tabChannels.length;

  // ── Auth loading ──
  if (SUPABASE_CONFIGURED && authLoading) return <Loader progress={30} />;
  if (SUPABASE_CONFIGURED && !user) return <AuthPage />;
  if (loading) return <Loader progress={progress} />;

  if (error) {
    return (
      <div className="nf-error" dir="rtl">
        <div className="nf-error-icon">⚠️</div>
        <div className="nf-error-title">שגיאה בטעינת הנתונים</div>
        <div className="nf-error-msg">{error}</div>
        <button className="nf-btn-primary" onClick={() => window.location.reload()}>נסה שוב</button>
      </div>
    );
  }

  const isILHome = activeTab === 'IL' && !searchQuery.trim() && !selectedCountry;

  return (
    <div className="nf-app" dir="rtl">

      {/* ── Header ── */}
      <header className="nf-header">
        <div className="nf-header-start">
          <span className="nf-logo">📺 IPTV</span>
          <button
            className="nf-sidebar-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="סינון מדינות"
            title="סינון לפי מדינה"
          >
            🌍
          </button>
        </div>

        <div className="nf-search-wrap">
          <span className="nf-search-icon">🔍</span>
          <input
            type="search"
            className="nf-search"
            placeholder="חיפוש ערוץ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            dir="rtl"
            aria-label="חיפוש"
          />
          {searchQuery && (
            <button className="nf-search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="nf-header-end">
          <span className="nf-channel-count">{allChannels.length.toLocaleString('he-IL')} ערוצים</span>
          {SUPABASE_CONFIGURED && user && (
            <UserMenu user={user} onSignOut={signOut} onShowFavorites={() => handleTabChange('__fav__')} />
          )}
          <a href="debug" className="nf-debug-link" title="Diagnostic">🔧</a>
        </div>
      </header>

      {/* ── Tabs ── */}
      <CategoryTabs active={activeTab} onChange={handleTabChange} favCount={favorites.size} />

      {/* ── Body ── */}
      <div className="nf-body">

        {/* Country sidebar */}
        <CountrySidebar
          countries={countries}
          selected={selectedCountry}
          onChange={c => { setSelectedCountry(c); setSidebarOpen(false); }}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
        />

        {/* Main content */}
        <main className="nf-main">

          {/* Israel home — Netflix rows */}
          {isILHome && ilRows && (
            <div className="nf-rows-container">
              {ilRows.map(row => (
                <ChannelRow
                  key={row.catId}
                  title={row.title}
                  channels={row.channels}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFav}
                  onClick={setSelectedChannel}
                />
              ))}
            </div>
          )}

          {/* Grid view — all other tabs or when searching */}
          {(!isILHome || searchQuery.trim() || selectedCountry) && (
            <>
              <div className="nf-grid-header">
                <span className="nf-grid-count">
                  {tabChannels.length === 0
                    ? 'לא נמצאו ערוצים'
                    : `${tabChannels.length.toLocaleString('he-IL')} ערוצים`}
                  {searchQuery && ` עבור "${searchQuery}"`}
                </span>
              </div>

              {tabChannels.length === 0 ? (
                <div className="nf-empty">
                  <div className="nf-empty-icon">{activeTab === '__fav__' ? '★' : '📭'}</div>
                  <div>
                    {activeTab === '__fav__'
                      ? 'עוד לא הוספת ערוצים למועדפים'
                      : 'אין ערוצים התואמים את החיפוש'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="nf-grid">
                    {paginated.map(ch => (
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
                    <div className="nf-load-more">
                      <button className="nf-btn-outline" onClick={() => setPage(p => p + 1)}>
                        טען עוד ({tabChannels.length - paginated.length} נותרו)
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Player */}
      {selectedChannel && (
        <Player channel={selectedChannel} onClose={() => setSelectedChannel(null)} />
      )}
    </div>
  );
}

function Loader({ progress }) {
  return (
    <div className="nf-loader" dir="rtl">
      <div className="nf-loader-logo">📺</div>
      <div className="nf-loader-title">
        {progress < 40 ? 'טוען...' : 'מעבד ערוצים...'}
      </div>
      <div className="nf-progress-wrap">
        <div className="nf-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
