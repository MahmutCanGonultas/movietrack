import { Component, type ReactNode } from 'react';

interface State {
  failed: boolean;
}

/**
 * Last line of defence: a render error anywhere shows this instead of
 * unmounting the whole tree to a blank page.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[ui] render error:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#030306' }}>
        <div className="max-w-md text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🎬</p>
          <h1 className="text-xl font-black text-white mb-2">Bir şeyler ters gitti</h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Sayfa yüklenirken bir hata oluştu. Birkaç saniye sonra tekrar deneyebilirsin.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
          >
            Sayfayı yenile
          </button>
        </div>
      </div>
    );
  }
}
