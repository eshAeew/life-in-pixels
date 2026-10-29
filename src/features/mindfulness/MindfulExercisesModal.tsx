import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Eye,
  Wind,
  CheckCircle2,
  Volume2,
  VolumeX,
  Compass,
  Award,
  ChevronRight,
  Smile,
} from 'lucide-react';
import { triggerHaptic, triggerExerciseCompletionFeedback } from '../../utils/haptics';
import type { Milestone } from '../../types';

export type ExerciseType = 'breathing' | 'eyes' | 'grounding' | 'stretch';

interface ExerciseDef {
  id: ExerciseType;
  title: string;
  tagline: string;
  durationSeconds: number;
  icon: React.ReactNode;
  phases?: Array<{ name: string; duration: number; prompt: string; color: string; scale: number }>;
}

const EXERCISES: ExerciseDef[] = [
  {
    id: 'breathing',
    title: 'Take a Breath',
    tagline: 'Box breathing to calm your nervous system & restore presence.',
    durationSeconds: 64, // 4 cycles of 16s (4s Inhale, 4s Hold, 4s Exhale, 4s Rest)
    icon: <Wind size={18} />,
    phases: [
      { name: 'Inhale', duration: 4, prompt: 'Inhale gently through your nose', color: '#FFB7B2', scale: 1.35 },
      { name: 'Hold', duration: 4, prompt: 'Hold softly and stay still', color: '#F7D486', scale: 1.35 },
      { name: 'Exhale', duration: 4, prompt: 'Exhale slowly through your mouth', color: '#C8DEC8', scale: 0.85 },
      { name: 'Rest', duration: 4, prompt: 'Rest peacefully before the next breath', color: '#CFCAE4', scale: 0.85 },
    ],
  },
  {
    id: 'eyes',
    title: 'Relax Your Eyes',
    tagline: '20-20-20 rule & ocular muscle ease to soothe digital screen fatigue.',
    durationSeconds: 60,
    icon: <Eye size={18} />,
    phases: [
      { name: 'Look Away', duration: 20, prompt: 'Gaze at something 20 feet (6m) away. Let your focus soften.', color: '#C8DEC8', scale: 1.25 },
      { name: 'Gentle Blinks', duration: 15, prompt: 'Blink slowly and gently 10 times to rehydrate your eyes.', color: '#FFB7B2', scale: 1.0 },
      { name: 'Palming Rest', duration: 25, prompt: 'Close your eyes. Gently cup warm palms over them without pressing.', color: '#CFCAE4', scale: 0.85 },
    ],
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1 Grounding',
    tagline: 'A mindful sensory check-in to anchor yourself in the present moment.',
    durationSeconds: 75,
    icon: <Compass size={18} />,
    phases: [
      { name: '5 Things You See', duration: 18, prompt: 'Notice 5 colors, shapes, or objects around your space right now.', color: '#FFB7B2', scale: 1.15 },
      { name: '4 Things You Feel', duration: 16, prompt: 'Feel 4 physical sensations: your feet on the floor, your sweater, air.', color: '#F7D486', scale: 1.1 },
      { name: '3 Sounds You Hear', duration: 15, prompt: 'Listen carefully for 3 subtle sounds in your room or outdoors.', color: '#C8DEC8', scale: 1.05 },
      { name: '2 Scents You Recall', duration: 14, prompt: 'Notice 2 scents in the air, or picture fresh tea or rainfall.', color: '#CFCAE4', scale: 1.0 },
      { name: '1 Thing You Appreciate', duration: 12, prompt: 'Honor 1 small kindness, breath, or gratitude in this moment.', color: '#FFB7B2', scale: 1.25 },
    ],
  },
  {
    id: 'stretch',
    title: 'Shoulder & Neck Release',
    tagline: 'Release tension stored in your upper body and breathe deeply.',
    durationSeconds: 60,
    icon: <Sparkles size={18} />,
    phases: [
      { name: 'Shoulder Rolls', duration: 20, prompt: 'Roll shoulders slowly backward in big circles, inhaling as you lift.', color: '#F7D486', scale: 1.2 },
      { name: 'Gentle Neck Tilt', duration: 20, prompt: 'Gently tilt right ear toward right shoulder, then smoothly to the left.', color: '#FFB7B2', scale: 1.1 },
      { name: 'Chest Open & Sigh', duration: 20, prompt: 'Interlace fingers behind you, lift your chest, and sigh out stress.', color: '#C8DEC8', scale: 1.25 },
    ],
  },
];

