import { useState } from 'react';
import { supabase } from '../lib/supabase';

const INVITE_CODE = 'עדן הגבר';

export default function AuthPage() {
  const [mode,     setMode]     = useState('login');   // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [invite,   setInvite]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  function reset() { setError(''); setSuccess(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    reset();

    if (!email.trim() || !password.trim()) {
      setError('יש למלא אימייל וסיסמה.');
      return;
    }

    if (mode === 'register') {
      if (invite.trim() !== INVITE_CODE) {
        setError('קוד הזמנה שגוי.');
        return;
      }
      if (password.length < 6) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccess('ההרשמה הצליחה! בדוק את האימייל שלך לאישור.');
      }
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" dir="rtl">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-brand">
          <span className="auth-brand-icon">📺</span>
          <span className="auth-brand-name">IPTV ישראל</span>
        </div>

        <h1 className="auth-title">
          {mode === 'login' ? 'ברוכים הבאים' : 'צור חשבון'}
        </h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'התחבר כדי לשמור את המועדפים שלך'
            : 'הרשמה מצריכה קוד הזמנה'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">אימייל</label>
            <input
              type="email"
              className="auth-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); reset(); }}
              autoComplete="email"
              dir="ltr"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">סיסמה</label>
            <input
              type="password"
              className="auth-input"
              placeholder={mode === 'register' ? 'לפחות 6 תווים' : '••••••••'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); reset(); }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              dir="ltr"
            />
          </div>

          {/* Invite code (register only) */}
          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-label">קוד הזמנה</label>
              <input
                type="text"
                className="auth-input"
                placeholder="הזן קוד הזמנה"
                value={invite}
                onChange={(e) => { setInvite(e.target.value); reset(); }}
                dir="rtl"
              />
            </div>
          )}

          {/* Error / Success */}
          {error   && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {/* Submit */}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? 'אנא המתן...'
              : mode === 'login' ? 'התחבר' : 'הרשמה'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="auth-toggle">
          {mode === 'login' ? (
            <>
              אין לך חשבון?{' '}
              <button className="auth-toggle-btn" onClick={() => { setMode('register'); reset(); }}>
                הרשמה
              </button>
            </>
          ) : (
            <>
              כבר יש לך חשבון?{' '}
              <button className="auth-toggle-btn" onClick={() => { setMode('login'); reset(); }}>
                התחבר
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function translateError(msg) {
  if (!msg) return 'אירעה שגיאה. נסה שוב.';
  if (msg.includes('Invalid login credentials')) return 'אימייל או סיסמה שגויים.';
  if (msg.includes('Email not confirmed'))       return 'יש לאשר את האימייל תחילה.';
  if (msg.includes('User already registered'))   return 'כתובת אימייל זו כבר רשומה.';
  if (msg.includes('Password should be'))        return 'הסיסמה חייבת להכיל לפחות 6 תווים.';
  if (msg.includes('rate limit'))                return 'יותר מדי ניסיונות. המתן מעט.';
  if (msg.includes('network'))                   return 'בעיית רשת. בדוק את החיבור.';
  return msg;
}
