import { useEffect, useRef } from 'react';
import { getAvatarGradient } from '@/lib/avatarPresets';

interface Props {
  name: string;
  image: string | null | undefined;
  stats: {
    movies: number;
    shows: number;
    watchHours: number;
    avgRating: string | null;
  };
  topGenres: { name: string; count: number }[];
  badges: number;
  onClose: () => void;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ProfileShareCard({ name, image, stats, topGenres, badges, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { from: avatarFrom, to: avatarTo } = getAvatarGradient(image);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 1080, H = 1350; // 4:5 portrait ratio — ideal for Instagram
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── BACKGROUND ──────────────────────────────────────
    ctx.fillStyle = '#060010';
    ctx.fillRect(0, 0, W, H);

    // Avatar-colored top glow
    const topG = ctx.createRadialGradient(W / 2, -80, 0, W / 2, -80, W * 0.8);
    topG.addColorStop(0, avatarFrom + 'AA');
    topG.addColorStop(0.5, avatarFrom + '33');
    topG.addColorStop(1, 'transparent');
    ctx.fillStyle = topG;
    ctx.fillRect(0, 0, W, H);

    // Subtle right glow
    const rightG = ctx.createRadialGradient(W, H * 0.6, 0, W, H * 0.6, W * 0.6);
    rightG.addColorStop(0, avatarTo + '22');
    rightG.addColorStop(1, 'transparent');
    ctx.fillStyle = rightG;
    ctx.fillRect(0, 0, W, H);

    // Bottom dark fade
    const botG = ctx.createLinearGradient(0, H * 0.75, 0, H);
    botG.addColorStop(0, 'transparent');
    botG.addColorStop(1, 'rgba(0,0,20,0.7)');
    ctx.fillStyle = botG;
    ctx.fillRect(0, 0, W, H);

    // ── FILM STRIP TOP ───────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, W, 54);

    for (let i = 0; i < 14; i++) {
      const x = 28 + i * (W - 56) / 13;
      ctx.fillStyle = '#060010';
      rr(ctx, x - 13, 10, 26, 34, 5);
      ctx.fill();
    }

    // ── FILM STRIP BOTTOM ────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, H - 54, W, 54);

    for (let i = 0; i < 14; i++) {
      const x = 28 + i * (W - 56) / 13;
      ctx.fillStyle = '#060010';
      rr(ctx, x - 13, H - 44, 26, 34, 5);
      ctx.fill();
    }

    // ── HEADER ───────────────────────────────────────────
    ctx.fillStyle = avatarFrom + '22';
    rr(ctx, 40, 72, W - 80, 68, 16);
    ctx.fill();
    ctx.strokeStyle = avatarFrom + '44';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = avatarTo;
    ctx.fillText('▶ MOVIE', 72, 106);
    const mW = ctx.measureText('▶ MOVIE ').width;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TRACK', 72 + mW, 106);

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '24px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().getFullYear().toString(), W - 72, 106);

    // ── AVATAR ───────────────────────────────────────────
    const ax = W / 2, ay = 300, ar = 100;

    // Outer glow ring
    const glowG = ctx.createRadialGradient(ax, ay, ar * 0.8, ax, ay, ar * 1.5);
    glowG.addColorStop(0, avatarFrom + '55');
    glowG.addColorStop(1, 'transparent');
    ctx.fillStyle = glowG;
    ctx.beginPath();
    ctx.arc(ax, ay, ar * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Ring
    ctx.beginPath();
    ctx.arc(ax, ay, ar + 6, 0, Math.PI * 2);
    ctx.strokeStyle = avatarFrom + '66';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Avatar fill
    const aG = ctx.createRadialGradient(ax - 30, ay - 30, 0, ax, ay, ar);
    aG.addColorStop(0, avatarTo);
    aG.addColorStop(1, avatarFrom);
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.fillStyle = aG;
    ctx.fill();

    // Initial letter
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.font = `bold ${ar}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((name[0] ?? '?').toUpperCase(), ax, ay + 6);

    // ── NAME ─────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(name, W / 2, 472);

    // Underline accent
    const nameW = ctx.measureText(name).width;
    const uG = ctx.createLinearGradient(W / 2 - nameW / 2, 0, W / 2 + nameW / 2, 0);
    uG.addColorStop(0, 'transparent');
    uG.addColorStop(0.5, avatarFrom);
    uG.addColorStop(1, 'transparent');
    ctx.strokeStyle = uG;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameW / 2, 480);
    ctx.lineTo(W / 2 + nameW / 2, 480);
    ctx.stroke();

    ctx.fillStyle = '#52525b';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText('Film & Dizi Takip', W / 2, 518);

    // ── DIVIDER ──────────────────────────────────────────
    const divG = ctx.createLinearGradient(60, 0, W - 60, 0);
    divG.addColorStop(0, 'transparent');
    divG.addColorStop(0.5, avatarFrom + '55');
    divG.addColorStop(1, 'transparent');
    ctx.strokeStyle = divG;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 548);
    ctx.lineTo(W - 60, 548);
    ctx.stroke();

    // ── STATS ROW ────────────────────────────────────────
    const statsArr = [
      { label: 'FİLM',  value: String(stats.movies),     color: '#4ade80' },
      { label: 'DİZİ',  value: String(stats.shows),      color: '#22d3ee' },
      { label: 'SAAT',  value: String(stats.watchHours), color: '#fb7185' },
      ...(stats.avgRating ? [{ label: 'PUAN', value: stats.avgRating, color: '#f5c842' }] : []),
      ...(badges > 0 ? [{ label: 'ROZET', value: String(badges), color: avatarTo }] : []),
    ];

    const cols = statsArr.length;
    const colW = (W - 80) / cols;

    statsArr.forEach((s, i) => {
      const cx = 40 + i * colW + colW / 2;
      const cy = 650;

      // Card
      ctx.fillStyle = s.color + '14';
      rr(ctx, 40 + i * colW + 6, cy - 62, colW - 12, 124, 20);
      ctx.fill();
      ctx.strokeStyle = s.color + '30';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Value
      ctx.fillStyle = s.color;
      ctx.font = `bold 60px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.value, cx, cy - 14);

      // Label
      ctx.fillStyle = '#3f3f46';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(s.label, cx, cy + 40);
    });