interface MindfulExercisesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExercise?: ExerciseType;
  todayDate: string;
  enableHaptics: boolean;
  onAddMilestone: (milestone: Milestone) => void;
  onNavigateToMilestones?: () => void;
}

export const MindfulExercisesModal: React.FC<MindfulExercisesModalProps> = ({
  isOpen,
  onClose,
  initialExercise = 'breathing',
  todayDate,
  enableHaptics,
  onAddMilestone,
  onNavigateToMilestones,
}) => {
  const [selectedId, setSelectedId] = useState<ExerciseType>(initialExercise);
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [completedAlert, setCompletedAlert] = useState<{
    show: boolean;
    exerciseTitle: string;
    milestoneCreated: Milestone | null;
  }>({ show: false, exerciseTitle: '', milestoneCreated: null });
  const [ambientSound, setAmbientSound] = useState(false);
  const ambientAudioRef = useRef<{
    ctx: AudioContext;
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    gain: GainNode;
  } | null>(null);

  // Stop ambient audio on unmount or close
  useEffect(() => {
    return () => {
      if (ambientAudioRef.current) {
        try {
          ambientAudioRef.current.osc1.stop();
          ambientAudioRef.current.osc2.stop();
          ambientAudioRef.current.ctx.close();
        } catch {}
      }
    };
  }, []);

  const toggleAmbientSound = () => {
    triggerHaptic('light', enableHaptics);
    if (ambientSound) {
      if (ambientAudioRef.current) {
        try {
          const now = ambientAudioRef.current.ctx.currentTime;
          ambientAudioRef.current.gain.gain.setValueAtTime(
            ambientAudioRef.current.gain.gain.value,
            now
          );
          ambientAudioRef.current.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
          setTimeout(() => {
            try {
              ambientAudioRef.current?.osc1.stop();
              ambientAudioRef.current?.osc2.stop();
              ambientAudioRef.current?.ctx.close();
              ambientAudioRef.current = null;
            } catch {}
          }, 350);
        } catch {}
      }
      setAmbientSound(false);
    } else {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(108, ctx.currentTime);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(216, ctx.currentTime);

          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();

          ambientAudioRef.current = { ctx, osc1, osc2, gain };
          setAmbientSound(true);
        }
      } catch {
        setAmbientSound(false);
      }
    }
  };

  // Sync initial exercise if changed
  useEffect(() => {
    if (initialExercise) {
      setSelectedId(initialExercise);
      resetExercise();
    }
  }, [initialExercise, isOpen]);

  const activeDef = EXERCISES.find((e) => e.id === selectedId) || EXERCISES[0];
  const phases = activeDef.phases || [];
  const currentPhase = phases[currentPhaseIndex] || phases[0];

  const resetExercise = () => {
    setIsActive(false);
    setElapsedSeconds(0);
    setCurrentPhaseIndex(0);
    if (phases.length > 0) {
      setPhaseSecondsLeft(phases[0].duration);
    }
  };

  const handleSelectExercise = (id: ExerciseType) => {
    if (id !== selectedId) {
      triggerHaptic('selection', enableHaptics);
      setSelectedId(id);
      setIsActive(false);
      setElapsedSeconds(0);
      setCurrentPhaseIndex(0);
      const newDef = EXERCISES.find((e) => e.id === id);
      if (newDef?.phases && newDef.phases.length > 0) {
        setPhaseSecondsLeft(newDef.phases[0].duration);
      }
    }
  };

  // Timer loop
  useEffect(() => {
    if (!isActive || !isOpen) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prevElapsed) => {
        const nextElapsed = prevElapsed + 1;

        // Check if finished
        if (nextElapsed >= activeDef.durationSeconds) {
          clearInterval(timer);
          setIsActive(false);
          handleCompletion();
          return activeDef.durationSeconds;
        }

        return nextElapsed;
      });

      // Handle phase countdown
      setPhaseSecondsLeft((prevPhaseLeft) => {
        if (prevPhaseLeft <= 1) {
          // Advance phase
          setCurrentPhaseIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % phases.length;
            const nextPhase = phases[nextIndex];
            if (nextPhase) {
              triggerHaptic('light', enableHaptics);
              return nextIndex;
            }
            return 0;
          });
          const nextIndex = (currentPhaseIndex + 1) % phases.length;
          return phases[nextIndex]?.duration || 4;
        }
        return prevPhaseLeft - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isOpen, currentPhaseIndex, phases, activeDef]);

  // Handle completion
  const handleCompletion = () => {
    // 1. Phone vibration & soothing chime
    triggerExerciseCompletionFeedback(enableHaptics);

    // 2. Automatically create and register milestone in life store
    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      date: todayDate,
      title: `Completed ${activeDef.title}`,
      category: 'health',
      description: `Practiced mindful relaxation (${activeDef.title}) for personal calm and presence.`,
      isFutureGoal: false,
      createdAt: new Date().toISOString(),
    };

    onAddMilestone(milestone);

    // 3. Trigger completion alert
    setCompletedAlert({
      show: true,
      exerciseTitle: activeDef.title,
      milestoneCreated: milestone,
    });
  };

  if (!isOpen) return null;

  const totalRemaining = Math.max(0, activeDef.durationSeconds - elapsedSeconds);
  const minutes = Math.floor(totalRemaining / 60);
  const seconds = totalRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Current scale for breathing circle
  const currentScale = isActive ? currentPhase?.scale || 1 : 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mindful Exercises and Relaxation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#FAF9F5] w-full max-w-md rounded-[36px] border border-[#EFECE6] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative">
        {/* Soft pastel watercolor atmosphere background like the screenshot */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-b from-[#FFF5F3] via-[#F6F5EE] to-[#EDF4EE] -z-10" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#F0EEE6]/70">
          <div>
            <span className="font-handwriting text-xl text-[#FFB7B2]">mindful pauses</span>
            <h2 className="text-lg font-bold text-[#292524] tracking-tight">Mindful Rest & Care</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAmbientSound}
              aria-label={ambientSound ? "Mute ambient sound" : "Play ambient sound"}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                ambientSound
                  ? 'bg-[#FFB7B2] border-[#FFB7B2] text-[#292524]'
                  : 'bg-white/80 hover:bg-white border-[#EFECE6] text-[#78716C] hover:text-[#292524]'
              }`}
              title={ambientSound ? "Mute calming ambient tone" : "Play calming ambient tone"}
            >
              {ambientSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light', enableHaptics);
                onClose();
              }}
              aria-label="Close exercises"
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-[#EFECE6] flex items-center justify-center text-[#78716C] hover:text-[#292524] transition-all cursor-pointer shadow-2xs"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Exercise Switcher Tabs */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {EXERCISES.map((ex) => {
            const isSelected = ex.id === selectedId;
            return (
              <button
                key={ex.id}
                onClick={() => handleSelectExercise(ex.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#292524] text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-[#78716C] border border-[#EFECE6]'
                }`}
              >
                <span>{ex.icon}</span>
                <span>{ex.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-6 py-4 flex flex-col items-center justify-between overflow-y-auto no-scrollbar">
          {/* Top Title & Heart Header — Exact aesthetic from right phone in screenshot */}
          <div className="text-center pt-2">
            <h3 className="font-handwriting text-3xl text-[#292524] tracking-wide">
              {activeDef.title}
            </h3>
            <div className="flex justify-center mt-1">
              <Heart size={16} className="text-[#FFB7B2] fill-[#FFB7B2]/30" />
            </div>
            <p className="text-[11px] text-[#78716C] max-w-xs mt-1.5 leading-relaxed mx-auto">
              {activeDef.tagline}
            </p>
          </div>

          {/* Central Visual Interaction — Expanding/Contracting Breathing/Eye Glow Sphere */}
          <div className="relative my-7 w-64 h-64 flex items-center justify-center">
            {/* Concentric ripples */}
            <div
              className="absolute w-60 h-60 rounded-full border border-dashed border-[#FFB7B2]/30 animate-breath-ripple pointer-events-none"
            />

            {/* Ambient outer halo wave */}
            <div
              className="absolute inset-0 rounded-full blur-2xl transition-all duration-1000 opacity-40"
              style={{
                backgroundColor: currentPhase?.color || '#FFB7B2',
                transform: `scale(${currentScale * 1.15})`,
              }}
            />

            {/* Translucent Ring */}
            <div
              className="absolute w-52 h-52 rounded-full border border-[#FFB7B2]/40 transition-transform duration-1000 ease-in-out"
              style={{
                transform: `scale(${currentScale})`,
              }}
            />

            {/* Glowing Center Sphere (Match screenshot coral bubble) */}
            <div
              className="w-36 h-36 rounded-full shadow-lg flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out relative select-none"
              style={{
                background: `radial-gradient(circle, ${currentPhase?.color || '#FFB7B2'} 0%, #FFAAA4 85%, #E59B96 100%)`,
                transform: `scale(${currentScale})`,
                boxShadow: `0 12px 36px -6px ${currentPhase?.color || '#FFB7B2'}80`,
              }}
            >
              {/* Inner soft highlight */}
              <div className="w-2 h-2 rounded-full bg-white/60 blur-[1px] absolute top-7 left-9" />

              <span className="text-xs font-bold uppercase tracking-wider text-[#292524]/90">
                {currentPhase?.name}
              </span>
              <span className="text-3xl font-extrabold text-[#292524] mt-0.5">
                {isActive ? phaseSecondsLeft : activeDef.phases?.[0]?.duration || 4}
              </span>
              <span className="text-[10px] text-[#292524]/75 font-medium">seconds</span>
            </div>
          </div>

          {/* Guidance Prompt & Phase Indicator */}
          <div className="w-full text-center px-4">
            <div className="bg-white/80 rounded-2xl border border-[#EFECE6] p-3.5 shadow-2xs backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFB7B2] block">
                {isActive ? `Step ${currentPhaseIndex + 1} of ${phases.length}` : 'Ready to Begin'}
              </span>
              <p className="text-xs font-medium text-[#292524] mt-1 leading-snug">
                {isActive ? currentPhase?.prompt : 'Press start to begin your peaceful guided session.'}
              </p>
            </div>
          </div>

          {/* Controls Bar & Timer */}
          <div className="w-full pt-5 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#78716C] bg-white/70 px-3 py-1.5 rounded-full border border-[#EFECE6]">
              <span>Time:</span>
              <span className="font-bold text-[#292524]">{formattedTime}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetExercise}
                aria-label="Reset timer"
                className="w-9 h-9 rounded-full bg-white hover:bg-[#FAF9F5] border border-[#EFECE6] text-[#78716C] hover:text-[#292524] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="Reset session"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => {
                  triggerHaptic('medium', enableHaptics);
                  setIsActive((prev) => !prev);
                }}
                className="px-5 py-2.5 rounded-full bg-[#FFB7B2] hover:bg-[#FFA5A0] active:scale-95 text-[#292524] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {isActive ? (
                  <>
                    <Pause size={14} className="fill-[#292524]" /> Pause
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-[#292524]" /> {elapsedSeconds > 0 ? 'Resume' : 'Start'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActive(false);
                  handleCompletion();
                }}
                className="px-3.5 py-2.5 rounded-full bg-white hover:bg-[#FAF9F5] border border-[#EFECE6] text-[11px] font-semibold text-[#7EAE8B] flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Complete exercise and claim milestone"
              >
                <Sparkles size={13} className="text-[#7EAE8B]" /> Complete
              </button>
            </div>
          </div>
        </div>

        {/* COMPLETION ALERT MODAL & MILESTONE REGISTER DIALOG */}
        {completedAlert.show && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Exercise Completed"
            className="absolute inset-0 z-50 bg-[#FAF9F5]/98 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in"
          >
            <div className="w-16 h-16 rounded-full bg-[#E8EFE8] border border-[#C8DEC8] text-[#7EAE8B] flex items-center justify-center shadow-soft mb-3">
              <Sparkles size={30} className="fill-[#7EAE8B]" />
            </div>

            <span className="font-handwriting text-2xl text-[#FFB7B2]">well done</span>
            <h4 className="text-xl font-bold text-[#292524] mt-0.5">
              Exercise Complete!
            </h4>
            <p className="text-xs text-[#78716C] max-w-xs mt-1.5 leading-relaxed">
              You finished <span className="font-semibold text-[#292524]">{completedAlert.exerciseTitle}</span>. Your phone vibrated and a peaceful completion chime was played.
            </p>

            {/* Milestone Added Card */}
            {completedAlert.milestoneCreated && (
              <div className="w-full max-w-sm mt-4 p-3.5 bg-white rounded-2xl border border-[#EFECE6] text-left shadow-2xs">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#7EAE8B] uppercase tracking-wider">
                  <Award size={14} /> Milestone Unlocked & Saved
                </div>
                <div className="text-xs font-bold text-[#292524] mt-1">
                  {completedAlert.milestoneCreated.title}
                </div>
                <p className="text-[11px] text-[#78716C] mt-0.5 leading-relaxed">
                  Permanently archived into your Health milestones on {todayDate}.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2.5 mt-6 w-full max-w-xs">
              {onNavigateToMilestones && (
                <button
                  onClick={() => {
                    setCompletedAlert({ show: false, exerciseTitle: '', milestoneCreated: null });
                    onClose();
                    onNavigateToMilestones();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#EFECE6] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-[#292524] transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Award size={13} className="text-[#FFB7B2]" /> View Milestones
                </button>
              )}

              <button
                onClick={() => {
                  setCompletedAlert({ show: false, exerciseTitle: '', milestoneCreated: null });
                  resetExercise();
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#292524] hover:bg-[#3D3835] text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
