import { getAvatarPreset, AVATAR_PRESETS } from '@/lib/avatarPresets';

interface Props {
  name: string;
  image: string | null | undefined;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AvatarDisplay({ name, image, size = 40, className = '', style = {} }: Props) {
  const preset = getAvatarPreset(image);
  const initial = (name[0] ?? '?').toUpperCase();

  const grad = preset
    ? `linear-gradient(135deg, ${preset.from}, ${preset.to})`
    : 'linear-gradient(135deg, #7c3aed, #a78bfa, #f5c842)';

  const fontSize = Math.round(size * 0.4);
  const symbol = preset?.symbol;

  return (
    <div
      className={`flex items-center justify-center font-black shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: grad,
        color: '#000',
        fontSize,
        boxShadow: `0 0 0 ${Math.round(size * 0.05)}px #030306, 0 0 0 ${Math.round(size * 0.06)}px ${(preset?.from ?? '#7c3aed')}55`,
        ...style,
      }}
    >
      {symbol ? (
        <span style={{ fontSize: Math.round(size * 0.38), color: 'rgba(0,0,0,0.7)' }}>{symbol}</span>
      ) : (
        <span style={{ fontSize }}>{initial}</span>
      )}
    </div>
  );
}

export function AvatarPreviewGrid({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATAR_PRESETS.map((preset) => {
        const active = selectedId === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all"
            style={{
              background: active ? `${preset.from}22` : 'rgba(255,255,255,0.03)',
              border: active ? `2px solid ${preset.from}` : '2px solid rgba(255,255,255,0.07)',
              boxShadow: active ? `0 0 16px ${preset.from}33` : 'none',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
            >
              <span style={{ fontSize: 20, color: 'rgba(0,0,0,0.7)' }}>{preset.symbol}</span>
            </div>
            <span className="text-[9px] font-semibold text-zinc-500">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
