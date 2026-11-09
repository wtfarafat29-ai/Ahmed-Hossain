import React, { useState } from 'react';
import { UserAccount } from '../types';
import { X, Lock, Mail, Phone, Store, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: UserAccount) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose, allowClose = false }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [channel, setChannel] = useState<'email' | 'phone'>('phone');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // OTP state
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('123456');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('আপনার নাম লিখুন।');
      return;
    }

    if (!identifier.trim()) {
      setErrorMsg(channel === 'phone' ? 'মোবাইল নম্বর লিখুন।' : 'ইমেইল এড্রেস লিখুন।');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    // Generate random 6-digit OTP for demo
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMsg('ভুল ওটিপি কোড। পুনরায় চেষ্টা করুন।');
      return;
    }

    const newUser: UserAccount = {
      id: 'u_' + Date.now().toString(36),
      name: name.trim() || (channel === 'phone' ? 'মোবাইল গ্রাহক' : identifier.split('@')[0]),
      email: channel === 'email' ? identifier.trim() : '',
      phone: channel === 'phone' ? identifier.trim() : '',
      shop: shopName.trim() || undefined,
      provider: 'local',
      created: Date.now(),
    };

    onSuccess(newUser);
  };

  const handleGoogleDemo = () => {
    const googleUser: UserAccount = {
      id: 'g_' + Date.now().toString(36),
      name: 'আরাফাত হোসাইন',
      email: 'wtfarafat29@gmail.com',
      phone: '01700112233',
      provider: 'google',
      created: Date.now(),
    };
    onSuccess(googleUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95">
        {allowClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-sm mb-2">
            🧾
          </div>
          <h2 className="text-xl font-bold text-slate-900">দোকান হিসাব (Dokan Hisab)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {step === 'otp'
              ? 'ওটিপি যাচাইকরণ (OTP Verification)'
              : mode === 'signup'
              ? 'নতুন দোকানদার একাউন্ট খুলুন'
              : 'দোকানদার একাউন্টে লগইন করুন'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {step === 'credentials' ? (
          <div className="space-y-4">
            {/* Google Sign in button */}
            <button
              type="button"
              onClick={handleGoogleDemo}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>গুগল দিয়ে চালিয়ে যান (Google Account)</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span>অথবা</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Mode switch */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-white text-emerald-800 shadow-xs' : ''
                }`}
              >
                লগইন (Login)
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === 'signup' ? 'bg-white text-emerald-800 shadow-xs' : ''
                }`}
              >
                সাইন আপ (Sign up)
              </button>
            </div>

            {/* Channel switch */}
            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ch"
                  checked={channel === 'phone'}
                  onChange={() => setChannel('phone')}
                  className="text-emerald-700"
                />
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>মোবাইল নম্বর</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ch"
                  checked={channel === 'email'}
                  onChange={() => setChannel('email')}
                  className="text-emerald-700"
                />
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>ইমেইল এড্রেস</span>
              </label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      আপনার পূর্ণ নাম *
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      দোকানের নাম (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: সততা স্টোর"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {channel === 'phone' ? 'মোবাইল নম্বর *' : 'ইমেইল এড্রেস *'}
                </label>
                <input
                  type={channel === 'phone' ? 'tel' : 'email'}
                  placeholder={channel === 'phone' ? '01XXXXXXXXX' : 'yourname@mail.com'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পাসওয়ার্ড *</label>
                <input
                  type="password"
                  placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mt-2"
              >
                <span>{mode === 'signup' ? 'একাউন্ট খুলুন ও ওটিপি পাঠান' : 'লগইন করুন ও ওটিপি যাচাই'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* OTP Screen */
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 text-center">
              <span>ডেমো মোড: এসএমএস বা ইমেইলের প্রয়োজন নেই। আপনার কোড: </span>
              <b className="text-sm font-bold tracking-widest text-emerald-800">
                {generatedOtp}
              </b>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
                ৬ সংখ্যার ওটিপি কোডটি লিখুন:
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full py-2.5 px-3 text-center text-lg font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>যাচাই করে দোকানে প্রবেশ করুন</span>
            </button>

            <button
              onClick={() => setStep('credentials')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 hover:underline"
            >
              ← নম্বর বা ইমেইল পরিবর্তন করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
