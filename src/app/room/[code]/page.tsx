'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/features/game-store';
import { startRealtimeSync, stopRealtimeSync, invokeEdgeFunction } from '@/features/realtime-manager';
import { toast, ToastContainer } from '@/shared/components/toast';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string).toUpperCase();

  const store = useGameStore();
  const {
    playerId,
    nickname,
    isHost,
    roomId,
    roomStatus,
    players,
    currentRound,
    isSubmitted,
    myLastAnswer,
    isConnecting,
    isSynced,
    error,
  } = store;

  // Nickname entry for direct link invites
  const [joinNickname, setJoinNickname] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // Active game timer countdown state
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Active answer text input
  const [answerInput, setAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Copy code state
  const [copied, setCopied] = useState(false);

  // ─── 1. MOUNT & AUTO RECONNECT ──────────────────────────────────────────────
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('tr_word_game_player_id');
    const storedNickname = localStorage.getItem('tr_word_game_nickname');
    const storedIsHost = localStorage.getItem('tr_word_game_is_host') === 'true';
    const storedToken = localStorage.getItem('tr_word_game_token');
    const storedRoomCode = localStorage.getItem('tr_word_game_room_code');
    const storedRoomId = localStorage.getItem('tr_word_game_room_id');

    if (storedPlayerId && storedToken && storedRoomCode === roomCode && storedRoomId) {
      // Re-establish session
      store.setIdentity(storedPlayerId, storedNickname || 'Oyuncu', storedIsHost, storedToken);
      store.setRoom({ id: storedRoomId, code: roomCode });

      // Start realtime synchronizer
      startRealtimeSync(storedRoomId, roomCode);
    } else {
      // Credentials not found or belong to a different room — user needs to join
      store.resetGameStore();
      // Fetch room id first to verify room exists
      const fetchRoomInfo = async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/rooms?code=eq.${roomCode}&select=id,status`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            },
          });
          const data = await res.json();
          if (data && data.length > 0) {
            store.setRoom({ id: data[0].id, code: roomCode, status: data[0].status });
          } else {
            store.setError('Geçersiz veya süresi dolmuş oda kodu.');
          }
        } catch (e) {
          store.setError('Oda bilgileri yüklenirken bir bağlantı hatası oluştu.');
        }
      };
      fetchRoomInfo();
    }

    return () => {
      stopRealtimeSync();
    };
  }, [roomCode]);

  // ─── 2. ACTIVE ROUND COUNTDOWN TIMER ───────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (roomStatus === 'playing' && currentRound && currentRound.status === 'active') {
      const calculateTimeLeft = () => {
        const diff = new Date(currentRound.ends_at).getTime() - Date.now();
        const seconds = Math.max(0, Math.ceil(diff / 1000));
        setTimeLeft(seconds);

        if (seconds <= 0) {
          // Timer expired! Only let host trigger round finish to conserve resources
          if (isHost && timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
            triggerFinishRound();
          }
        }
      };

      calculateTimeLeft(); // initial run
      timerRef.current = window.setInterval(calculateTimeLeft, 500);
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [roomStatus, currentRound, isHost]);

  // ─── 3. HANDLERS ──────────────────────────────────────────────────────────
  const triggerFinishRound = async () => {
    if (!currentRound) return;
    try {
      await invokeEdgeFunction('finish-round', { roundId: currentRound.id });
    } catch (err: any) {
      console.error('Failed to trigger finish-round', err);
    }
  };

  const handleJoinDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinNickname.trim() || joinNickname.trim().length < 2) {
      toast.error('Kullanıcı adınız en az 2 karakter olmalıdır.');
      return;
    }
    if (!roomId) {
      toast.error('Oda bulunamadı.');
      return;
    }

    setJoinLoading(true);
    try {
      const data = await invokeEdgeFunction('join-room', {
        roomCode,
        nickname: joinNickname.trim(),
      });

      store.setIdentity(data.player.id, data.player.nickname, false, data.token);
      store.setRoom(data.room);

      startRealtimeSync(data.room.id, roomCode);
      toast.success('Odaya başarıyla giriş yapıldı!');
    } catch (err: any) {
      toast.error(err.message || 'Giriş yapılamadı.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleToggleReady = async () => {
    if (!playerId || !store.sessionToken) return;
    const myPlayer = players.find((p) => p.id === playerId);
    if (!myPlayer) return;

    try {
      await invokeEdgeFunction('toggle-ready', {
        playerId,
        token: store.sessionToken,
        isReady: !myPlayer.is_ready,
      });
      toast.success(myPlayer.is_ready ? 'Hazır durumunuz kaldırıldı.' : 'Hazır olarak işaretlendiniz!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStartGame = async () => {
    if (!playerId || !store.sessionToken || !roomId) return;
    try {
      await invokeEdgeFunction('start-game', {
        playerId,
        token: store.sessionToken,
        roomId,
      });
      toast.success('Oyun başlatılıyor!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || !currentRound || isSubmitted || submittingAnswer) return;

    setSubmittingAnswer(true);
    const text = answerInput.trim();
    try {
      const res = await invokeEdgeFunction('submit-answer', {
        playerId,
        token: store.sessionToken,
        roundId: currentRound.id,
        submittedWord: text,
      });

      store.setSubmittedState(true, text);
      toast.success('Kelime gönderildi, cevaplar bekleniyor...');

      if (res.autoFinished) {
        // Automatically trigger finish round immediately if all players submitted
        await triggerFinishRound();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        toast.success('Davet linki panoya kopyalandı!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error('Kopyalama başarısız oldu.');
      });
  };

  const handleRestartLobby = async () => {
    // To restart, host simply sends room back to lobby status and updates database
    if (!isHost || !roomId) return;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({
          status: 'lobby',
          host_player_id: playerId,
        }),
      });

      if (!res.ok) throw new Error('Oyun sıfırlanamadı.');

      // Also reset player scores in the room
      await fetch(`${supabaseUrl}/rest/v1/players?room_id=eq.${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({
          score: 0,
          combo_count: 0,
          is_ready: false,
        }),
      });

      // Clear previous rounds
      await fetch(`${supabaseUrl}/rest/v1/rounds?room_id=eq.${roomId}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      });

      toast.success('Oyun sıfırlandı, lobiye dönüldü!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── 4. RENDER CONDITIONAL SCREENS ──────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-950 bg-grid-pattern text-center">
        <div className="max-w-md p-8 rounded-2xl glass border-rose-500/20 text-slate-200">
          <svg className="w-16 h-16 text-rose-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Hata Oluştu</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-sm"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </main>
    );
  }

  if (isConnecting || (!isSynced && playerId)) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-950 bg-grid-pattern">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium text-sm">Odaya bağlanılıyor...</p>
        </div>
      </main>
    );
  }

  // User has not joined yet (direct link path)
  if (!playerId) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-950 bg-grid-pattern">
        <ToastContainer />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-2xl glass-premium shadow-2xl border-white/5"
        >
          <div className="text-center mb-6">
            <span className="px-3 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
              Oda Daveti
            </span>
            <h2 className="text-2xl font-bold text-white mt-2">
              <span className="text-purple-500">{roomCode}</span> Odasına Katılın
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hemen bir takma ad seçerek oyuna dahil olabilirsiniz.
            </p>
          </div>

          <form onSubmit={handleJoinDirect} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Kullanıcı Adınız
              </label>
              <input
                type="text"
                required
                placeholder="örn: KelimeAvcısı"
                maxLength={16}
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={joinLoading}
              className="w-full py-4.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {joinLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Oyuna Dahil Ol'
              )}
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  // ─── 5. SCREEN LOBBY ───────────────────────────────────────────────────────
  if (roomStatus === 'lobby') {
    const isMeReady = players.find((p) => p.id === playerId)?.is_ready;

    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-12 bg-slate-950 bg-grid-pattern relative">
        <ToastContainer />
        <div className="w-full max-w-lg flex flex-col gap-6 z-10">
          {/* Header */}
          <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-md">
            <div>
              <span className="text-xs font-bold text-purple-400 tracking-wide uppercase">Oda Kodu</span>
              <div className="text-2xl font-black text-white tracking-widest uppercase">{roomCode}</div>
            </div>
            <button
              onClick={copyInviteLink}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>

          {/* Lobby Players List */}
          <div className="glass-premium rounded-2xl p-6 shadow-xl border-white/5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Oyuncular ({players.length}/8)
            </h3>
            <div className="flex flex-col gap-2.5">
              <AnimatePresence>
                {players.map((p) => {
                  const isPlayerHost = p.is_host;
                  const isPlayerMe = p.id === playerId;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`flex justify-between items-center p-3.5 rounded-xl border transition-all ${
                        isPlayerMe
                          ? 'bg-purple-500/5 border-purple-500/20'
                          : 'bg-white/[0.01] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{p.nickname}</span>
                        {isPlayerMe && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
                            SEN
                          </span>
                        )}
                        {isPlayerHost && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                            👑 Host
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {p.is_connected ? (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            p.is_ready
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}>
                            {p.is_ready ? 'HAZIR' : 'BEKLİYOR'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                            ÇEVRİMDIŞI
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Trigger Box */}
          <div className="flex flex-col gap-3">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={players.length < 2 || players.some((p) => !p.is_host && !p.is_ready)}
                className="w-full py-4.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                Oyunu Başlat
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleToggleReady}
                className={`w-full py-4.5 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  isMeReady
                    ? 'bg-rose-600 hover:bg-rose-500 hover:shadow-rose-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20'
                }`}
              >
                {isMeReady ? 'Hazır Durumunu İptal Et' : 'Hazırım!'}
              </button>
            )}

            {!isHost && players.length < 2 && (
              <div className="text-center text-xs text-slate-500 font-medium">
                Oyunun başlaması için en az 2 oyuncu gerekmektedir.
              </div>
            )}
            {isHost && players.length < 2 && (
              <div className="text-center text-xs text-amber-400 font-semibold bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                ⚠️ Başlamak için en az 1 arkadaşınızı davet etmelisiniz!
              </div>
            )}
            {isHost && players.length >= 2 && players.some((p) => !p.is_host && !p.is_ready) && (
              <div className="text-center text-xs text-slate-500 font-medium">
                Diğer oyuncuların hazır olması bekleniyor...
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ─── 6. SCREEN PLAYING ─────────────────────────────────────────────────────
  if (roomStatus === 'playing') {
    if (!currentRound) return null;

    const showRoundResults = currentRound.status === 'pending' || currentRound.status === 'finished';

    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-8 bg-slate-950 bg-grid-pattern relative">
        <ToastContainer />
        <div className="w-full max-w-lg flex flex-col gap-6 z-10">
          
          {/* Round Header */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">TUR</span>
              <div className="text-lg font-black text-white">
                {currentRound.round_number} <span className="text-slate-500 text-sm font-semibold">/ {store.totalRounds}</span>
              </div>
            </div>

            {/* Timer Counter */}
            <div className="flex items-center gap-2">
              {currentRound.status === 'active' && (
                <div className={`px-4 py-2 rounded-xl border font-bold text-sm tracking-wide flex items-center gap-1.5 transition-all ${
                  timeLeft <= 5
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}>
                  <span className="text-xs text-slate-400 font-medium">SÜRE:</span>
                  {timeLeft} sn
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showRoundResults ? (
              // Round Intermediate Score breakdown screen
              <motion.div
                key="round-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-premium rounded-2xl p-6 border-white/5 flex flex-col gap-6 shadow-2xl"
              >
                <div className="text-center">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                    TUR SONUÇLARI
                  </span>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-3">Hedef Kelime</h3>
                  <div className="text-3xl font-black text-purple-400 tracking-wide uppercase mt-1">
                    {currentRound.original_word || 'Yükleniyor...'}
                  </div>
                </div>

                {/* Score listing */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Turdaki Sıralama</h4>
                  {players.map((p) => {
                    const isMe = p.id === playerId;
                    return (
                      <div
                        key={p.id}
                        className={`flex justify-between items-center p-3 rounded-xl border ${
                          isMe ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/[0.01] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-200">{p.nickname}</span>
                          {isMe && <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-500/25 text-purple-300 rounded">SEN</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-xs text-slate-400">
                            Combo: <span className="font-bold text-slate-300">{p.combo_count}x</span>
                          </div>
                          <div className="font-extrabold text-sm text-white">{p.score} P</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delay info */}
                {currentRound.status === 'pending' && (
                  <div className="text-center text-xs font-semibold text-slate-500 bg-white/5 border border-white/10 rounded-xl p-3 animate-pulse">
                    Sonraki tur hazırlanıyor, lobi sayacı bekleniyor...
                  </div>
                )}
              </motion.div>
            ) : (
              // Active word scrambling screen
              <motion.div
                key="round-active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-6"
              >
                {/* Scrambled letters board */}
                <div className="glass-premium rounded-2xl p-6 sm:p-8 border-white/5 text-center shadow-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">HARFLER</span>
                  <div className="flex flex-wrap gap-2.5 justify-center mt-4">
                    {currentRound.scrambled_letters.map((letter, idx) => (
                      <motion.div
                        key={`${letter}-${idx}`}
                        initial={{ opacity: 0, scale: 0.5, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, type: 'spring', stiffness: 150 }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-lg text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center uppercase select-none hover:border-purple-500/40 hover:scale-105 transition-all animate-pop cursor-default"
                      >
                        {letter}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Submitting input */}
                {isSubmitted ? (
                  <div className="glass rounded-2xl p-6 border-purple-500/10 text-center shadow-lg">
                    <svg className="w-8 h-8 text-emerald-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-semibold text-slate-300">Cevabınız İletildi</p>
                    <p className="text-xs text-slate-400 mt-1">Cevabınız: <span className="font-bold text-purple-400 uppercase">{myLastAnswer}</span></p>
                    <p className="text-xs text-slate-500 mt-3 animate-pulse">Diğer oyuncuların bitirmesi bekleniyor...</p>
                  </div>
                ) : (
                  <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Cevabınızı buraya yazın..."
                      autoComplete="off"
                      autoFocus
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-white/10 bg-slate-900 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-center uppercase tracking-wide font-extrabold text-xl shadow-inner"
                    />

                    <button
                      type="submit"
                      disabled={submittingAnswer || !answerInput.trim()}
                      className="w-full py-4.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer text-base"
                    >
                      {submittingAnswer ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Gönder'
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    );
  }

  // ─── 7. SCREEN FINISHED ────────────────────────────────────────────────────
  if (roomStatus === 'finished') {
    // Sort players by score
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const gold = sorted[0];
    const silver = sorted[1];
    const bronze = sorted[2];

    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-12 bg-slate-950 bg-grid-pattern relative">
        <ToastContainer />
        <div className="w-full max-w-lg flex flex-col gap-6 z-10">
          
          {/* Header Podium Banner */}
          <div className="text-center">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
              Oyun Bitti
            </span>
            <h2 className="mt-3 text-4xl font-black text-white glow-text-purple">LİDERLİK TAHTASI</h2>
            <p className="text-xs text-slate-400 mt-1">Efsanevi zafer tablosu ve final skorları!</p>
          </div>

          {/* Winner Banner Card */}
          {gold && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-premium rounded-2xl p-6 border-amber-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-b from-amber-500/5 to-slate-950"
            >
              {/* Sparkle background elements */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/10 blur-xl" />

              <div className="text-center">
                <span className="text-3xl">🏆</span>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-2">ŞAMPİYON</h3>
                <div className="text-2xl font-black text-white mt-1 uppercase tracking-wide">{gold.nickname}</div>
                <div className="text-sm font-extrabold text-slate-300 mt-1">{gold.score} Toplam Puan</div>
              </div>
            </motion.div>
          )}

          {/* Leaderboard Rankings */}
          <div className="glass rounded-2xl p-5 border-white/5 flex flex-col gap-2">
            {sorted.map((p, index) => {
              const isMe = p.id === playerId;
              let medal = '';
              if (index === 0) medal = '🥇 ';
              else if (index === 1) medal = '🥈 ';
              else if (index === 2) medal = '🥉 ';

              return (
                <div
                  key={p.id}
                  className={`flex justify-between items-center p-3.5 rounded-xl border ${
                    isMe ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/[0.01] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-extrabold text-slate-500 w-5">{index + 1}.</span>
                    <span className="font-bold text-slate-200 uppercase tracking-wide">
                      {medal}{p.nickname}
                    </span>
                    {isMe && <span className="text-[8px] font-bold px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded">SEN</span>}
                  </div>
                  <div className="font-extrabold text-white text-sm">{p.score} P</div>
                </div>
              );
            })}
          </div>

          {/* Restart triggers */}
          {isHost ? (
            <button
              onClick={handleRestartLobby}
              className="w-full py-4.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-purple-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              Tekrar Oyna (Lobiye Dön)
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
              </svg>
            </button>
          ) : (
            <div className="text-center text-xs text-slate-500 font-semibold bg-white/5 border border-white/10 rounded-xl p-4">
              Lobi sahibi yeni bir el başlatmaya karar verdiğinde otomatik olarak lobiye aktarılacaksınız...
            </div>
          )}

          <button
            onClick={() => {
              store.resetGameStore();
              router.push('/');
            }}
            className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Lobi Odasından Çık
          </button>
        </div>
      </main>
    );
  }

  return null;
}
