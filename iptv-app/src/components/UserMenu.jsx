import { useState, useEffect, useRef } from 'react';

export default function UserMenu({ user, onSignOut, onShowFavorites }) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  const initial = user?.email?.[0]?.toUpperCase() || '?';

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button
        className="user-avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="תפריט משתמש"
        aria-haspopup="true"
        aria-expanded={open}
        title={user?.email}
      >
        {initial}
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-email">{user?.email}</div>
          <hr className="user-dropdown-sep" />
          <button
            className="user-dropdown-item"
            role="menuitem"
            onClick={() => { onShowFavorites?.(); setOpen(false); }}
          >
            ★ המועדפים שלי
          </button>
          <button
            className="user-dropdown-item danger"
            role="menuitem"
            onClick={() => { onSignOut(); setOpen(false); }}
          >
            ← התנתק
          </button>
        </div>
      )}
    </div>
  );
}
