import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  OnlineExam,
  ExamSubmission,
  PassageSubmission,
  PassageGapAnswer,
  McqSubmission,
  PassageSection,
  McqQuestion,
} from '../../../types/models';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Share2,
  Download,
  ArrowRight,
  ShieldAlert,
  Send,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export const StudentExamPortal: React.FC = () => {
  const { examCode } = useParams<{ examCode: string }>();
  const navigate = useNavigate();
  const { onlineExams, submitOnlineExam, batches } = useData();

  // Fast direct exam state & loader
  const [directExam, setDirectExam] = useState<OnlineExam | null>(null);
  const [isExamLoading, setIsExamLoading] = useState<boolean>(true);

  // Find the exam matching either examCode or id (from Context or direct fast query)
  const exam = useMemo(() => {
    if (!examCode) return null;
    const clean = examCode.trim().toLowerCase();
    const fromContext = onlineExams.find(
      (e) =>
        e.examCode.toLowerCase() === clean ||
        e.id.toLowerCase() === clean
    );
    return fromContext || directExam;
  }, [onlineExams, examCode, directExam]);

  // Fast direct Firestore lookup on mount if not immediately present in cache
  useEffect(() => {
    if (exam) {
      setIsExamLoading(false);
      return;
    }
    if (!examCode) {
      setIsExamLoading(false);
      return;
    }

    let isMounted = true;
    const cleanCode = examCode.trim().toUpperCase();

    const fetchFastExam = async () => {
      try {
        if (db) {
          // 1. Direct query by examCode
          const q = query(collection(db, 'onlineExams'), where('examCode', '==', cleanCode));
          const snapshot = await getDocs(q);
          if (!snapshot.empty && isMounted) {
            const fetched = snapshot.docs[0].data() as OnlineExam;
            setDirectExam(fetched);
            setIsExamLoading(false);
            return;
          }

          // 2. Direct lookup by ID
          const docSnap = await getDoc(doc(db, 'onlineExams', examCode.trim()));
          if (docSnap.exists() && isMounted) {
            setDirectExam(docSnap.data() as OnlineExam);
            setIsExamLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Fast exam fetch notice:', err);
      }

      // If not resolved after 2.5s, finish loading so user sees fallback
      setTimeout(() => {
        if (isMounted) setIsExamLoading(false);
      }, 2500);
    };

    fetchFastExam();

    return () => {
      isMounted = false;
    };
  }, [examCode, exam]);

  // Exam phase
  const [phase, setPhase] = useState<'welcome' | 'taking' | 'submitted'>('welcome');

  // Student Identity
  const [studentName, setStudentName] = useState<string>('');
  const [studentMobile, setStudentMobile] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [rememberedProfile, setRememberedProfile] = useState<{
    name: string;
    mobile: string;
    classLevel?: string;
  } | null>(null);

  // Active Answers State
  // passageAnswers: passageId -> { gapId: string }
  const [passageAnswers, setPassageAnswers] = useState<Record<string, Record<string, string>>>({});
  // mcqAnswers: questionId -> string[] (selected option ids)
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string[]>>({});

  // Interactive Drag & Drop / Tap to place state for clues
  const [selectedClueWord, setSelectedClueWord] = useState<{
    passageId: string;
    word: string;
  } | null>(null);

  // Proctoring / Security
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState<boolean>(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [examStartTime, setExamStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Completed Submission Record
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Canvas ref for score image generation
  const scorecardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scorecardImageUrl, setScorecardImageUrl] = useState<string | null>(null);

  // 1. Load remembered student profile on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('npb_student_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.mobile) {
          setRememberedProfile(parsed);
          setStudentName(parsed.name);
          setStudentMobile(parsed.mobile);
          if (parsed.classLevel) setStudentClass(parsed.classLevel);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Use remembered profile shortcut
  const handleUseRememberedProfile = () => {
    if (rememberedProfile) {
      setStudentName(rememberedProfile.name);
      setStudentMobile(rememberedProfile.mobile);
      if (rememberedProfile.classLevel) setStudentClass(rememberedProfile.classLevel);
    }
  };

  // 2. Tab switch detection
  useEffect(() => {
    if (phase !== 'taking' || !exam) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;

          if (exam.tabSwitchPenalty === 'auto_submit') {
            alert('⚠️ Tab switch detected! Your exam is being submitted automatically.');
            handleSubmitExamFinal(nextCount);
          } else if (exam.tabSwitchPenalty === 'reset_exam') {
            alert(
              '⚠️ Tab switch detected! / সতর্কতা: ট্যাব পরিবর্তনের কারণে আপনার পরীক্ষার উত্তরপত্র রিসেট করা হলো।'
            );
            setPassageAnswers({});
            setMcqAnswers({});
          } else {
            setShowTabSwitchWarning(true);
          }

          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase, exam]);

  // 3. Countdown Timer
  useEffect(() => {
    if (phase !== 'taking' || !exam || exam.durationMinutes <= 0) return;

    if (timeRemainingSeconds <= 0) {
      alert('⏰ Time is up! / পরীক্ষার নির্ধারিত সময় শেষ। Your exam is being submitted.');
      handleSubmitExamFinal(tabSwitchCount);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeRemainingSeconds, exam]);

  // Start Exam
  const handleStartExam = () => {
    if (!studentName.trim()) {
      alert('Please enter your full name to start the exam.');
      return;
    }
    if (!studentMobile.trim() || studentMobile.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 11-digit mobile phone number.');
      return;
    }

    // Remember in localStorage for next time
    try {
      localStorage.setItem(
        'npb_student_profile',
        JSON.stringify({
          name: studentName.trim(),
          mobile: studentMobile.trim(),
          classLevel: studentClass.trim() || 'HSC/SSC',
        })
      );
    } catch {
      // Ignore
    }

    if (exam && exam.durationMinutes > 0) {
      setTimeRemainingSeconds(exam.durationMinutes * 60);
    }

    setExamStartTime(Date.now());
    setPhase('taking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update Passage Gap Answer
  const handlePassageGapChange = (passageId: string, gapId: string, value: string) => {
    setPassageAnswers((prev) => ({
      ...prev,
      [passageId]: {
        ...(prev[passageId] || {}),
        [gapId]: value,
      },
    }));
  };

  // Clue Tap / Drop onto gap box
  const handlePlaceClueIntoGap = (passageId: string, gapId: string, word: string) => {
    handlePassageGapChange(passageId, gapId, word);
    setSelectedClueWord(null);
  };

  // MCQ selection toggle
  const handleToggleMcqOption = (question: McqQuestion, optionId: string) => {
    setMcqAnswers((prev) => {
      const current = prev[question.id] || [];
      if (question.allowMultiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [question.id]: next };
      } else {
        return { ...prev, [question.id]: [optionId] };
      }
    });
  };

  // Auto-grade and finalize submission
  const handleSubmitExamFinal = async (finalTabSwitches = tabSwitchCount) => {
    if (!exam || isSubmitting) return;
    setIsSubmitting(true);

    const now = Date.now();
    const timeSpent = Math.max(1, Math.round((now - (examStartTime || now)) / 1000));

    let totalMarksObtained = 0;
    const passageSubmissions: Record<string, PassageSubmission> = {};

    // 1. Grade Passages
    exam.passages.forEach((p) => {
      let pScore = 0;
      let pMax = 0;
      const gapAnswers: Record<string, PassageGapAnswer> = {};

      p.gaps.forEach((g) => {
        pMax += g.marks || 1;
        const rawAns = passageAnswers[p.id]?.[g.id] || '';
        const cleanedAns = rawAns.trim().toLowerCase();

        // Check if cleaned answer matches any accepted answers
        const isMatch = g.acceptedAnswers.some((acc) => acc.trim().toLowerCase() === cleanedAns);

        const marksObtained = isMatch ? g.marks || 1 : 0;
        pScore += marksObtained;

        gapAnswers[g.id] = {
          gapId: g.id,
          studentAnswer: rawAns,
          isCorrect: isMatch,
          marksObtained,
          maxMarks: g.marks || 1,
        };
      });

      totalMarksObtained += pScore;
      passageSubmissions[p.id] = {
        passageId: p.id,
        passageScore: pScore,
        passageMaxMarks: pMax,
        answers: gapAnswers,
      };
    });

    // 2. Grade MCQs
    const mcqSubmissions: Record<string, McqSubmission> = {};
    exam.mcqs.forEach((q) => {
      const selected = mcqAnswers[q.id] || [];
      const correctSet = new Set(q.correctOptionIds);
      const isCorrect =
        selected.length === q.correctOptionIds.length &&
        selected.every((id) => correctSet.has(id));

      const marksObtained = isCorrect ? q.marks || 1 : 0;
      totalMarksObtained += marksObtained;

      mcqSubmissions[q.id] = {
        questionId: q.id,
        selectedOptionIds: selected,
        isCorrect,
        marksObtained,
        maxMarks: q.marks || 1,
      };
    });

    const percentage =
      exam.totalMarks > 0 ? Math.round((totalMarksObtained / exam.totalMarks) * 100) : 0;
    const isPassed = totalMarksObtained >= exam.passMarks;

    const submission: ExamSubmission = {
      id: `sub-${exam.id}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      examId: exam.id,
      examCode: exam.examCode,
      batchId: exam.batchIds?.[0],
      studentName: studentName.trim(),
      studentMobile: studentMobile.trim(),
      studentClass: studentClass.trim() || undefined,
      passageSubmissions,
      mcqSubmissions,
      totalMarksObtained,
      totalPossibleMarks: exam.totalMarks,
      percentage,
      isPassed,
      tabSwitchCount: finalTabSwitches,
      timeSpentSeconds: timeSpent,
      startedAt: examStartTime || now,
      submittedAt: now,
    };

    // Save to Firestore and local state
    await submitOnlineExam(submission);
    setSubmissionResult(submission);
    setPhase('submitted');
    setIsSubmitting(false);

    // Generate Canvas scorecard
    setTimeout(() => {
      generateScorecardImage(submission);
    }, 400);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate lightweight client-side Canvas scorecard
  const generateScorecardImage = (sub: ExamSubmission) => {
    const canvas = scorecardCanvasRef.current;
    if (!canvas || !exam) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 620;

    // Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1000, 620);
    bgGradient.addColorStop(0, '#0f172a'); // slate-900
    bgGradient.addColorStop(1, '#1e1b4b'); // indigo-950
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1000, 620);

    // Gold/Amber border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 960, 580);

    // Inner subtle glow border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(32, 32, 936, 556);

    // Header: Academy Brand
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOBO PROTTASHAY BATCH (NPB) ACADEMIC CARE', 500, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText('OFFICIAL ONLINE EXAMINATION SCORECARD', 500, 110);

    // Divider
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 130);
    ctx.lineTo(850, 130);
    ctx.stroke();

    // Student Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.fillText(sub.studentName, 500, 185);

    // Exam Title & Subject
    ctx.fillStyle = '#38bdf8'; // sky-400
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.fillText(`${exam.subject} — ${exam.title}`, 500, 225);

    // Score Circle Box
    const scoreBoxY = 260;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(250, scoreBoxY, 500, 170);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.strokeRect(250, scoreBoxY, 500, 170);

    // Big Score
    ctx.fillStyle = '#10b981'; // emerald-400
    ctx.font = 'bold 64px Inter, system-ui, sans-serif';
    ctx.fillText(`${sub.totalMarksObtained} / ${sub.totalPossibleMarks}`, 500, scoreBoxY + 80);

    // Percentage & Grade
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 26px Inter, system-ui, sans-serif';
    const grade =
      sub.percentage >= 80
        ? 'A+ (Distinction)'
        : sub.percentage >= 70
        ? 'A (Excellent)'
        : sub.percentage >= 60
        ? 'A- (Good)'
        : sub.percentage >= 50
        ? 'Pass'
        : 'Needs Improvement';
    ctx.fillText(`${sub.percentage}% Marks — ${grade}`, 500, scoreBoxY + 130);

    // Footer info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '15px Inter, system-ui, sans-serif';
    const mins = Math.floor(sub.timeSpentSeconds / 60);
    const secs = sub.timeSpentSeconds % 60;
    const dateStr = new Date(sub.submittedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    ctx.fillText(
      `⏱️ Time Taken: ${mins}m ${secs}s   •   📅 Date: ${dateStr}   •   Code: ${exam.examCode}`,
      500,
      480
    );

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText('Verified & Authenticated by NPB Assessment Engine', 500, 550);

    // Convert to Image URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setScorecardImageUrl(dataUrl);
    } catch {
      // Ignore
    }
  };

  // Download scorecard PNG
  const handleDownloadScorecard = () => {
    if (!scorecardImageUrl) return;
    const a = document.createElement('a');
    a.href = scorecardImageUrl;
    a.download = `NPB_Scorecard_${studentName.replace(/\s+/g, '_')}_${exam?.examCode}.png`;
    a.click();
  };

  // Share score on WhatsApp / Facebook
  const handleShareOnWhatsApp = () => {
    if (!submissionResult || !exam) return;
    const text = `🎉 I scored ${submissionResult.totalMarksObtained}/${submissionResult.totalPossibleMarks} (${submissionResult.percentage}%) on "${exam.title}" at Nobo Prottashay Batch (NPB)! 🎯`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareOnFacebook = () => {
    if (!exam) return;
    const shareUrl = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  // Fast Loading State
  if (isExamLoading && !exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121216] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Loading Exam...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to NPB Assessment Engine</p>
      </div>
    );
  }

  // If exam not found
  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121216] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1e1e24] p-8 rounded-3xl border border-slate-200 dark:border-white/10 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Exam Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The exam link <code className="font-mono text-amber-500 font-bold">{examCode}</code> does not exist or has expired. Please verify with your tutor on WhatsApp.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // If exam is deactivated
  if (!exam.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121216] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1e1e24] p-8 rounded-3xl border border-slate-200 dark:border-white/10 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Exam Currently Closed</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This exam &quot;{exam.title}&quot; is currently closed or has reached its submission deadline.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Answered questions counter
  const totalQuestionsCount =
    exam.passages.reduce((acc, p) => acc + p.gaps.length, 0) + exam.mcqs.length;

  const answeredGapsCount = exam.passages.reduce((acc, p) => {
    const pAns = passageAnswers[p.id] || {};
    return acc + Object.values(pAns).filter((v) => v.trim().length > 0).length;
  }, 0);

  const answeredMcqCount = exam.mcqs.filter((q) => (mcqAnswers[q.id] || []).length > 0).length;
  const totalAnsweredCount = answeredGapsCount + answeredMcqCount;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-base text-slate-900 dark:text-slate-100 pb-24">
      {/* Hidden Canvas for Scorecard */}
      <canvas ref={scorecardCanvasRef} className="hidden" />

      {/* -------------------------------------------------------------
          PHASE 1: WELCOME & VERIFICATION SCREEN (CLEAN, MODERN, UNCLUTTERED)
         ------------------------------------------------------------- */}
      {phase === 'welcome' && (
        <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6">
          <div className="w-full max-w-xl bg-white dark:bg-[#1e1e24] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </span>
                <div>
                  <span className="text-[11px] font-black tracking-wider uppercase text-amber-500 block">
                    Nobo Prottashay Batch (NPB)
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {exam.title}
                  </h1>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono shrink-0">
                {exam.examCode}
              </span>
            </div>

            {/* Clean Exam Meta Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Subject
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                  {exam.subject}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Marks
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {exam.totalMarks} Marks
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Time Limit
                </span>
                <span className="text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400 mt-0.5 block">
                  {exam.durationMinutes > 0 ? `${exam.durationMinutes} Mins` : 'Untimed'}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pass Mark
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {exam.passMarks} Marks
                </span>
              </div>
            </div>

            {/* Questions Summary Strip */}
            {totalQuestionsCount > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Questions:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {totalQuestionsCount} items
                  </strong>{' '}
                  ({exam.mcqs.length > 0 ? `${exam.mcqs.length} MCQs` : ''}
                  {exam.mcqs.length > 0 && exam.passages.length > 0 ? ' + ' : ''}
                  {exam.passages.length > 0
                    ? `${exam.passages.reduce((a, b) => a + b.gaps.length, 0)} blanks`
                    : ''}
                  )
                </span>
                {exam.showScoreImmediately && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Instant Result</span>
                  </span>
                )}
              </div>
            )}

            {/* Sleek Anti-Cheat Security Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-900 dark:text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <div className="font-extrabold text-amber-700 dark:text-amber-400">
                  Tab-Switch Monitoring Active (কঠোর সতর্কতা)
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Please stay on this tab during the test. Switching apps or tabs is recorded and will auto-submit or reset your exam.
                </p>
              </div>
            </div>

            {/* Student Verification Form (NO Class / College / School) */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Student Verification
                </label>
                {rememberedProfile && (
                  <button
                    type="button"
                    onClick={handleUseRememberedProfile}
                    className="text-[11px] text-amber-500 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-fill: {rememberedProfile.name}</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name (e.g. Tanzim Ahmed)"
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={studentMobile}
                  onChange={(e) => setStudentMobile(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Used to link your score to your report card & leaderboard
                </span>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartExam}
              className="w-full py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Start Exam {exam.durationMinutes > 0 ? `(${exam.durationMinutes} Mins)` : ''}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          PHASE 2: ACTIVE EXAM SCREEN
         ------------------------------------------------------------- */}
      {phase === 'taking' && (
        <div className="max-w-4xl mx-auto pt-4 px-3 sm:px-6 space-y-6">
          {/* Sticky Header Strip */}
          <div className="sticky top-2 z-30 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-dark-border p-3 sm:p-4 shadow-md flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {studentName} ({exam.examCode})
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block max-w-xs sm:max-w-md">
                {exam.title}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Progress Count */}
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Progress
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {totalAnsweredCount} / {totalQuestionsCount} Answered
                </span>
              </div>

              {/* Countdown Timer */}
              {exam.durationMinutes > 0 && (
                <div
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-black text-xs sm:text-sm ${
                    timeRemainingSeconds < 120
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    {String(Math.floor(timeRemainingSeconds / 60)).padStart(2, '0')}:
                    {String(timeRemainingSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to finalize and submit your exam paper?')) {
                    handleSubmitExamFinal();
                  }
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-black bg-weird-green hover:bg-wintergreen text-slate-950 shadow-md transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </div>

          {/* Tab Switch Warning Modal / Banner */}
          {showTabSwitchWarning && (
            <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-950 border-2 border-red-500 text-red-900 dark:text-red-200 flex items-start justify-between gap-3 shadow-lg">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">
                    Warning: Tab switch detected! (Total switches: {tabSwitchCount})
                  </p>
                  <p className="text-[11px] text-red-800 dark:text-red-300">
                    Leaving the exam page has been recorded and logged to the tutor&apos;s database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTabSwitchWarning(false)}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* SECTION 1: PASSAGES (FILL IN THE BLANKS) */}
          {exam.passages.map((passage, pIndex) => {
            const currentPAnswers = passageAnswers[passage.id] || {};

            return (
              <div
                key={passage.id}
                className="bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border p-5 sm:p-7 shadow-xs space-y-5"
              >
                {/* Passage Header */}
                <div className="border-b border-slate-100 dark:border-dark-border pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center">
                        {pIndex + 1}
                      </span>
                      <span>{passage.title}</span>
                    </h2>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {passage.passageType === 'with_clues'
                        ? 'With Clues (Box)'
                        : 'Without Clues (Direct Grammar)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic leading-relaxed">
                    {passage.instructions}
                  </p>
                </div>

                {/* CLUE BANK (When passageType === 'with_clues') */}
                {passage.passageType === 'with_clues' && passage.clues.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border-2 border-dashed border-amber-300 dark:border-amber-800/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Clue Box (Drag & Drop or Tap to Place in Answer Box):</span>
                      </span>
                      {selectedClueWord?.passageId === passage.id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                          Selected: &quot;{selectedClueWord.word}&quot; (Now tap a gap box below)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {passage.clues.map((word, wIdx) => {
                        const isSelected =
                          selectedClueWord?.passageId === passage.id &&
                          selectedClueWord?.word === word;

                        return (
                          <div
                            key={wIdx}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', word);
                            }}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedClueWord(null);
                              } else {
                                setSelectedClueWord({ passageId: passage.id, word });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer select-none transition-all shadow-2xs border ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-500/40 scale-105'
                                : 'bg-white dark:bg-dark-surface border-amber-200 dark:border-amber-900/40 text-slate-800 dark:text-slate-200 hover:border-amber-500 hover:scale-102'
                            }`}
                          >
                            {word}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PASSAGE TEXT DISPLAY */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 leading-loose text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 text-justify">
                  {passage.passageText}
                </div>

                {/* NUMBERED ANSWER BOXES (a) to (j) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      Write your answers in the corresponding boxes:
                    </span>
                    {passage.hasFormChange && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                        * You may need to change word forms (e.g. nature → natural)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {passage.gaps.map((gap) => {
                      const value = currentPAnswers[gap.id] || '';

                      return (
                        <div
                          key={gap.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const droppedWord = e.dataTransfer.getData('text/plain');
                            if (droppedWord) {
                              handlePlaceClueIntoGap(passage.id, gap.id, droppedWord);
                            }
                          }}
                          onClick={() => {
                            if (selectedClueWord && selectedClueWord.passageId === passage.id) {
                              handlePlaceClueIntoGap(passage.id, gap.id, selectedClueWord.word);
                            }
                          }}
                          className={`p-2 rounded-xl border transition-all ${
                            selectedClueWord && selectedClueWord.passageId === passage.id
                              ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 cursor-pointer'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-black text-slate-400 mb-1">
                            <span className="text-amber-600 dark:text-amber-400">
                              {gap.gapLabel}
                            </span>
                            <span className="text-[10px] text-slate-400">{gap.marks}m</span>
                          </div>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              handlePassageGapChange(passage.id, gap.id, e.target.value)
                            }
                            placeholder="Type or drop word..."
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* SECTION 2: MULTIPLE CHOICE QUESTIONS (MCQ) */}
          {exam.mcqs.length > 0 && (
            <div className="bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border p-5 sm:p-7 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Section: Multiple Choice Questions (MCQ)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select the best answer for each question. No negative marking.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300">
                  {exam.mcqs.length} Questions
                </span>
              </div>

              <div className="space-y-6">
                {exam.mcqs.map((q, qIdx) => {
                  const selected = mcqAnswers[q.id] || [];

                  return (
                    <div
                      key={q.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-start gap-2">
                          <span className="w-5 h-5 rounded-md bg-sky-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <span>{q.question}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">
                          {q.marks} mark{q.marks > 1 ? 's' : ''}
                        </span>
                      </div>

                      {q.allowMultiple && (
                        <span className="text-[10px] font-black text-sky-600 dark:text-spiro-disco-ball block">
                          * Multiple options can be correct
                        </span>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const isChosen = selected.includes(opt.id);

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleToggleMcqOption(q, opt.id)}
                              className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-2.5 ${
                                isChosen
                                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                                  : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border ${
                                  isChosen
                                    ? 'bg-white text-sky-700 border-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Submit Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-lg flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Ready to submit?
              </span>
              <span className="text-[11px] text-slate-400">
                You answered {totalAnsweredCount} of {totalQuestionsCount} questions.
              </span>
            </div>

            <button
              onClick={() => {
                if (confirm('Are you ready to submit your exam paper?')) {
                  handleSubmitExamFinal();
                }
              }}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-black bg-weird-green hover:bg-wintergreen text-slate-950 shadow-md transition-transform active:scale-95 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Finalize & Submit Exam'}</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          PHASE 3: INSTANT RESULTS & SHAREABLE SCORECARD
         ------------------------------------------------------------- */}
      {phase === 'submitted' && submissionResult && (
        <div className="max-w-3xl mx-auto pt-8 px-4 sm:px-6 space-y-6">
          {/* Result Banner */}
          <div className="bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border p-6 sm:p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-wintergreen flex items-center justify-center mx-auto">
              <Award className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Exam Paper Submitted Successfully!
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Well Done, {submissionResult.studentName}!
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Your answers have been synchronized and permanently recorded in your tutor&apos;s database.
              </p>
            </div>

            {/* Score Display Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-sky-500/10 border border-slate-200 dark:border-dark-border max-w-md mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Obtained Score
              </span>
              <div className="flex items-baseline justify-center gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                  {submissionResult.totalMarksObtained}
                </span>
                <span className="text-lg font-bold text-slate-400">
                  / {submissionResult.totalPossibleMarks}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                  {submissionResult.percentage}% Marks
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    submissionResult.isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {submissionResult.isPassed ? 'Passed' : 'Needs Retake'}
                </span>
              </div>
            </div>

            {/* Action Bar: Download Scorecard & Social Share */}
            <div className="pt-2 space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                Share Your Exam Achievement:
              </span>

              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                {scorecardImageUrl && (
                  <button
                    onClick={handleDownloadScorecard}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:opacity-90"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official Scorecard</span>
                  </button>
                )}

                <button
                  onClick={handleShareOnWhatsApp}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  onClick={handleShareOnFacebook}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on Facebook</span>
                </button>
              </div>

              {/* Preview Scorecard Image */}
              {scorecardImageUrl && (
                <div className="pt-4 max-w-lg mx-auto">
                  <img
                    src={scorecardImageUrl}
                    alt="Official Scorecard Preview"
                    className="w-full rounded-2xl border border-slate-200 dark:border-dark-border shadow-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* DETAILED ANSWER KEY REVIEW (If tutor enabled solutions) */}
          {exam.showSolutionsImmediately ? (
            <div className="bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 dark:border-dark-border pb-3">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Detailed Answer Review & Solutions
                </h3>
                <p className="text-xs text-slate-400">
                  Review your answers gap-by-gap and question-by-question against the tutor&apos;s answer key.
                </p>
              </div>

              {/* Passages Review */}
              {exam.passages.map((passage, pIdx) => {
                const subP = submissionResult.passageSubmissions?.[passage.id];

                return (
                  <div key={passage.id} className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-800 dark:text-slate-200">
                        {pIdx + 1}. {passage.title}
                      </span>
                      <span className="text-emerald-600 dark:text-wintergreen">
                        Score: {subP?.passageScore || 0} / {subP?.passageMaxMarks || 0}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {passage.gaps.map((gap) => {
                        const gapAns = subP?.answers?.[gap.id];
                        const isCorrect = gapAns?.isCorrect;

                        return (
                          <div
                            key={gap.id}
                            className={`p-3 rounded-xl border text-xs ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className="text-slate-700 dark:text-slate-300">
                                Gap {gap.gapLabel}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-black ${
                                  isCorrect ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Correct (+{gap.marks}m)</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Incorrect (0m)</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              Your Answer:{' '}
                              <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                                {gapAns?.studentAnswer || '(Empty)'}
                              </strong>
                            </p>

                            {!isCorrect && (
                              <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                                Accepted Answer(s): {gap.acceptedAnswers.join(' / ')}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* MCQ Review */}
              {exam.mcqs.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border">
                  <h4 className="text-xs font-black uppercase text-slate-400">
                    Multiple Choice Questions Review
                  </h4>

                  <div className="space-y-2.5">
                    {exam.mcqs.map((q, idx) => {
                      const subM = submissionResult.mcqSubmissions?.[q.id];
                      const isCorrect = subM?.isCorrect;

                      return (
                        <div
                          key={q.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {idx + 1}. {q.question}
                            </span>
                            <span
                              className={`text-[11px] font-black shrink-0 ${
                                isCorrect ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {isCorrect ? `+${q.marks}m` : '0m'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            Your Choice:{' '}
                            <strong>
                              {q.options
                                .filter((opt) => subM?.selectedOptionIds?.includes(opt.id))
                                .map((o) => `${o.label}. ${o.text}`)
                                .join(', ') || '(None)'}
                            </strong>
                          </p>

                          {!isCorrect && (
                            <p className="text-[11px] text-emerald-800 dark:text-wintergreen font-bold">
                              Correct Choice:{' '}
                              {q.options
                                .filter((opt) => q.correctOptionIds.includes(opt.id))
                                .map((o) => `${o.label}. ${o.text}`)
                                .join(', ')}
                            </p>
                          )}

                          {q.explanation && (
                            <p className="text-[10px] text-slate-500 italic mt-1">
                              Explanation: {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              Detailed solutions are currently hidden by the tutor. They will be revealed once the whole batch completes the exam.
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
