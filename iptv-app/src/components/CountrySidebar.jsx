import { countryFlag, COUNTRY_NAMES_HE } from '../utils/flags';

export default function CountrySidebar({ countries, selected, onChange, open, onToggle }) {
  return (
    <>
      {/* Backdrop on mobile */}
      {open && <div className="sidebar-backdrop" onClick={onToggle} />}

      <aside className={`nf-sidebar ${open ? 'open' : ''}`}>
        <div className="nf-sidebar-header">
          <span>סינון מדינה</span>
          <button className="sidebar-close-btn" onClick={onToggle} aria-label="סגור">✕</button>
        </div>

        <div className="nf-sidebar-list">
          <button
            className={`nf-sidebar-item ${!selected ? 'active' : ''}`}
            onClick={() => onChange('')}
          >
            🌍 כל המדינות
          </button>

          {countries.map(code => (
            <button
              key={code}
              className={`nf-sidebar-item ${selected === code ? 'active' : ''}`}
              onClick={() => { onChange(code); }}
            >
              <span>{countryFlag(code)}</span>
              <span className="sidebar-country-name">
                {COUNTRY_NAMES_HE[code] || code}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
