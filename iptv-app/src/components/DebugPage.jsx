import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CHECKS = [
  {
    id: 'sb_url',
    label: 'Supabase — VITE_SUPABASE_URL',
    group: 'Supabase',
  },
  {
    id: 'sb_key',
    label: 'Supabase — VITE_SUPABASE_ANON_KEY',
    group: 'Supabase',
  },
  {
    id: 'sb_ping',
    label: 'Supabase — חיבור לטבלת favorites',
    group: 'Supabase',
  },
  {
    id: 'api_channels',
    label: 'iptv-org — channels.json נגיש',
    group: 'IPTV API',
  },
  {
    id: 'api_streams',
    label: 'iptv-org — streams.json נגיש',
    group: 'IPTV API',
  },
  {
    id: 'hlsjs',
    label: 'HLS.js — נטען בהצלחה',
    group: 'נגן',
  },
  {
    id: 'localstorage',
    label: 'localStorage — קריאה/כתיבה',
    group: 'דפדפן',
  },
];

async function runCheck(id) {
  const timeout = (ms) =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    );

  switch (id) {
    case 'sb_url': {
      const v = import.meta.env.VITE_SUPABASE_URL;
      if (!v) return { ok: false, msg: 'VITE_SUPABASE_URL לא מוגדר ב-.env' };
      return { ok: true, msg: v };
    }

    case 'sb_key': {
      const v = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!v) return { ok: false, msg: 'VITE_SUPABASE_ANON_KEY לא מוגדר ב-.env' };
      const masked = v.slice(0, 20) + '…';
      return { ok: true, msg: masked };
    }

    case 'sb_ping': {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) return { ok: false, msg: 'חסרים env vars — דלג על בדיקה זו' };
      try {
        const { error } = await Promise.race([
          supabase.from('favorites').select('id').limit(1),
          timeout(6000),
        ]);
        if (error) {
          if (error.code === '42P01')
            return { ok: false, msg: 'טבלת favorites לא קיימת — הרץ את ה-SQL ב-Supabase' };
          if (error.code === 'PGRST301')
            return { ok: true, msg: 'חיבור תקין (RLS חוסם — צפוי כשלא מחובר)' };
          return { ok: false, msg: `שגיאת DB: ${error.message}` };
        }
        return { ok: true, msg: 'חיבור תקין, טבלה קיימת' };
      } catch (e) {
        return { ok: false, msg: e.message === 'timeout' ? 'timeout (6s) — בדוק URL/Key' : e.message };
      }
    }

    case 'api_channels': {
      try {
        const res = await Promise.race([
          fetch('https://iptv-org.github.io/api/channels.json', { method: 'HEAD' }),
          timeout(8000),
        ]);
        if (!res.ok) return { ok: false, msg: `HTTP ${res.status}` };
        const len = res.headers.get('content-length');
        return { ok: true, msg: len ? `${(len / 1024 / 1024).toFixed(1)} MB` : 'נגיש' };
      } catch (e) {
        return { ok: false, msg: e.message === 'timeout' ? 'timeout (8s)' : `רשת: ${e.message}` };
      }
    }

    case 'api_streams': {
      try {
        const res = await Promise.race([
          fetch('https://iptv-org.github.io/api/streams.json', { method: 'HEAD' }),
          timeout(8000),
        ]);
        if (!res.ok) return { ok: false, msg: `HTTP ${res.status}` };
        const len = res.headers.get('content-length');
        return { ok: true, msg: len ? `${(len / 1024 / 1024).toFixed(1)} MB` : 'נגיש' };
      } catch (e) {
        return { ok: false, msg: e.message === 'timeout' ? 'timeout (8s)' : `רשת: ${e.message}` };
      }
    }

    case 'hlsjs': {
      try {
        const { default: Hls } = await Promise.race([
          import('hls.js'),
          timeout(5000),
        ]);
        const supported = Hls.isSupported();
        return {
          ok: true,
          msg: `v${Hls.version} — ${supported ? 'MSE נתמך' : 'MSE לא נתמך (Safari native HLS)'}`,
        };
      } catch (e) {
        return { ok: false, msg: e.message };
      }
    }

    case 'localstorage': {
      try {
        const key = '__diag_test__';
        localStorage.setItem(key, '1');
        const val = localStorage.getItem(key);
        localStorage.removeItem(key);
        if (val !== '1') return { ok: false, msg: 'קריאה החזירה ערך שגוי' };
        return { ok: true, msg: 'קריאה וכתיבה תקינות' };
      } catch (e) {
        return { ok: false, msg: e.message };
      }
    }

    default:
      return { ok: false, msg: 'בדיקה לא ידועה' };
  }
}

// ── Component ──────────────────────────────────────────────
export default function DebugPage() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    setResults({});

    for (const check of CHECKS) {
      setResults((prev) => ({ ...prev, [check.id]: { status: 'loading' } }));
      const result = await runCheck(check.id);
      setResults((prev) => ({ ...prev, [check.id]: { status: 'done', ...result } }));
    }

    setRunning(false);
  }

  useEffect(() => { runAll(); }, []); // eslint-disable-line

  // Group checks
  const groups = [...new Set(CHECKS.map((c) => c.group))];

  const summary = Object.values(results).filter((r) => r.status === 'done');
  const passCount = summary.filter((r) => r.ok).length;
  const failCount = summary.filter((r) => !r.ok).length;

  return (
    <div className="debug-page" dir="rtl">
      <div className="debug-header">
        <div className="debug-brand">
          <span>📺</span>
          <span>IPTV ישראל</span>
          <span className="debug-badge">Diagnostic</span>
        </div>
        <a href="./" className="debug-back">← חזרה לאפליקציה</a>
      </div>

      <div className="debug-content">
        <div className="debug-title-row">
          <h1 className="debug-title">בדיקת מערכת</h1>
          <button className="debug-run-btn" onClick={runAll} disabled={running}>
            {running ? 'בודק...' : '↺ הרץ שוב'}
          </button>
        </div>

        {summary.length > 0 && (
          <div className="debug-summary">
            <span className="debug-sum-pass">✅ {passCount} תקין</span>
            {failCount > 0 && <span className="debug-sum-fail">❌ {failCount} שגיאה</span>}
          </div>
        )}

        {groups.map((group) => (
          <div key={group} className="debug-group">
            <div className="debug-group-label">{group}</div>
            <div className="debug-checks">
              {CHECKS.filter((c) => c.group === group).map((check) => {
                const r = results[check.id];
                return (
                  <div key={check.id} className={`debug-check ${r?.ok === false ? 'fail' : r?.ok ? 'pass' : ''}`}>
                    <div className="debug-check-icon">
                      {!r || r.status === 'loading' ? (
                        <span className="debug-spinner" />
                      ) : r.ok ? '✅' : '❌'}
                    </div>
                    <div className="debug-check-body">
                      <div className="debug-check-label">{check.label}</div>
                      {r?.msg && (
                        <div className={`debug-check-msg ${r.ok ? 'ok' : 'err'}`}>
                          {r.msg}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="debug-env-section">
          <div className="debug-group-label">מידע סביבה</div>
          <div className="debug-env-grid">
            {[
              ['Base URL', import.meta.env.BASE_URL],
              ['Mode',     import.meta.env.MODE],
              ['User Agent', navigator.userAgent.slice(0, 80) + '…'],
            ].map(([k, v]) => (
              <div key={k} className="debug-env-row">
                <span className="debug-env-key">{k}</span>
                <span className="debug-env-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
