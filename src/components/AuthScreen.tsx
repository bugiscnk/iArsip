import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderLock, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  User, 
  Mail, 
  Lock, 
  UserPlus, 
  ChevronRight, 
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  authenticateOperator, 
  registerOperator, 
  getAllOperators,
  OperatorUser 
} from '../firebase';

interface AuthScreenProps {
  onAuthSuccess: (user: OperatorUser) => void;
  triggerToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function AuthScreen({ onAuthSuccess, triggerToast }: AuthScreenProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Field States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register Field States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('Operator');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Auto seed default credentials
  useEffect(() => {
    const ensureDefaultUser = async () => {
      try {
        const operators = await getAllOperators();
        if (operators.length === 0) {
          // Register default admin user silently on initial load
          await registerOperator({
            name: 'Super Admin',
            email: 'admin@arsip.org',
            role: 'Administrator',
            passwordHash: 'admin123'
          });
          console.log('Seeded default user: admin@arsip.org');
        }
      } catch (err) {
        console.error('Quiet background seed warning (already exists or permission restriction):', err);
      }
    };
    ensureDefaultUser();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerToast('error', 'Silakan isi email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const operator = await authenticateOperator(email, password);
      if (operator) {
        triggerToast('success', `Selamat datang kembali, ${operator.name}!`);
        onAuthSuccess(operator);
      } else {
        triggerToast('error', 'Email atau kata sandi tidak sesuai. Silakan coba lagi.');
      }
    } catch (err: any) {
      triggerToast('error', `Gagal otentikasi: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      triggerToast('error', 'Semua kolom wajib diisi.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      triggerToast('error', 'Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (regPassword.length < 5) {
      triggerToast('error', 'Sandi minimal 5 karakter untuk keamanan.');
      return;
    }

    setIsLoading(true);
    try {
      await registerOperator({
        name: regName,
        email: regEmail,
        role: regRole,
        passwordHash: regPassword
      });

      triggerToast('success', 'Akun Operator baru berhasil didaftarkan! Silakan masuk.');
      
      // Reset registration form & shift to login screen automatically
      setEmail(regEmail);
      setIsRegisterMode(false);
      
      // Clean register fields
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      triggerToast('error', `Pendaftaran gagal: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-screen-view" className="flex-1 flex flex-col items-center justify-center p-4 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden min-h-screen">
      {/* Visual glowing layout orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" id="orb-1"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" id="orb-2"></div>
      
      <div className="w-full max-w-md relative z-10 text-center space-y-6" id="login-or-register-container">
        
        {/* App Logo */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
            <FolderLock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight" id="auth-title">Arsip Digital Org</h1>
          <p className="text-slate-400 text-xs max-w-xs mx-auto">
            Portal kearsipan dokumen organisasi berbasis platform cloud secure database.
          </p>
        </div>

        {/* Transition forms container */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md text-left shadow-2xl relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!isRegisterMode ? (
              // LOGIN CARD STATE
              <motion.div
                key="login-form-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Masuk Operator
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Berikan kredensial terdaftar untuk mengelola dokumen.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5" id="group-email">
                    <label className="text-[11px] font-mono tracking-wider text-slate-300 uppercase block">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh: admin@arsip.org"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5" id="group-password">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-mono tracking-wider text-slate-300 uppercase block">Kata Sandi</label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan sandi..."
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-login-submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Mengecek Database...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk Sekarang</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="border-t border-slate-800/80 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Belum punya akun? Buat Operator Baru
                  </button>
                </div>

                {/* Default User Access Helper Block */}
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                    Operator Default Terbuka:
                  </p>
                  <p>Email: <code className="text-yellow-400 font-mono">admin@arsip.org</code></p>
                  <p>Kata Sandi: <code className="text-yellow-400 font-mono">admin123</code></p>
                </div>

              </motion.div>
            ) : (
              // REGISTER / ADD USER STATE
              <motion.div
                key="register-form-panel"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 mb-2 hover:underline"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Kembali ke Login
                  </button>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Tambah Operator / User Baru
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Daftarkan akun administrator atau operator baru ke Cloud.</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1" id="reg-group-name">
                    <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="cth: Ahmad Fauzi"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1" id="reg-group-email">
                    <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="fauzi@arsip.org"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1" id="reg-group-role">
                    <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block">Hak Akses / Peran</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-xs text-white outline-none transition"
                    >
                      <option value="Operator">Operator (Unggah, Edit & Pratinjau)</option>
                      <option value="Administrator">Administrator (Hak Akses Penuh)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1" id="reg-group-password">
                      <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block">Sandi</label>
                      <input 
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Sandi..."
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                    <div className="space-y-1" id="reg-group-confirm">
                      <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block">Ulangi Sandi</label>
                      <input 
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi..."
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-register-submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition mt-2 text-xs"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Mendaftarkan User...</span>
                      </>
                    ) : (
                      <>
                        <span>Daftarkan Operator</span>
                        <UserPlus className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <p className="text-[10px] text-slate-600 font-mono">
          Arsip Digital Workspace • Layanan Database Cloud Mandiri
        </p>
      </div>
    </div>
  );
}
