import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { VideoAd } from '../../types';
import confetti from 'canvas-confetti';
import {
  PlaySquare,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  X,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Eye,
  Flame
} from 'lucide-react';

export const WatchEarnView: React.FC = () => {
  const { user, reloadUser, showToast } = useApp();
  const [ads, setAds] = useState<VideoAd[]>([]);
  const [loading, setLoading] = useState(true);

  // Video Player Modal State
  const [activeAd, setActiveAd] = useState<VideoAd | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await api.getAds();
      setAds(res.ads);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch video advertisements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartWatch = async (ad: VideoAd) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setActiveAd(ad);
    setSecondsRemaining(ad.duration);
    setIsPlaying(true);
    setIsMuted(true);
    setIsCompleted(false);
    setChallengeToken(null);

    try {
      const res = await api.startAd(ad.id, user?.id || 'usr_creator_1');
      setChallengeToken(res.challengeToken);
      setSecondsRemaining(res.duration);

      let currentSecs = res.duration;
      timerRef.current = setInterval(() => {
        currentSecs -= 1;
        setSecondsRemaining(currentSecs);

        if (currentSecs <= 0) {
          clearInterval(timerRef.current);
        }
      }, 1000);
    } catch (err: any) {
      showToast(err.message || 'Failed to start video ad validation', 'error');
      closeAdModal();
    }
  };

  const closeAdModal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveAd(null);
    setChallengeToken(null);
    setIsCompleted(false);
  };

  const handleClaimAdReward = async () => {
    if (!activeAd || !challengeToken) return;

    if (secondsRemaining > 0) {
      showToast(`Please finish watching the video (${secondsRemaining}s remaining)`, 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.completeAd(challengeToken);

      setIsCompleted(true);
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast(`Success! +${res.reward} Coins credited to your wallet.`, 'success');
      await reloadUser();
      fetchAds();
    } catch (err: any) {
      showToast(err.message || 'Verification failed. Please re-watch.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 3D Light Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Watch & Earn Video Ads</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold shadow-2xs">
              INSTANT REWARDS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Stream high-value creator previews and sponsor spotlights. Complete the full watch duration to claim instant coins.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs self-start sm:self-auto">
          <Eye className="w-4 h-4 text-amber-500" />
          <span>Real View Duration Verified</span>
        </div>
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-white border border-slate-200 shadow-xs animate-pulse" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <PlaySquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No video advertisements available currently</h3>
          <p className="text-xs text-slate-500 mt-1">Sponsors add new video spots regularly. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.map(ad => (
            <div
              key={ad.id}
              className="group rounded-3xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-[0_12px_30px_-5px_rgba(15,23,42,0.08),0_4px_10px_-2px_rgba(15,23,42,0.02)] hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
            >
              <div>
                {/* Thumbnail container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={ad.thumbnail}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />

                  {/* Duration Badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 border border-white/10 shadow-xs">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{ad.duration}s</span>
                  </div>

                  {/* Coin Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 text-xs font-mono font-black flex items-center gap-1 shadow-md shadow-amber-500/30">
                    <Coins className="w-3.5 h-3.5 fill-slate-950" />
                    <span>+{ad.reward} Coins</span>
                  </div>

                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] group-hover:scale-110 transition-all">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                    {ad.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {ad.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-3">
                  <span>Views: {ad.viewsCount.toLocaleString()}</span>
                  <span>Daily limit: {ad.dailyLimit}</span>
                </div>

                <button
                  onClick={() => handleStartWatch(ad)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-[0_3px_8px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] active:translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Watch & Earn {ad.reward} Coins</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Ad Player Modal (3D Light Pop-in) */}
      {activeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.15)] p-6 overflow-hidden">
            {/* Close Button */}
            <button
              onClick={closeAdModal}
              className="absolute top-5 right-5 z-20 p-2 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>

            {!isCompleted ? (
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center justify-between pr-10">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-700 font-bold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 shadow-2xs">
                      SPONSORED ADVERTISEMENT
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{activeAd.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold shadow-2xs">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>+{activeAd.reward} Coins</span>
                  </div>
                </div>

                {/* Video Player Surface */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner">
                  <video
                    src={activeAd.videoUrl}
                    poster={activeAd.thumbnail}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    loop
                    className="w-full h-full object-cover"
                  />

                  {/* Audio Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/70 backdrop-blur-md text-white hover:bg-black transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Mandatory Viewing Time Overlay */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-xs font-mono font-bold text-white flex items-center gap-2 border border-white/10 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {secondsRemaining > 0 ? `Required: ${secondsRemaining}s` : '✓ Viewing complete'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Ad playback validation</span>
                    <span className={secondsRemaining === 0 ? 'text-emerald-600 font-bold' : 'text-amber-700'}>
                      {secondsRemaining === 0 ? 'Ready to collect!' : `${secondsRemaining}s remaining`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-1000 shadow-xs"
                      style={{
                        width: `${Math.min(
                          100,
                          ((activeAd.duration - secondsRemaining) / Math.max(1, activeAd.duration)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  disabled={secondsRemaining > 0 || isVerifying}
                  onClick={handleClaimAdReward}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    secondsRemaining > 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-600/30 font-bold active:translate-y-0.5'
                  }`}
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validating watch token...</span>
                    </div>
                  ) : secondsRemaining > 0 ? (
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Complete Viewing ({secondsRemaining}s)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Claim {activeAd.reward} Coins Reward</span>
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-5 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Ad Reward Credited!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    +{activeAd.reward} Coins have been added to your wallet balance.
                  </p>
                </div>
                <button
                  onClick={closeAdModal}
                  className="w-full py-3 rounded-xl btn-3d-red text-xs font-bold transition-all"
                >
                  Watch Next Video
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
