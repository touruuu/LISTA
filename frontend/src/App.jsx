import { useEffect, useState } from 'react';
import { authService } from './services/authService.js';
import { clearDemoSession, isDemoCredentials, readDemoSession, writeDemoSession } from './data/demoAccount.js';

const BackIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6M9 12h10" /></svg>;
const ShieldIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.4c0 4.5 3.1 7.6 7.5 9.6 4.4-2 7.5-5.1 7.5-9.6V6L12 3Z" /><path d="m9.2 12 1.8 1.8 3.9-4" /></svg>;
const PeopleIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M18 8a3 3 0 1 1-2-5.2M22 21v-2a4 4 0 0 0-3-3.87" /></svg>;

function Brand() { return <div className="entry-brand" aria-label="LISTA"><span className="entry-brand-mark">L</span><span>LISTA</span></div>; }

function Welcome({ onRole }) {
  return <main className="entry-screen entry-welcome"><div className="entry-content"><Brand /><section className="ledger-preview" aria-label="Example LISTA ledger"><div className="ledger-preview-card"><div className="preview-heading"><strong>Aling Rosa</strong><strong className="preview-total">₱2,450</strong></div><div className="preview-row"><span>3× bigas · Sep 25</span><span>₱1,650</span></div><div className="preview-row"><span>Payment · Sep 24</span><span className="preview-payment">−₱500</span></div></div><p className="preview-note"><ShieldIcon /> Simple, malinaw, laging updated.</p></section><div className="entry-intro"><h1>Utang, mas madaling tandaan.</h1><p>An easy way for sari-sari stores to manage utang and for customers to keep track of what they owe.</p></div></div><div className="role-options" aria-label="Choose how to continue"><button className="role-option owner" type="button" onClick={() => onRole('owner')}><span className="role-icon"><ShieldIcon /></span><span><strong>Continue as Store Owner</strong><small>Manage customers, utang, payments, and records.</small></span><span className="role-arrow">›</span></button><button className="role-option borrower" type="button" onClick={() => onRole('borrower')}><span className="role-icon"><PeopleIcon /></span><span><strong>Continue as Borrower</strong><small>View your linked stores, balances, payments, and receipts.</small></span><span className="role-arrow">›</span></button></div></main>;
}

function EntryHeader({ title, onBack }) { return <header className="entry-header"><button className="entry-back" type="button" onClick={onBack} aria-label="Back"><BackIcon /></button><span>{title}</span></header>; }

function RoleEntry({ role, onBack, onLogin, onCreate }) {
  const owner = role === 'owner';
  return <main className="entry-screen entry-owner-choice"><EntryHeader title={owner ? 'Store Owner' : 'Borrower'} onBack={onBack} /><div className="owner-choice-content"><span className="owner-choice-icon">{owner ? <ShieldIcon /> : <PeopleIcon />}</span><div className="entry-form-heading"><h1>{owner ? 'Manage your store’s LISTA' : 'Access your borrower account'}</h1><p>{owner ? 'Manage customers, utang, payments, and records.' : 'View authorized debts and payments after a store links your account.'}</p></div><div className="entry-actions"><button className="entry-button primary" type="button" onClick={onLogin}>Login</button><button className="entry-button secondary" type="button" onClick={onCreate}>Create Account</button></div></div></main>;
}

function PasswordField({ id, label, value, onChange, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false);
  return <div className="entry-field"><label htmlFor={id}>{label}</label><div className="password-field"><input id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} required minLength={8} /><button type="button" onClick={() => setVisible((shown) => !shown)} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}>{visible ? 'Hide' : 'Show'}</button></div></div>;
}

function Login({ role, onBack, onCreate, onContinue }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const owner = role === 'owner';
  async function submit(event) { event.preventDefault(); setError(''); setBusy(true); try { await onContinue({ email, password }); } catch (reason) { setError(reason.message || 'Login failed.'); setBusy(false); } }
  return <main className="entry-screen entry-form-screen"><EntryHeader title={`${owner ? 'Store Owner' : 'Borrower'} login`} onBack={onBack} /><form className="entry-form" onSubmit={submit}><div className="entry-form-heading"><h1>Login to LISTA</h1><p>Use the email and password for your {owner ? 'store-owner' : 'borrower'} account.</p></div><div className="entry-field"><label htmlFor="login-email">Email</label><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div><PasswordField id="login-password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} />{error && <p className="entry-error" role="alert">{error}</p>}<div className="entry-form-spacer" /><button className="entry-button primary" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button><p className="entry-switch">New to LISTA? <button type="button" onClick={onCreate}>Create Account</button></p></form></main>;
}

function CreateAccount({ role, onBack, onLogin, onContinue }) {
  const [name, setName] = useState(''), [mobile, setMobile] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const owner = role === 'owner';
  async function submit(event) { event.preventDefault(); setError(''); if (password !== confirmation) return setError('Passwords do not match.'); setBusy(true); try { await onContinue({ email, password, displayName: name, mobileNumber: mobile }); } catch (reason) { setError(reason.message || 'Account creation failed.'); setBusy(false); } }
  return <main className="entry-screen entry-form-screen"><EntryHeader title={`Create ${owner ? 'owner' : 'borrower'} account`} onBack={onBack} /><form className="entry-form" onSubmit={submit}><div className="entry-form-heading compact"><h1>Start your LISTA</h1><p>{owner ? 'Create a secure account and initial store.' : 'Create a borrower account that stores can link later.'}</p></div><div className="entry-field"><label htmlFor="account-name">Full name</label><input id="account-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={90} /></div><div className="entry-field"><label htmlFor="account-mobile">Mobile number <span className="muted">(optional)</span></label><input id="account-mobile" type="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} autoComplete="tel" maxLength={30} /></div><div className="entry-field"><label htmlFor="account-email">Email</label><input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div><PasswordField id="account-password" label="Password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoComplete="new-password" /><PasswordField id="account-confirmation" label="Confirm password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(''); }} autoComplete="new-password" /><p className="password-hint"><span aria-hidden="true" /> At least 8 characters</p>{error && <p className="entry-error" role="alert">{error}</p>}<div className="entry-form-spacer" /><button className="entry-button primary" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</button><p className="entry-switch">Already registered? <button type="button" onClick={onLogin}>Login</button></p></form></main>;
}

