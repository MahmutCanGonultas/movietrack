// Film şeridi efekti — sadece çok geniş ekranlarda (1600px+) görünür
const HOLES = Array.from({ length: 50 });

function Strip({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="side-decoration fixed top-0 h-full pointer-events-none overflow-hidden"
      style={{
        [side]: 0,
        width: '18px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        paddingTop: '64px',
        paddingBottom: '64px',
      }}
    >
      {/* Kenar çizgisi */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          [side === 'left' ? 'right' : 'left']: '4px',
          width: '1px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.12) 20%, rgba(139,92,246,0.12) 80%, transparent 100%)',
        }}
      />
      {/* Sprocket delikler */}
      {HOLES.map((_, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: '7px',
            height: '9px',
            borderRadius: '2px',
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.1)',
          }}
        />
      ))}
    </div>
  );
}

export function SideDecorations() {
  return (
    <>
      <Strip side="left" />
      <Strip side="right" />
    </>
  );
}
