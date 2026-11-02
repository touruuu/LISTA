import { useEffect, useState } from 'react';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6M9 12h10" /></svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.4c0 4.5 3.1 7.6 7.5 9.6 4.4-2 7.5-5.1 7.5-9.6V6L12 3Z" /><path d="m9.2 12 1.8 1.8 3.9-4" /></svg>
);

function Brand() {
  return <div className="entry-brand" aria-label="LISTA"><span className="entry-brand-mark">L</span><span>LISTA</span></div>;
}

function Welcome({ onLogin, onCreate }) {
  return (
    <main className="entry-screen entry-welcome">
      <div className="entry-content">
        <Brand />
        <section className="ledger-preview" aria-label="Example LISTA ledger">
          <div className="ledger-preview-card">
            <div className="preview-heading"><strong>Aling Rosa</strong><strong className="preview-total">₱2,450</strong></div>
            <div className="preview-row"><span>3× bigas · Sep 25</span><span>₱1,650</span></div>
            <div className="preview-row"><span>Payment · Sep 24</span><span className="preview-payment">−₱500</span></div>
          </div>
          <p className="preview-note"><ShieldIcon /> Simple, malinaw, laging updated.</p>
        </section>
        <div className="entry-intro">
          <h1>Utang, mas madaling tandaan.</h1>
          <p>Your simple shared ledger for pautang, bayad, and remaining balances.</p>
        </div>
      </div>
      <div className="entry-actions">
        <button className="entry-button primary" type="button" onClick={onLogin}>Login</button>
        <button className="entry-button secondary" type="button" onClick={onCreate}>Create Account</button>
      </div>
    </main>
  );
}

function EntryHeader({ title, onBack }) {
  return <header className="entry-header"><button className="entry-back" type="button" onClick={onBack} aria-label="Back"><BackIcon /></button><span>{title}</span></header>;
}

function PasswordField({ id, label, value, onChange, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="entry-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required minLength={8} />
        <button type="button" onClick={() => setVisible((shown) => !shown)} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}>{visible ? 'Hide' : 'Show'}</button>
      </div>
    </div>
  );
}

function Login({ onBack, onCreate, onContinue }) {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  return (
    <main className="entry-screen entry-form-screen">
      <EntryHeader title="Welcome back" onBack={onBack} />
      <form className="entry-form" onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
        <div className="entry-form-heading"><h1>Login to LISTA</h1><p>Pick up where you left off. Your records are waiting.</p></div>
        <div className="entry-field"><label htmlFor="login-identity">Email or mobile number</label><input id="login-identity" value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="username" inputMode="email" required /></div>
        <PasswordField id="login-password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="entry-form-spacer" />
        <button className="entry-button primary" type="submit">Login</button>
        <p className="entry-switch">New to LISTA? <button type="button" onClick={onCreate}>Create Account</button></p>
      </form>
    </main>
  );
}

function CreateAccount({ onBack, onLogin, onContinue }) {
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    onContinue();
  }
  return (
    <main className="entry-screen entry-form-screen">
      <EntryHeader title="Create account" onBack={onBack} />
      <form className="entry-form" onSubmit={submit}>
        <div className="entry-form-heading compact"><h1>Start your LISTA</h1><p>Keep your utang records clear in a few minutes.</p></div>
        <div className="entry-field"><label htmlFor="account-name">Full name</label><input id="account-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></div>
        <div className="entry-field"><label htmlFor="account-identity">Email or mobile number</label><input id="account-identity" value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="username" required /></div>
        <PasswordField id="account-password" label="Password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoComplete="new-password" />
        <PasswordField id="account-confirmation" label="Confirm password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(''); }} autoComplete="new-password" />
        <p className="password-hint"><span aria-hidden="true" /> At least 8 characters</p>
        {error && <p className="entry-error" role="alert">{error}</p>}
        <div className="entry-form-spacer" />
        <button className="entry-button primary" type="submit">Create Account</button>
        <p className="entry-switch">Already have an account? <button type="button" onClick={onLogin}>Login</button></p>
      </form>
    </main>
  );
}

export function App() {
  const [screen, setScreen] = useState('welcome');
  const [startupError, setStartupError] = useState(null);
  useEffect(() => {
    if (screen !== 'app') return undefined;
    let active = true;
    import('./listaApp.js').catch((error) => { if (active) setStartupError(error); });
    return () => { active = false; };
  }, [screen]);
  if (screen === 'welcome') return <Welcome onLogin={() => setScreen('login')} onCreate={() => setScreen('create')} />;
  if (screen === 'login') return <Login onBack={() => setScreen('welcome')} onCreate={() => setScreen('create')} onContinue={() => setScreen('app')} />;
  if (screen === 'create') return <CreateAccount onBack={() => setScreen('welcome')} onLogin={() => setScreen('login')} onContinue={() => setScreen('app')} />;
  return <><a className="skip" href="#main">Skip to content</a><div id="app">{startupError ? <div className="empty" role="alert"><h1>LISTA could not start</h1><p>{startupError.message}</p></div> : <p className="loading">Loading shared ledger…</p>}</div><dialog id="dialog" /><div id="toast" role="status" aria-live="polite" /></>;
}
