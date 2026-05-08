import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { authClient } from '@/lib/auth-client';
import { AvatarDisplay } from '@/components/AvatarDisplay';

export function Navbar() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  async function handleLogout() {
    await authClient.signOut();
    setUser(null);
    navigate('/login');
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue('');
    }
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top accent line — ultra thin LED strip */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.7) 25%, rgba(245,200,66,0.4) 60%, rgba(139,92,246,0.3) 85%, transparent 100%)',
        }}
      />

      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: 'rgba(5,5,8,0.88)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
        }}
      >
        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.5) 25%, rgba(245,200,66,0.25) 70%, transparent 100%)' }}
        />

        <div className="max-w-screen-2xl mx-auto px-5 h-full flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0"
              style={{
                background: 'linear-gradient(145deg, #1a0d2e 0%, #0d0d16 100%)',
                boxShadow: '0 0 18px rgba(139,92,246,0.35), 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(139,92,246,0.2)',
                border: '1px solid rgba(139,92,246,0.3)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(139,92,246,0.6), 0 0 50px rgba(139,92,246,0.15), 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(139,92,246,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 18px rgba(139,92,246,0.35), 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(139,92,246,0.2)';
              }}
            >
              {/* Film strip icon */}
              <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                {/* Top holes */}
                <rect x="0.5" y="0.5" width="3" height="2.5" rx="0.8" fill="#8b5cf6"/>
                <rect x="7.5" y="0.5" width="3" height="2.5" rx="0.8" fill="#8b5cf6"/>
                <rect x="14.5" y="0.5" width="3" height="2.5" rx="0.8" fill="#8b5cf6"/>
                {/* Bottom holes */}
                <rect x="0.5" y="13" width="3" height="2.5" rx="0.8" fill="#8b5cf6"/>
                <rect x="7.5" y="13" width="3" height="2.5" rx="0.8" fill="#8b5cf6"/>
                <rect x="14.5" y="13" width="3" height="2.5" rx="0.8" fill="#8b5cf6"/>
                {/* Play triangle */}
                <path d="M5 4.5 L14 8 L5 11.5 Z" fill="white"/>
              </svg>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-black text-[13px] tracking-wide text-white">Movie</span>
              <span className="font-black text-[13px] tracking-wide" style={{ color: '#8b5cf6' }}>Track</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={isActive('/')}>Keşfet</NavLink>
            {user && <NavLink to="/profile" active={isActive('/profile')}>Listem</NavLink>}
            {/* AI badge */}
            <div
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ml-1"
              style={{
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.28)',
                color: '#8b5cf6',
              }}
            >
              <div className="ai-ring" />
              <span className="w-1.5 h-1.5 rounded-full glow-pulse shrink-0" style={{ background: '#8b5cf6' }} />
              AI
            </div>
          </div>

          {/* Right: search + auth */}
          <div className="flex items-center gap-2.5">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    boxShadow: '0 0 20px rgba(139,92,246,0.12)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    autoFocus
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onBlur={() => { if (!searchValue) setSearchOpen(false); }}
                    placeholder="Film, dizi ara..."
                    className="w-40 sm:w-56 text-sm text-white bg-transparent outline-none placeholder-zinc-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchValue(''); }}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <span className="hidden sm:block text-xs font-medium">Ara</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.16)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.38)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(139,92,246,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.22)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <AvatarDisplay name={user.name} image={user.image} size={20} />
                  <span className="hidden sm:block text-xs font-semibold" style={{ color: '#9d6ff8' }}>
                    {user.name.split(' ')[0]}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-xs text-zinc-700 hover:text-zinc-400 transition-colors px-2 py-1.5"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  Giriş
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold px-4 py-1.5 rounded-xl text-white transition-all btn-glow"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="relative text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-xl transition-all duration-200"
      style={{
        color: active ? '#fff' : '#52525b',
        background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
        border: active ? '1px solid rgba(139,92,246,0.28)' : '1px solid transparent',
        letterSpacing: '0.08em',
      }}
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ background: '#8b5cf6', boxShadow: '0 0 6px rgba(139,92,246,0.8)' }}
        />
      )}
    </Link>
  );
}
