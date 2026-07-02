import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  UserPlus, 
  Shield, 
  Mail, 
  Calendar, 
  Lock, 
  Check, 
  RefreshCw, 
  UserCheck, 
  Users,
  Key,
  BadgeAlert
} from 'lucide-react';
import { 
  OperatorUser, 
  registerOperator, 
  getAllOperators 
} from '../firebase';

interface OperatorManagerProps {
  currentUser: OperatorUser;
  triggerToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function OperatorManager({ currentUser, triggerToast }: OperatorManagerProps) {
  const [operators, setOperators] = useState<OperatorUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Operator',
    password: '',
    confirmPassword: ''
  });

  const loadOperators = async () => {
    setIsLoading(true);
    try {
      const data = await getAllOperators();
      setOperators(data);
    } catch (err: any) {
      triggerToast('error', 'Gagal memuat daftar operator.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, role, password, confirmPassword } = formData;

    if (!name || !email || !password) {
      triggerToast('error', 'Semua kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      triggerToast('error', 'Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 5) {
      triggerToast('error', 'Sandi minimal harus terdiri dari 5 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerOperator({
        name,
        email: email.toLowerCase(),
        role,
        passwordHash: password
      });

      triggerToast('success', `Berhasil mendaftarkan operator baru: ${name}`);
      setFormData({
        name: '',
        email: '',
        role: 'Operator',
        password: '',
        confirmPassword: ''
      });
      await loadOperators(); // refresh list
    } catch (err: any) {
      triggerToast('error', `Gagal menambahkan operator: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="operator-manager-panel">
      
      {/* 1. Left hand Add Operator Form */}
      <div className="lg:col-span-1 space-y-6" id="add-operator-form-column">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Tambah Operator Baru</h3>
              <p className="text-xs text-slate-400">Daftarkan akun operator tambahan.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1" id="mgr-name">
              <label className="text-xs font-semibold text-slate-600 block">Nama Lengkap *</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="cth: Muhammad Fadli"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1" id="mgr-email">
              <label className="text-xs font-semibold text-slate-600 block">Alamat Email *</label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="fadli@arsip.org"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1" id="mgr-role">
              <label className="text-xs font-semibold text-slate-600 block">Hak Akses / Peran *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 outline-none transition cursor-pointer"
              >
                <option value="Operator">Operator (Akses Pengarsipan)</option>
                <option value="Administrator">Administrator (Akses Penuh)</option>
              </select>
            </div>

            <div className="space-y-1" id="mgr-password">
              <label className="text-xs font-semibold text-slate-600 block">Kata Sandi *</label>
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 5 karakter..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1" id="mgr-confirm">
              <label className="text-xs font-semibold text-slate-600 block">Konfirmasi Kata Sandi *</label>
              <input 
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi sandi..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Daftarkan...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Operator</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Right-hand Operators List */}
      <div className="lg:col-span-2 space-y-6" id="operators-list-column">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Daftar Operator Terdaftar</h3>
                <p className="text-xs text-slate-400">Total operator yang dapat mengelola dashboard kearsipan.</p>
              </div>
            </div>
            
            <button
              onClick={loadOperators}
              disabled={isLoading}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition"
              title="Refresh Daftar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
              <p className="text-xs text-slate-400">Memuat basis data operator...</p>
            </div>
          ) : operators.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada operator terdaftar</p>
              <p className="text-xs text-slate-400">Gunakan form di samping untuk mendaftarkan operator pertama.</p>
            </div>
          ) : (
            <div className="overflow-x-auto" id="operators-table-wrapper">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                    <th className="py-3 px-4">Nama Operator</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran / Hak Akses</th>
                    <th className="py-3 px-4 text-right">Tanggal Gabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operators.map((op) => {
                    const isItMe = op.email.toLowerCase() === currentUser.email.toLowerCase();
                    return (
                      <tr key={op.id || op.email} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                              {op.name.slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 block">{op.name}</span>
                              {isItMe && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded-md mt-0.5">
                                  <UserCheck className="w-3 h-3" /> Anda
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{op.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                            op.role === 'Administrator'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            <Shield className="w-3.5 h-3.5" />
                            {op.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 text-xs font-mono">
                          {op.createdAt ? new Date(op.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
