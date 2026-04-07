import { useRef } from 'react';

export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        ref={inputRef}
        type="search"
        className="search-input"
        placeholder="חיפוש ערוץ..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="חיפוש ערוצים"
        dir="rtl"
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          aria-label="נקה חיפוש"
        >
          ✕
        </button>
      )}
    </div>
  );
}
