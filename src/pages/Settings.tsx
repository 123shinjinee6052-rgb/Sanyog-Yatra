import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Globe, 
  Save,
  Loader2,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-hot-toast';

export const Settings = () => {
  const { user, firebaseUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), { name });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setLoading(true);
    try {
      await updatePassword(firebaseUser, newPassword);
      toast.success('Password changed');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white dark:text-white light:text-slate-900">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <User size={20} />
              </div>
              <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">Profile Information</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 dark:text-slate-300 light:text-slate-600">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-accent dark:text-white light:text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 dark:text-slate-300 light:text-slate-600">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 opacity-50 cursor-not-allowed dark:text-white light:text-slate-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-gradient text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-opacity"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
              </button>
            </form>
          </div>

          <div className="glass p-8 rounded-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Lock size={20} />
              </div>
              <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">Security</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="max-w-md space-y-2">
                <label className="text-sm font-medium text-slate-300 dark:text-slate-300 light:text-slate-600">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-accent dark:text-white light:text-slate-900"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl font-bold border border-white/10 transition-colors"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 mb-6">Preferences</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-400">App Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      theme === 'light' 
                        ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Sun size={18} />
                    <span className="text-sm font-bold">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      theme === 'dark' 
                        ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Moon size={18} />
                    <span className="text-sm font-bold">Dark</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600">Email Notifications</span>
                </div>
                <div className="w-10 h-5 bg-brand-accent rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600">Public Profile</span>
                </div>
                <div className="w-10 h-5 bg-white/10 rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-slate-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-brand-accent/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-brand-accent" />
              <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">Account Status</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Your account is currently active and verified. You have {user?.role === 'admin' ? 'Administrative' : 'Standard'} access.
            </p>
            <div className="p-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/20">
              <p className="text-xs font-bold text-brand-accent uppercase mb-1">Membership</p>
              <p className="text-white dark:text-white light:text-slate-900 font-bold">Standard Tier</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
