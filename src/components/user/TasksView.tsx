import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Task, TaskCategory } from '../../types';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Clock,
  Coins,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Play,
  X,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { user, reloadUser, showToast } = useApp();
  const [tasks, setTasks] = useState<(Task & { isCompletedByUser?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Active Task Execution Modal State
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  // Countdown Stage: 'IDLE' | 'COUNTDOWN' | 'TASK_ACTIVE' | 'VERIFYING' | 'COMPLETED'
  const [taskStage, setTaskStage] = useState<'IDLE' | 'COUNTDOWN' | 'TASK_ACTIVE' | 'VERIFYING' | 'COMPLETED'>('IDLE');
  const [countdownRemaining, setCountdownRemaining] = useState<number>(10);
  const [taskTimerRemaining, setTaskTimerRemaining] = useState<number>(0);
  const [completedReward, setCompletedReward] = useState<number>(0);

  const countdownIntervalRef = useRef<any>(null);
  const taskTimerIntervalRef = useRef<any>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks(user?.id);
      setTasks(res.tasks);
    } catch (err: any) {
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.id]);

  const clearIntervals = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (taskTimerIntervalRef.current) clearInterval(taskTimerIntervalRef.current);
  };

  useEffect(() => {
    return () => clearIntervals();
  }, []);

  const handleInitiateTask = async (task: Task & { isCompletedByUser?: boolean }) => {
    if (task.isCompletedByUser) {
      showToast('You have already completed this task', 'info');
      return;
    }

    clearIntervals();
    setActiveTask(task);
    setTaskStage('COUNTDOWN');
    setCountdownRemaining(task.countdownDuration || 10);
    setTaskTimerRemaining(task.timer || 20);
    setChallengeToken(null);

    try {
      const res = await api.startTask(task.id, user?.id || 'usr_creator_1');
      setChallengeToken(res.challengeToken);
      setCountdownRemaining(res.countdownDuration || 10);

      let current = res.countdownDuration || 10;
      countdownIntervalRef.current = setInterval(() => {
        current -= 1;
        setCountdownRemaining(current);

        if (current <= 0) {
          clearInterval(countdownIntervalRef.current);
          setTaskStage('TASK_ACTIVE');
          startTaskTimer(task.timer || 20);
        }
      }, 1000);
    } catch (err: any) {
      showToast(err.message || 'Failed to start task countdown', 'error');
      closeTaskModal();
    }
  };

  const startTaskTimer = (initialSeconds: number) => {
    let current = initialSeconds;
    setTaskTimerRemaining(current);

    taskTimerIntervalRef.current = setInterval(() => {
      current -= 1;
      setTaskTimerRemaining(Math.max(0, current));
      if (current <= 0) {
        clearInterval(taskTimerIntervalRef.current);
      }
    }, 1000);
  };

  const closeTaskModal = () => {
    clearIntervals();
    setActiveTask(null);
    setTaskStage('IDLE');
    setChallengeToken(null);
  };

  const handleOpenTaskUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleVerifyAndClaim = async () => {
    if (!challengeToken) return;

    if (taskTimerRemaining > 0) {
      showToast(`Please wait ${taskTimerRemaining}s more before claiming`, 'info');
      return;
    }

    setTaskStage('VERIFYING');

    try {
      const res = await api.completeTask(challengeToken);
      setCompletedReward(res.reward);
      setTaskStage('COMPLETED');
      showToast(res.message, 'success');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#f59e0b', '#ffffff'],
        });
      } catch {}

      await reloadUser();
      await fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
      setTaskStage('TASK_ACTIVE');
    }
  };

  const categories: (string | TaskCategory)[] = [
    'All',
    'Website Visit',
    'Social Follow',
    'Social Like',
    'Video Watch',
    'App Install',
  ];

  const filteredTasks = tasks.filter(t => {
    if (activeCategory === 'All') return true;
    return t.category === activeCategory;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header (3D Light Card) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Earning Task Network</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 font-bold shadow-2xs">
              VERIFIED MISSIONS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Complete daily sponsor tasks to earn Coins. All tasks enforce a mandatory 10-second security verification countdown before commencing.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 shadow-2xs">
          <Clock className="w-4 h-4 text-red-500" />
          <span>Mandatory 10s Countdown Enforced</span>
        </div>
      </div>

      {/* Category Tabs (3D Light Buttons) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'btn-3d-red shadow-sm'
                : 'btn-3d-white text-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-200 animate-pulse shadow-xs" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No tasks available in this category</h3>
          <p className="text-xs text-slate-500 mt-1">Check back soon as new creator campaigns are added daily!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => {
            const isCompleted = task.isCompletedByUser;
            return (
              <div
                key={task.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  isCompleted
                    ? 'bg-slate-50/80 border-slate-200 opacity-85'
                    : 'bg-white border-slate-200/90 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {task.category}
                    </span>

                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold shadow-2xs">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>+{task.reward} Coins</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{task.name}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-3">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timer: {task.timer}s</span>
                    </span>
                    <span>10s Countdown</span>
                  </div>

                  {isCompleted ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Reward Collected</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInitiateTask(task)}
                      className="w-full py-2.5 rounded-xl btn-3d-red text-xs font-bold flex items-center justify-center gap-2 group"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Task</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3D LIGHT MANDATORY 10-SECOND COUNTDOWN & SECURE EXECUTION MODAL */}
      {/* ========================================================================= */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 overflow-hidden">
            {/* Top Close Button */}
            <button
              onClick={closeTaskModal}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs"
              title="Cancel and Exit Task"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STAGE 1: MANDATORY 10-SECOND COUNTDOWN */}
            {taskStage === 'COUNTDOWN' && (
              <div className="text-center py-4 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>TASK STARTING</span>
                </div>

                {/* Big Animated 3D Countdown Number */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-4 border-red-200 border-t-red-600 flex items-center justify-center bg-slate-50 shadow-inner animate-spin">
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-slate-900 font-mono tracking-tighter">
                      {countdownRemaining}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest mt-1">
                      SECONDS
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{activeTask.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Mandatory anti-bot and security verification in progress.
                  </p>
                </div>

                {/* STRICT SECURITY WARNING (3D Light Amber Box) */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-3 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-amber-950">CRITICAL SECURITY RULE:</span> If you close this task, leave this page, or cancel before the countdown reaches 0:
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                      <li>Countdown stops immediately</li>
                      <li>Task will NOT start and no reward will be given</li>
                      <li>Reopening restarts the countdown from 10 seconds</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={closeTaskModal}
                  className="w-full py-2.5 rounded-xl btn-3d-white text-xs font-semibold"
                >
                  Cancel and Exit Task
                </button>
              </div>
            )}

            {/* STAGE 2: TASK STARTED & ACTIVE */}
            {(taskStage === 'TASK_ACTIVE' || taskStage === 'VERIFYING') && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-emerald-600 uppercase">
                      TASK STARTED
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold shadow-2xs">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>+{activeTask.reward} Coins</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeTask.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{activeTask.description}</p>
                </div>

                {/* Instructions Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="text-[11px] font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-600" />
                    <span>Instructions</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeTask.instructions || 'Click the link below to visit the target destination. Review the content until the timer elapses, then claim your coins.'}
                  </p>
                </div>

                {/* Target URL Launch Action */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="truncate text-xs text-slate-600 font-mono">
                    {activeTask.url}
                  </div>
                  <button
                    onClick={() => handleOpenTaskUrl(activeTask.url)}
                    className="px-4 py-2 rounded-xl btn-3d-red text-xs font-bold shrink-0 flex items-center gap-1.5"
                  >
                    <span>Visit Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Duration Progress & Timer */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Task Timer Required:</span>
                    <span className={`font-bold ${taskTimerRemaining > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
                      {taskTimerRemaining > 0 ? `${taskTimerRemaining}s remaining` : '✓ Time Requirement Met'}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all duration-1000 shadow-xs"
                      style={{
                        width: `${Math.min(
                          100,
                          ((activeTask.timer - taskTimerRemaining) / Math.max(1, activeTask.timer)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Verification Claim Action */}
                <button
                  disabled={taskTimerRemaining > 0 || taskStage === 'VERIFYING'}
                  onClick={handleVerifyAndClaim}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    taskTimerRemaining > 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-600/30 font-bold active:translate-y-0.5'
                  }`}
                >
                  {taskStage === 'VERIFYING' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Cryptographic Token...</span>
                    </div>
                  ) : taskTimerRemaining > 0 ? (
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Wait {taskTimerRemaining}s To Verify</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Claim {activeTask.reward} Coins</span>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* STAGE 3: COMPLETED SUCCESS */}
            {taskStage === 'COMPLETED' && (
              <div className="text-center py-6 space-y-5 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">Mission Complete!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your reward has been cryptographically validated and added to your balance.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 max-w-xs mx-auto shadow-2xs">
                  <div className="text-[10px] uppercase font-mono text-amber-700 font-bold">CREDITED REWARD</div>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-1 flex items-center justify-center gap-2">
                    <Coins className="w-6 h-6 text-amber-500" />
                    <span>+{completedReward} Coins</span>
                  </div>
                </div>

                <button
                  onClick={closeTaskModal}
                  className="w-full py-3.5 rounded-xl btn-3d-red text-xs font-bold"
                >
                  Back to Tasks
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
