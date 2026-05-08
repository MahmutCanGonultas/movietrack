export interface AvatarPreset {
  id: string;
  from: string;
  to: string;
  symbol: string;
  label: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: '1', from: '#7c3aed', to: '#a78bfa', symbol: '★', label: 'Mor' },
  { id: '2', from: '#ea580c', to: '#fbbf24', symbol: '▶', label: 'Ateş' },
  { id: '3', from: '#0891b2', to: '#22d3ee', symbol: '◆', label: 'Siyan' },
  { id: '4', from: '#059669', to: '#34d399', symbol: '◉', label: 'Orman' },
  { id: '5', from: '#be185d', to: '#f472b6', symbol: '♦', label: 'Pembe' },
  { id: '6', from: '#b45309', to: '#fbbf24', symbol: '◎', label: 'Altın' },
  { id: '7', from: '#4338ca', to: '#818cf8', symbol: '✦', label: 'İndigo' },
  { id: '8', from: '#155e75', to: '#06b6d4', symbol: '◷', label: 'Deniz' },
];

export function getAvatarPreset(image: string | null | undefined): AvatarPreset | null {
  if (!image?.startsWith('preset:')) return null;
  const id = image.replace('preset:', '');
  return AVATAR_PRESETS.find((p) => p.id === id) ?? null;
}

export function getAvatarGradient(image: string | null | undefined): { from: string; to: string } {
  const preset = getAvatarPreset(image);
  if (preset) return { from: preset.from, to: preset.to };
  return { from: '#7c3aed', to: '#a78bfa' };
}