    // ── DIVIDER 2 ─────────────────────────────────────────
    ctx.strokeStyle = divG;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 730);
    ctx.lineTo(W - 60, 730);
    ctx.stroke();

    // ── GENRE CHART ──────────────────────────────────────
    if (topGenres.length > 0) {
      const gTop = 756;
      const maxCount = topGenres[0].count;
      const barColors = [avatarFrom, avatarTo, '#f5c842', '#4ade80', '#22d3ee'];
      const barAreaW = W - 160;

      ctx.fillStyle = '#52525b';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('TÜR DAĞILIMI', 80, gTop);

      topGenres.slice(0, 5).forEach(({ name: genre, count }, i) => {
        const y = gTop + 24 + i * 58;
        const pct = count / maxCount;
        const fw = Math.max(barAreaW * pct, 55);
        const bc = barColors[i] ?? avatarFrom;

        // Track
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        rr(ctx, 80, y + 8, barAreaW, 28, 14);
        ctx.fill();

        // Fill
        const bG = ctx.createLinearGradient(80, 0, 80 + fw, 0);
        bG.addColorStop(0, bc);
        bG.addColorStop(1, bc + '44');
        ctx.fillStyle = bG;
        rr(ctx, 80, y + 8, fw, 28, 14);
        ctx.fill();

        // Genre text
        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 19px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(genre, 80, y);

        // Count
        ctx.fillStyle = bc;
        ctx.font = 'bold 19px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(count), W - 80, y);
      });
    }

    // ── BOTTOM BRANDING ──────────────────────────────────
    ctx.fillStyle = avatarFrom + '18';
    rr(ctx, 40, H - 98, W - 80, 48, 14);
    ctx.fill();
    ctx.strokeStyle = avatarFrom + '33';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = avatarTo;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶ MOVIE TRACK', W / 2, H - 74);

  }, [name, image, stats, topGenres, badges, avatarFrom, avatarTo]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-movie-track.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl overflow-hidden flex flex-col gap-4 p-5 w-full max-w-sm"
        style={{ background: '#111118', border: `1px solid ${avatarFrom}55`, boxShadow: `0 0 60px ${avatarFrom}22` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white">Profil Kartın</h2>
            <p className="text-zinc-600 text-xs mt-0.5">4:5 · Instagram için ideal · PNG</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            ✕
          </button>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
        </div>

        <button
          onClick={handleDownload}
          className="w-full py-3 rounded-xl text-sm font-black transition-all"
          style={{
            background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})`,
            color: '#fff',
            boxShadow: `0 4px 24px ${avatarFrom}44`,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          PNG İndir
        </button>
      </div>
    </div>
  );
}
