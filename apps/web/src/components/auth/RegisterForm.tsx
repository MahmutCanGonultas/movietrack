import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z
  .object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    email: z.string().email('Geçerli bir email girin'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type RegisterData = z.infer<typeof registerSchema>;

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: 'white',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
};

export function RegisterForm() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterData) {
    const { data: result, error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (error) {
      setError('root', { message: error.message ?? 'Kayıt oluşturulamadı' });
      return;
    }

    if (result?.user) {
      setUser({ id: result.user.id, email: result.user.email, name: result.user.name, image: result.user.image ?? null });
      navigate('/');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">İsim</label>
        <input {...register('name')} type="text" placeholder="Adın Soyadın" style={inputStyle} />
        {errors.name && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
        <input {...register('email')} type="email" placeholder="sen@example.com" style={inputStyle} />
        {errors.email && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Şifre</label>
        <input {...register('password')} type="password" placeholder="••••••••" style={inputStyle} />
        {errors.password && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Şifre Tekrar</label>
        <input {...register('confirmPassword')} type="password" placeholder="••••••••" style={inputStyle} />
        {errors.confirmPassword && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.confirmPassword.message}</p>}
      </div>

      {errors.root && <p className="text-sm" style={{ color: '#f87171' }}>{errors.root.message}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
          color: 'white',
          boxShadow: '0 0 20px rgba(34,211,238,0.25)',
          marginTop: '8px',
        }}
      >
        {isSubmitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
      </button>
    </form>
  );
}
