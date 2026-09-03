import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Check, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const features = [
    'Quản lý đề tài và nhóm khóa luận',
    'Theo dõi tiến độ và báo cáo',
    'Giao tiếp với giảng viên hướng dẫn',
  ];

  const { login } = useAuth();

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({
        username: username.trim(),
        password: password,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Brand */}
      <div className="w-2/5 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] p-12 flex flex-col justify-center text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>ThesisHub</h1>
              <p className="text-blue-200 text-sm">Nền tảng quản lý khóa luận</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Quản lý hành trình nghiên cứu của bạn
          </h2>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <p className="text-blue-100">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Chào mừng trở lại
            </h2>
            <p className="text-muted-foreground text-sm">
              Đăng nhập để tiếp tục quản lý khóa luận tốt nghiệp
            </p>
          </div>

          {/* Quick Login Demo Accounts */}
          <div className="p-3 bg-muted/50 rounded-lg border text-xs space-y-2">
            <div className="font-semibold text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Chọn tài khoản thử nghiệm nhanh:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', '123456')}
                className="px-2 py-1.5 text-left border rounded hover:bg-background transition-colors flex flex-col"
              >
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin (Quản trị)
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">admin / 123456</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('giaovu', '123456')}
                className="px-2 py-1.5 text-left border rounded hover:bg-background transition-colors flex flex-col bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
              >
                <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Giáo vụ (Đào tạo)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">giaovu / 123456</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('truongbomon', '123456')}
                className="px-2 py-1.5 text-left border rounded hover:bg-background transition-colors flex flex-col"
              >
                <span className="font-bold text-purple-600 dark:text-purple-400">Trưởng bộ môn</span>
                <span className="text-[10px] text-muted-foreground font-mono">truongbomon / 123456</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('giangvien', '123456')}
                className="px-2 py-1.5 text-left border rounded hover:bg-background transition-colors flex flex-col"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400">Giảng viên</span>
                <span className="text-[10px] text-muted-foreground font-mono">giangvien / 123456</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold">Tên đăng nhập</label>
              <Input
                type="text"
                placeholder="Nhập username hoặc mã SV/GV..."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-primary hover:underline"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'} mật khẩu
                </button>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <label htmlFor="remember" className="ml-2 text-xs text-foreground">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
