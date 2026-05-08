import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AvatarPreviewGrid, AvatarDisplay } from '@/components/AvatarDisplay';
import { getAvatarPreset } from '@/lib/avatarPresets';

interface Props {
  onClose: () => void;
}

export function AvatarSelector({ onClose }: Props) {
  const { user, setUserImage } = useAuthStore();
  const currentPreset = getAvatarPreset(user?.image);
  const [selectedId, setSelectedId] = useState<string>(currentPreset?.id ?? '1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users/me/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatarId: selectedId }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      setUserImage(`preset:${selectedId}`);
      onClose();
    } catch {
      setError('Kaydedilemedi, tekrar dene.');
    }
    setSaving(false);
  }

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-5 w-full max-w-sm flex flex-col gap-5"
        style={{ background: '#111118', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 60px rgba(124,58,237,0.15)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white">Avatar Seç</h2>
            <p className="text-zinc-600 text-xs mt-0.5">Netflix tarzı — istediğin zaman değiştir</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white" style={{ background: 'rgba(255,255,255,0.04)' }}>✕</button>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <AvatarDisplay name={user.name} image={`preset:${selectedId}`} size={52} />
          <div>
            <p className="text-sm font-black text-white">{user.name}</p>
            <p className="text-zinc-600 text-xs">{user.email}</p>
          </div>
        </div>

        {/* Grid */}
        <AvatarPreviewGrid selectedId={selectedId} onSelect={setSelectedId} />

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff' }}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
