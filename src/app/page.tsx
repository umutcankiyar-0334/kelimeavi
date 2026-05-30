'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/features/game-store';
import { invokeEdgeFunction } from '@/features/realtime-manager';
import { toast, ToastContainer } from '@/shared/components/toast';

export default function LandingPage() {
  const router = useRouter();
  const store = useGameStore();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('join');

  // Form states
  const [joinNickname, setJoinNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const [createNickname, setCreateNickname] = useState('');
  const [rounds, setRounds] = useState(8);
  const [duration, setDuration] = useState(30);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNickname.trim() || createNickname.trim().length < 2) {
      toast.error('Kullanıcı adınız en az 2 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const data = await invokeEdgeFunction('create-room', {
        nickname: createNickname.trim(),
        settings: {
          totalRounds: rounds,
          roundDurationSeconds: duration,
          resultDurationSeconds: 7,
        },
      });

      // Update store
      store.setIdentity(data.player.id, data.player.nickname, true, data.token);
      store.setRoom(data.room);

      toast.success('Oda başarıyla kuruldu!');
      router.push(`/room/${data.room.code}`);
    } catch (err: any) {
      toast.error(err.message || 'Oda kurulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinNickname.trim() || joinNickname.trim().length < 2) {
      toast.error('Kullanıcı adınız en az 2 karakter olmalıdır.');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length !== 6) {
      toast.error('Oda kodu tam olarak 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const data = await invokeEdgeFunction('join-room', {
        roomCode: roomCode.trim().toUpperCase(),
        nickname: joinNickname.trim(),
      });

      // Update store
      store.setIdentity(data.player.id, data.player.nickname, false, data.token);
      store.setRoom(data.room);

      toast.success('Odaya başarıyla giriş yapıldı!');
      router.push(`/room/${data.room.code}`);
    } catch (err: any) {
      toast.error(err.message || 'Odaya katılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950 overflow-hidden bg-grid-pattern">
      <ToastContainer />

      {/* Decorative Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Header Container */}
      <div className="text-center z-10 mb-8 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
            Realtime Multiplayer
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-white glow-text-purple">
            KELİME<span className="text-purple-500">OYUNU</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Harfleri karıştırın, en hızlı kelimeyi siz bulun, arkadaşlarınızı devirip liderlik tahtasının zirvesine kurulun!
          </p>
        </motion.div>
      </div>

      {/* Main Form Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-md z-10 glass-premium rounded-2xl overflow-hidden shadow-2xl border-white/5"
      >
        {/* Tabs header */}
        <div className="flex border-b border-white/5 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-4 text-sm font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === 'join'
                ? 'border-purple-500 text-white bg-purple-500/[0.03]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Odaya Katıl
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-4 text-sm font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === 'create'
                ? 'border-purple-500 text-white bg-purple-500/[0.03]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Yeni Oda Kur
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          {activeTab === 'join' ? (
            <motion.form
              key="join-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleJoinRoom}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Takma Adınız (Nickname)
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn: KelimeBükücü"
                  maxLength={16}
                  value={joinNickname}
                  onChange={(e) => setJoinNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Oda Kodu (6 Haneli)
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn: XT9K2Z"
                  maxLength={6}
                  autoComplete="off"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono tracking-widest text-center uppercase font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Odaya Bağlan
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="create-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleCreateRoom}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Oda Sahibi Adı (Host Nickname)
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn: Kaptan"
                  maxLength={16}
                  value={createNickname}
                  onChange={(e) => setCreateNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                />
              </div>

              {/* Game Settings */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Toplam Tur Sayısı
                  </label>
                  <select
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-semibold"
                  >
                    <option value={4} className="bg-slate-900">4 Tur</option>
                    <option value={8} className="bg-slate-900">8 Tur (Standart)</option>
                    <option value={12} className="bg-slate-900">12 Tur</option>
                    <option value={16} className="bg-slate-900">16 Tur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tur Süresi (Sn)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-semibold"
                  >
                    <option value={15} className="bg-slate-900">15 Saniye (Çılgın)</option>
                    <option value={30} className="bg-slate-900">30 Saniye (Standart)</option>
                    <option value={45} className="bg-slate-900">45 Saniye (Rahat)</option>
                    <option value={60} className="bg-slate-900">60 Saniye</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Odayı Oluştur & Başlat
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500 max-w-sm pointer-events-none">
        Güvenli oturum koruması mevcuttur. Bağlantınız kopsa bile nick ve oda kodunuzla girdiğinizde kaldığınız yerden devam edebilirsiniz.
      </div>
    </main>
  );
}
