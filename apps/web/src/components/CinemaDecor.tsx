/* Fixed cinema-themed background decorations — purely visual, pointer-events none */
export function CinemaDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden>

      {/* ── Film reel — bottom right ── */}
      <svg
        width="480"
        height="480"
        viewBox="0 0 480 480"
        fill="none"
        style={{ position: 'absolute', bottom: '-110px', right: '-90px', opacity: 0.038 }}
      >
        {/* Outer ring */}
        <circle cx="240" cy="240" r="228" stroke="#8b5cf6" strokeWidth="1.5" />
        {/* Mid ring */}
        <circle cx="240" cy="240" r="160" stroke="#8b5cf6" strokeWidth="1" />
        {/* Inner hub ring */}
        <circle cx="240" cy="240" r="72" stroke="#8b5cf6" strokeWidth="1.5" />
        {/* Center axle */}
        <circle cx="240" cy="240" r="22" stroke="#8b5cf6" strokeWidth="1.5" />
        {/* Spokes × 6 */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const r = Math.PI / 180;
          return (
            <line
              key={deg}
              x1={240 + 72 * Math.cos(deg * r)}
              y1={240 + 72 * Math.sin(deg * r)}
              x2={240 + 228 * Math.cos(deg * r)}
              y2={240 + 228 * Math.sin(deg * r)}
              stroke="#8b5cf6"
              strokeWidth="1"
            />
          );
        })}
        {/* Sprocket holes × 16 on perimeter */}
        {Array.from({ length: 16 }, (_, i) => {
          const deg = (i * 360) / 16;
          const r = Math.PI / 180;
          return (
            <circle
              key={i}
              cx={240 + 193 * Math.cos(deg * r)}
              cy={240 + 193 * Math.sin(deg * r)}
              r="14"
              stroke="#8b5cf6"
              strokeWidth="1.5"
            />
          );
        })}
        {/* Film frames × 6 inner sections */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const mid = deg + 30;
          const r = Math.PI / 180;
          const cx = 240 + 116 * Math.cos(mid * r);
          const cy = 240 + 116 * Math.sin(mid * r);
          return <circle key={`f${deg}`} cx={cx} cy={cy} r="26" stroke="#f5c842" strokeWidth="1" opacity="0.5" />;
        })}
      </svg>

      {/* ── Film strip — top left, vertical ── */}
      <svg
        width="38"
        height="420"
        viewBox="0 0 38 420"
        fill="none"
        style={{ position: 'absolute', top: '90px', left: '0', opacity: 0.04 }}
      >
        <rect x="1" y="0" width="36" height="420" rx="3" stroke="#8b5cf6" strokeWidth="1" />
        {/* Sprocket holes left column */}
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x="5" y={8 + i * 30} width="10" height="16" rx="2" stroke="#8b5cf6" strokeWidth="1" />
        ))}
        {/* Frames */}
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x="18" y={14 + i * 68} width="18" height="50" rx="2" stroke="#8b5cf6" strokeWidth="0.75" />
        ))}
      </svg>

      {/* ── Film strip — bottom center-right, horizontal ── */}
      <svg
        width="500"
        height="36"
        viewBox="0 0 500 36"
        fill="none"
        style={{ position: 'absolute', bottom: '60px', right: '120px', opacity: 0.035 }}
      >
        <rect x="0" y="1" width="500" height="34" rx="3" stroke="#8b5cf6" strokeWidth="1" />
        {/* Sprocket holes top */}
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={`t${i}`} x={8 + i * 31} y="4" width="18" height="10" rx="2" stroke="#8b5cf6" strokeWidth="1" />
        ))}
        {/* Sprocket holes bottom */}
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={`b${i}`} x={8 + i * 31} y="22" width="18" height="10" rx="2" stroke="#8b5cf6" strokeWidth="1" />
        ))}
      </svg>

      {/* ── Scattered gold stars ── */}
      {[
        { x: '8%',  y: '18%', size: 18, rot: 12,  op: 0.06 },
        { x: '92%', y: '12%', size: 14, rot: -8,  op: 0.05 },
        { x: '78%', y: '42%', size: 22, rot: 20,  op: 0.04 },
        { x: '4%',  y: '65%', size: 16, rot: -15, op: 0.05 },
        { x: '55%', y: '88%', size: 12, rot: 5,   op: 0.04 },
        { x: '88%', y: '78%', size: 20, rot: -20, op: 0.04 },
        { x: '22%', y: '92%', size: 14, rot: 10,  op: 0.04 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            fontSize: `${s.size}px`,
            color: '#f5c842',
            opacity: s.op,
            transform: `rotate(${s.rot}deg)`,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          ★
        </div>
      ))}

      {/* ── Play button — faint top-right watermark ── */}
      <svg
        width="160"
        height="160"
        viewBox="0 0 100 100"
        fill="none"
        style={{ position: 'absolute', top: '15%', right: '3%', opacity: 0.022 }}
      >
        <circle cx="50" cy="50" r="46" stroke="#8b5cf6" strokeWidth="2" />
        <polygon points="36,26 36,74 74,50" fill="#8b5cf6" />
      </svg>

      {/* ── Clapperboard lines — subtle top-left ── */}
      <svg
        width="120"
        height="90"
        viewBox="0 0 120 90"
        fill="none"
        style={{ position: 'absolute', top: '22%', left: '2%', opacity: 0.03 }}
      >
        {/* Board body */}
        <rect x="2" y="22" width="116" height="66" rx="4" stroke="#8b5cf6" strokeWidth="1.5" />
        {/* Clapper top */}
        <rect x="2" y="2" width="116" height="18" rx="3" stroke="#8b5cf6" strokeWidth="1.5" />
        {/* Clapper stripes */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={18 + i * 18} y1="2" x2={10 + i * 18} y2="20" stroke="#8b5cf6" strokeWidth="2.5" />
        ))}
        {/* Text lines */}
        <line x1="12" y1="38" x2="108" y2="38" stroke="#8b5cf6" strokeWidth="1" opacity="0.7" />
        <line x1="12" y1="52" x2="80"  y2="52" stroke="#8b5cf6" strokeWidth="1" opacity="0.5" />
        <line x1="12" y1="66" x2="90"  y2="66" stroke="#8b5cf6" strokeWidth="1" opacity="0.5" />
      </svg>

    </div>
  );
}
