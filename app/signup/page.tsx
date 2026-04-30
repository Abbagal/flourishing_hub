'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Hash, BookOpen, Building, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { registerStudent } from '@/lib/auth';
import type { Programme } from '@/types';
import toast from 'react-hot-toast';

const PROGRAMMES: Programme[] = ['BTech', 'MTech', 'PhD', 'MSc', 'MA', 'Other'];
const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Physics',
  'Mathematics',
  'Chemistry',
  'Humanities & Social Sciences',
  'Student Wellness Center',
  'Other',
];

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    rollNo: '',
    year: '',
    batch: '',
    programme: '' as Programme | '',
    department: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.rollNo.trim()) next.rollNo = 'Roll number is required';
    if (!form.year) next.year = 'Year is required';
    if (!form.batch.trim()) next.batch = 'Batch is required';
    if (!form.programme) next.programme = 'Programme is required';
    if (!form.department) next.department = 'Department is required';
    if (!form.email.endsWith('@iitb.ac.in')) next.email = 'Only @iitb.ac.in emails are allowed';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) next.password = 'Password must contain one uppercase letter';
    if (!/[a-z]/.test(form.password)) next.password = 'Password must contain one lowercase letter';
    if (!/[0-9]/.test(form.password)) next.password = 'Password must contain one digit';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';

    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setLoading(true);
    try {
      await registerStudent({
        name: form.name,
        rollNo: form.rollNo,
        year: Number(form.year),
        batch: form.batch,
        programme: form.programme as Programme,
        department: form.department,
        email: form.email,
        password: form.password,
      });
      toast.success('Account created successfully');
      router.push('/home');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, icon: Icon, error, children }: { label: string; icon: React.ElementType; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs font-medium text-white/60 mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
        {children}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-dark">
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-[#13132A] to-[#0F0F1A] p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white">Flourishing Hub</p>
            <p className="text-xs text-white/40">IIT Bombay Wellness Center</p>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-black gradient-text leading-tight">Join the
            <br />
            Community
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Create your account to access live wellness events, track your progress, and work with the real backend from day one.
          </p>
          <div className="glass rounded-2xl p-4 space-y-3">
            {['Register for real events', 'Track attendance and feedback', 'Use your IIT Bombay account details'].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs">
                  OK
                </div>
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/20">(c) 2026 Flourishing Hub · IIT Bombay</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg py-8"
        >
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-white">Flourishing Hub</p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Link href="/login" className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-sm text-white/50">Student signup connected to the live backend</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" icon={User} error={errors.name}>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your full name" className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
              </Field>
              <Field label="Roll Number" icon={Hash} error={errors.rollNo}>
                <input value={form.rollNo} onChange={(e) => setField('rollNo', e.target.value)} placeholder="e.g. 23B030012" className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Year" icon={BookOpen} error={errors.year}>
                <input value={form.year} onChange={(e) => setField('year', e.target.value)} placeholder="1-6" type="number" min="1" max="6" className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
              </Field>
              <Field label="Batch" icon={Hash} error={errors.batch}>
                <input value={form.batch} onChange={(e) => setField('batch', e.target.value)} placeholder="e.g. 2023" className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
              </Field>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Programme</label>
                <select value={form.programme} onChange={(e) => setField('programme', e.target.value)} className="input-dark w-full px-3 py-3 rounded-xl text-sm appearance-none">
                  <option value="">Select</option>
                  {PROGRAMMES.map((programme) => <option key={programme} value={programme}>{programme}</option>)}
                </select>
                {errors.programme && <p className="text-xs text-red-400 mt-1">{errors.programme}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Department</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                <select value={form.department} onChange={(e) => setField('department', e.target.value)} className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm appearance-none">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
              </div>
              {errors.department && <p className="text-xs text-red-400 mt-1">{errors.department}</p>}
            </div>

            <Field label="Email Address" icon={Mail} error={errors.email}>
              <input value={form.email} onChange={(e) => setField('email', e.target.value)} type="email" placeholder="yourname@iitb.ac.in" className="input-dark w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.password} onChange={(e) => setField('password', e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="At least 8 chars" className="input-dark w-full pl-10 pr-10 py-3 rounded-xl text-sm" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" className="input-dark w-full pl-10 pr-10 py-3 rounded-xl text-sm" />
                  <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