function CheckEmail({ onBack }) { return <main className="entry-screen entry-form-screen"><EntryHeader title="Confirm your email" onBack={onBack} /><div className="owner-choice-content"><span className="owner-choice-icon"><ShieldIcon /></span><div className="entry-form-heading"><h1>Check your inbox</h1><p>Supabase sent a confirmation link to your email. Confirm it, then return to LISTA and log in.</p></div><button className="entry-button primary" type="button" onClick={onBack}>Return to Login</button></div></main>; }

export function App() {
  const [screen, setScreen] = useState('loading'), [selectedRole, setSelectedRole] = useState(null), [startupError, setStartupError] = useState(null);
  function enterApp(profile) { sessionStorage.setItem('lista-authenticated', 'true'); sessionStorage.setItem('lista-role', profile.role); sessionStorage.setItem('lista-display-name', profile.display_name); window.location.hash = profile.role === 'owner' ? 'home' : 'borrower-home'; setScreen('app'); }
  function enterDemo(portal = 'owner') { const session = writeDemoSession(portal); sessionStorage.setItem('lista-authenticated', 'true'); sessionStorage.setItem('lista-demo-mode', 'true'); sessionStorage.setItem('lista-role', session.portal); sessionStorage.setItem('lista-display-name', session.portal === 'owner' ? "Aling Maria" : 'Juan Dela Cruz'); window.location.hash = session.portal === 'owner' ? 'home' : 'borrower-home'; setScreen('app'); }

  useEffect(() => {
    let active = true;
    const demoSession = readDemoSession();
    if (demoSession) enterDemo(demoSession.portal);
    else if (sessionStorage.getItem('lista-skip-auth-once') === 'true') { sessionStorage.removeItem('lista-skip-auth-once'); setScreen('welcome'); }
    else authService.current().then((context) => { if (!active) return; if (context) enterApp(context.profile); else setScreen('welcome'); }).catch((error) => { if (active) { setStartupError(error); setScreen('welcome'); } });
    const clearLocalSession = () => { sessionStorage.removeItem('lista-authenticated'); sessionStorage.removeItem('lista-demo-mode'); sessionStorage.removeItem('lista-role'); sessionStorage.removeItem('lista-display-name'); };
    const subscription = authService.onChange((event) => { if (event === 'SIGNED_OUT') { clearLocalSession(); setScreen('welcome'); } });
    const handleLogout = async () => { const demo = Boolean(readDemoSession()); try { if (demo) { clearDemoSession(); sessionStorage.setItem('lista-skip-auth-once', 'true'); } else await authService.logout(); } finally { clearLocalSession(); window.location.replace(window.location.pathname + window.location.search); } };
    window.addEventListener('lista:logout', handleLogout);
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener('lista:logout', handleLogout); };
  }, []);

  useEffect(() => { if (screen !== 'app') return undefined; let active = true; import('./listaApp.js').catch((error) => { if (active) setStartupError(error); }); return () => { active = false; }; }, [screen]);
  async function login(credentials) { if (isDemoCredentials(credentials.email, credentials.password)) return enterDemo(selectedRole); const context = await authService.login({ ...credentials, expectedRole: selectedRole }); enterApp(context.profile); }
  async function register(fields) { const result = await authService.register({ ...fields, role: selectedRole }); if (result.requiresEmailConfirmation) return setScreen('check-email'); enterApp(result.profile); }

  if (screen === 'loading') return <main className="entry-screen"><div className="loading">Checking your secure LISTA session…</div></main>;
  if (screen === 'welcome') return <><Welcome onRole={(role) => { setSelectedRole(role); setScreen('role'); }} />{startupError && <p className="auth-config-warning" role="alert">{startupError.message}</p>}</>;
  if (screen === 'role') return <RoleEntry role={selectedRole} onBack={() => setScreen('welcome')} onLogin={() => setScreen('login')} onCreate={() => setScreen('create')} />;
  if (screen === 'login') return <Login role={selectedRole} onBack={() => setScreen('role')} onCreate={() => setScreen('create')} onContinue={login} />;
  if (screen === 'create') return <CreateAccount role={selectedRole} onBack={() => setScreen('role')} onLogin={() => setScreen('login')} onContinue={register} />;
  if (screen === 'check-email') return <CheckEmail onBack={() => setScreen('login')} />;
  return <><a className="skip" href="#main">Skip to content</a><div id="app">{startupError ? <div className="empty" role="alert"><h1>LISTA could not start</h1><p>{startupError.message}</p></div> : <p className="loading">Loading LISTA…</p>}</div><dialog id="dialog" /><div id="toast" role="status" aria-live="polite" /></>;
}
