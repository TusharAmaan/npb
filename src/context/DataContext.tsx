import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Batch,
  BonusLog,
  ClassSession,
  Exam,
  GlobalSettings,
  Homework,
  HomeworkSubmission,
  LectureSheet,
  School,
  Student,
  StudentSyllabus,
  StudentSyllabusTopic,
  SyllabusScheme,
} from '../types/models';
import {
  initialBatches,
  initialBonusLogs,
  initialExams,
  initialGlobalSettings,
  initialHomeworks,
  initialSchools,
  initialSessions,
  initialSheets,
  initialStudents,
  initialSyllabi,
  initialSyllabusSchemes,
} from '../lib/seedData';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

export interface CloudSyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  timestamp: number;
}

interface DataContextType {
  schools: School[];
  batches: Batch[];
  students: Student[];
  syllabi: Record<string, StudentSyllabus>;
  syllabusSchemes: SyllabusScheme[];
  sessions: ClassSession[];
  homeworks: Homework[];
  exams: Exam[];
  sheets: LectureSheet[];
  bonusLogs: BonusLog[];
  settings: GlobalSettings;
  isLoading: boolean;
  lastCloudSyncStatus: CloudSyncStatus | null;

  // Actions
  saveBatch: (batch: Batch) => Promise<void>;
  deleteBatch: (batchId: string) => Promise<void>;
  saveSchool: (school: School) => Promise<void>;
  deleteSchool: (schoolId: string) => Promise<void>;
  saveStudent: (student: Student) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  saveStudentSyllabus: (studentId: string, topics: StudentSyllabusTopic[]) => Promise<void>;
  cloneSyllabus: (fromStudentId: string, toStudentId: string) => Promise<void>;
  saveSyllabusScheme: (scheme: SyllabusScheme) => Promise<void>;
  deleteSyllabusScheme: (schemeId: string) => Promise<void>;
  applySchemeToStudentSyllabi: (scheme: SyllabusScheme) => Promise<void>;
  saveClassSession: (session: ClassSession, targetTopicStatus?: 'in_progress' | 'completed') => Promise<void>;
  deleteClassSession: (sessionId: string) => Promise<void>;
  saveHomework: (homework: Homework) => Promise<void>;
  deleteHomework: (hwId: string) => Promise<void>;
  saveHomeworkSubmission: (homeworkId: string, studentId: string, submission: HomeworkSubmission) => Promise<void>;
  saveExam: (exam: Exam) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  saveLectureSheet: (sheet: LectureSheet) => Promise<void>;
  toggleSheetDistributed: (sheetId: string, studentId: string) => Promise<void>;
  deleteLectureSheet: (sheetId: string) => Promise<void>;
  saveBonusLog: (log: BonusLog) => Promise<void>;
  deleteBonusLog: (logId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<GlobalSettings>) => Promise<void>;

  // Cloud Firestore Sync Engine
  pushAllDataToFirestore: () => Promise<{ success: boolean; count: number; error?: string }>;

  // Data management
  loadDemoData: () => void;
  clearAllData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
  importStudentsCsv: (csvContent: string, targetBatchId?: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'npb_db_';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to load or initialize from localStorage
  const loadLocal = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [schools, setSchools] = useState<School[]>(() => loadLocal('schools', initialSchools));
  const [batches, setBatches] = useState<Batch[]>(() => loadLocal('batches', initialBatches));
  const [students, setStudents] = useState<Student[]>(() => loadLocal('students', initialStudents));
  const [syllabi, setSyllabi] = useState<Record<string, StudentSyllabus>>(() =>
    loadLocal('syllabi', initialSyllabi)
  );
  const [syllabusSchemes, setSyllabusSchemes] = useState<SyllabusScheme[]>(() =>
    loadLocal('syllabusSchemes', initialSyllabusSchemes)
  );
  const [sessions, setSessions] = useState<ClassSession[]>(() => loadLocal('sessions', initialSessions));
  const [homeworks, setHomeworks] = useState<Homework[]>(() => loadLocal('homeworks', initialHomeworks));
  const [exams, setExams] = useState<Exam[]>(() => loadLocal('exams', initialExams));
  const [sheets, setSheets] = useState<LectureSheet[]>(() => loadLocal('sheets', initialSheets));
  const [bonusLogs, setBonusLogs] = useState<BonusLog[]>(() => loadLocal('bonusLogs', initialBonusLogs));
  const [settings, setSettings] = useState<GlobalSettings>(() =>
    loadLocal('settings', initialGlobalSettings)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastCloudSyncStatus, setLastCloudSyncStatus] = useState<CloudSyncStatus | null>(null);

  // Sync to local storage whenever state changes (keeps offline cache always up to date)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'schools', JSON.stringify(schools));
  }, [schools]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'batches', JSON.stringify(batches));
  }, [batches]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'students', JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'syllabi', JSON.stringify(syllabi));
  }, [syllabi]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'syllabusSchemes', JSON.stringify(syllabusSchemes));
  }, [syllabusSchemes]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'sessions', JSON.stringify(sessions));
  }, [sessions]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'homeworks', JSON.stringify(homeworks));
  }, [homeworks]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'exams', JSON.stringify(exams));
  }, [exams]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'sheets', JSON.stringify(sheets));
  }, [sheets]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'bonusLogs', JSON.stringify(bonusLogs));
  }, [bonusLogs]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);

  // Safe bidirectional merge helper: ensures local data (e.g. offline/live entries) is NEVER overwritten or lost
  const mergeCollections = <T extends { id: string }>(localList: T[], remoteList: T[]): T[] => {
    const remoteMap = new Map<string, T>(remoteList.map((item) => [item.id, item]));
    const result: T[] = [];
    const processedIds = new Set<string>();

    for (const remoteItem of remoteList) {
      const localMatch = localList.find((l) => l.id === remoteItem.id);
      if (localMatch) {
        const localTime = (localMatch as any).updatedAt || (localMatch as any).createdAt || 0;
        const remoteTime = (remoteItem as any).updatedAt || (remoteItem as any).createdAt || 0;
        result.push(localTime > remoteTime ? localMatch : remoteItem);
      } else {
        result.push(remoteItem);
      }
      processedIds.add(remoteItem.id);
    }

    // Preserve any item created locally (e.g. on live site while offline) that is not yet in remote Firestore
    for (const localItem of localList) {
      if (!processedIds.has(localItem.id)) {
        result.push(localItem);
      }
    }

    return result;
  };

  // Firestore Real-Time Subscriptions if Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    try {
      const unsubBatches = onSnapshot(
        collection(db, 'batches'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as Batch);
            setBatches((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Batches cloud sync:', err.message)
      );
      const unsubSchools = onSnapshot(
        collection(db, 'schools'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as School);
            setSchools((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Schools cloud sync:', err.message)
      );
      const unsubStudents = onSnapshot(
        collection(db, 'students'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as Student);
            setStudents((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Students cloud sync:', err.message)
      );
      const unsubSessions = onSnapshot(
        collection(db, 'classSessions'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as ClassSession);
            setSessions((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Sessions cloud sync:', err.message)
      );
      const unsubHomeworks = onSnapshot(
        collection(db, 'homeworks'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as Homework);
            setHomeworks((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Homeworks cloud sync:', err.message)
      );
      const unsubExams = onSnapshot(
        collection(db, 'exams'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as Exam);
            setExams((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Exams cloud sync:', err.message)
      );
      const unsubSheets = onSnapshot(
        collection(db, 'lectureSheets'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as LectureSheet);
            setSheets((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Sheets cloud sync:', err.message)
      );
      const unsubSyllabusSchemes = onSnapshot(
        collection(db, 'syllabusSchemes'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as SyllabusScheme);
            setSyllabusSchemes((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Syllabus schemes cloud sync:', err.message)
      );
      const unsubBonus = onSnapshot(
        collection(db, 'bonusLogs'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d: DocumentData) => d.data() as BonusLog);
            setBonusLogs((prev) => mergeCollections(prev, list));
          }
        },
        (err) => console.info('[NPB Data] Bonus logs cloud sync:', err.message)
      );
      const unsubSyllabi = onSnapshot(
        collection(db, 'studentSyllabi'),
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (!snapshot.empty) {
            setSyllabi((prev) => {
              const merged = { ...prev };
              snapshot.docs.forEach((docSnap) => {
                const remoteSyl = docSnap.data() as StudentSyllabus;
                const localSyl = prev[remoteSyl.studentId];
                if (!localSyl || (remoteSyl.updatedAt || 0) >= (localSyl.updatedAt || 0)) {
                  merged[remoteSyl.studentId] = remoteSyl;
                }
              });
              return merged;
            });
          }
        },
        (err) => console.info('[NPB Data] Student syllabi cloud sync:', err.message)
      );

      return () => {
        unsubBatches();
        unsubSchools();
        unsubStudents();
        unsubSessions();
        unsubHomeworks();
        unsubExams();
        unsubSheets();
        unsubSyllabusSchemes();
        unsubBonus();
        unsubSyllabi();
      };
    } catch (err) {
      console.warn('[NPB Firestore] Subscription error:', err);
    }
  }, []);

  // Safe Firestore write helper: recursively sanitizes data to remove any `undefined` values.
  // Firestore Web SDK throws "Unsupported field value: undefined" if any object property is undefined.
  const firestoreSet = async (docRef: any, data: any) => {
    const sanitized = JSON.parse(JSON.stringify(data));
    return await setDoc(docRef, sanitized);
  };

  // --- Push All Data Engine to Cloud Firestore ---
  const pushAllDataToFirestore = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!isFirebaseConfigured || !db) {
      const msg = 'Firebase is not initialized or configured.';
      setLastCloudSyncStatus({ status: 'error', message: msg, timestamp: Date.now() });
      return { success: false, count: 0, error: msg };
    }

    setLastCloudSyncStatus({
      status: 'syncing',
      message: 'Syncing all tables to Google Cloud Firestore...',
      timestamp: Date.now(),
    });

    try {
      let count = 0;

      // 1. Batches
      for (const batch of batches) {
        await firestoreSet(doc(db, 'batches', batch.id), batch);
        count++;
      }

      // 2. Schools
      for (const school of schools) {
        await firestoreSet(doc(db, 'schools', school.id), school);
        count++;
      }

      // 3. Students
      for (const student of students) {
        await firestoreSet(doc(db, 'students', student.id), student);
        count++;
      }

      // 4. Student Syllabi
      for (const [studentId, syl] of Object.entries(syllabi)) {
        await firestoreSet(doc(db, 'studentSyllabi', studentId), syl);
        count++;
      }

      // 5. Class Sessions
      for (const session of sessions) {
        await firestoreSet(doc(db, 'classSessions', session.id), session);
        count++;
      }

      // 6. Homeworks
      for (const hw of homeworks) {
        await firestoreSet(doc(db, 'homeworks', hw.id), hw);
        count++;
      }

      // 7. Exams
      for (const exam of exams) {
        await firestoreSet(doc(db, 'exams', exam.id), exam);
        count++;
      }

      // 8. Lecture Sheets
      for (const sheet of sheets) {
        await firestoreSet(doc(db, 'lectureSheets', sheet.id), sheet);
        count++;
      }

      // 9. Bonus Logs
      for (const log of bonusLogs) {
        await firestoreSet(doc(db, 'bonusLogs', log.id), log);
        count++;
      }

      // 10. Global Settings
      await firestoreSet(doc(db, 'settings', 'global'), settings);
      count++;

      // 11. Syllabus Schemes
      for (const scheme of syllabusSchemes) {
        await firestoreSet(doc(db, 'syllabusSchemes', scheme.id), scheme);
        count++;
      }

      const successMsg = `Successfully pushed ${count} documents across all 11 collections to Cloud Firestore! Refresh Firebase Console to view tables.`;
      console.log(`[NPB Firebase] ${successMsg}`);
      setLastCloudSyncStatus({ status: 'success', message: successMsg, timestamp: Date.now() });
      return { success: true, count };
    } catch (err: any) {
      console.error('[NPB Firebase Push Error]:', err);
      let errMsg = err?.message || 'Permission denied or network failure.';
      if (err?.code === 'permission-denied') {
        errMsg =
          'Permission Denied: Cloud Firestore rejected write request. Please verify you published firestore.rules and signed in with Google as tushar.aman05@gmail.com.';
      }
      setLastCloudSyncStatus({ status: 'error', message: errMsg, timestamp: Date.now() });
      return { success: false, count: 0, error: errMsg };
    }
  };

  // Auto-sync initial data if Firestore is empty and user is logged in as tushar.aman05@gmail.com
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !auth) return;

    const unsubAuth = auth.onAuthStateChanged(async (user: any) => {
      if (user && user.email?.toLowerCase() === 'tushar.aman05@gmail.com' && db) {
        try {
          const snapshot = await getDocs(collection(db, 'batches'));
          if (snapshot.empty && batches.length > 0) {
            console.log('[NPB Firebase] Initial cloud database population triggered for tushar.aman05@gmail.com...');
            await pushAllDataToFirestore();
          }
        } catch (err) {
          console.info('[NPB Firebase] Auto-sync check:', err);
        }
      }
    });

    return () => unsubAuth();
  }, [batches.length]);

  // --- Actions ---

  const saveBatch = async (batch: Batch) => {
    setBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === batch.id);
      return idx >= 0 ? prev.map((b) => (b.id === batch.id ? batch : b)) : [batch, ...prev];
    });
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'batches', batch.id), batch);
      } catch (err: any) {
        console.warn('[NPB Firestore saveBatch]:', err.message);
      }
    }
  };

  const deleteBatch = async (batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'batches', batchId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteBatch]:', err.message);
      }
    }
  };

  const saveSchool = async (school: School) => {
    setSchools((prev) => {
      const idx = prev.findIndex((s) => s.id === school.id);
      return idx >= 0 ? prev.map((s) => (s.id === school.id ? school : s)) : [school, ...prev];
    });
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'schools', school.id), school);
      } catch (err: any) {
        console.warn('[NPB Firestore saveSchool]:', err.message);
      }
    }
  };

  const deleteSchool = async (schoolId: string) => {
    setSchools((prev) => prev.filter((s) => s.id !== schoolId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'schools', schoolId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteSchool]:', err.message);
      }
    }
  };

  const saveStudent = async (student: Student) => {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === student.id);
      return idx >= 0 ? prev.map((s) => (s.id === student.id ? student : s)) : [student, ...prev];
    });
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'students', student.id), student);
      } catch (err: any) {
        console.warn('[NPB Firestore saveStudent]:', err.message);
      }
    }
  };

  const deleteStudent = async (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteStudent]:', err.message);
      }
    }
  };

  const saveStudentSyllabus = async (studentId: string, topics: StudentSyllabusTopic[]) => {
    const updated: StudentSyllabus = {
      studentId,
      updatedAt: Date.now(),
      topics,
    };
    setSyllabi((prev) => ({
      ...prev,
      [studentId]: updated,
    }));
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'studentSyllabi', studentId), updated);
      } catch (err: any) {
        console.warn('[NPB Firestore saveStudentSyllabus]:', err.message);
      }
    }
  };

  const cloneSyllabus = async (fromStudentId: string, toStudentId: string) => {
    const source = syllabi[fromStudentId];
    if (!source || !source.topics) return;
    const clonedTopics: StudentSyllabusTopic[] = source.topics.map((t) => ({
      ...t,
      id: 'top-' + Math.random().toString(36).substring(2, 9),
      status: 'not_started',
      lastTaughtDate: undefined,
      completedDate: undefined,
      missedSessionIds: [],
      examMasteryAvg: undefined,
    }));
    await saveStudentSyllabus(toStudentId, clonedTopics);
  };

  // Critical Module 3 Requirement: Automated Syllabus & Streak Sync on Save Session
  const saveClassSession = async (
    session: ClassSession,
    targetTopicStatus: 'in_progress' | 'completed' = 'completed'
  ) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      return idx >= 0 ? prev.map((s) => (s.id === session.id ? session : s)) : [session, ...prev];
    });

    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'classSessions', session.id), session);
      } catch (err: any) {
        console.warn('[NPB Firestore saveClassSession]:', err.message);
      }
    }

    // Automated Syllabus Sync for Topics Taught
    const taughtTopics = session.topicsTaught || [];
    if (taughtTopics.length > 0) {
      const updatedSyllabi = { ...syllabi };

      Object.entries(session.records).forEach(([stuId, record]) => {
        const studentSyl = updatedSyllabi[stuId];
        if (!studentSyl || !studentSyl.topics) return;

        const isPresent = record.attendance === 'present' || record.attendance === 'late';
        const isAbsentOrExcused = record.attendance === 'absent' || record.attendance === 'excused';

        let modified = false;
        const newTopics = studentSyl.topics.map((t) => {
          if (taughtTopics.includes(t.title)) {
            modified = true;
            if (isPresent) {
              return {
                ...t,
                status: targetTopicStatus,
                lastTaughtDate: session.date,
                completedDate: targetTopicStatus === 'completed' ? session.date : t.completedDate,
              };
            } else if (isAbsentOrExcused) {
              // Absent student: marked as Missed / Pending Makeup!
              const missedIds = t.missedSessionIds || [];
              return {
                ...t,
                status: 'missed_pending_makeup' as const,
                missedSessionIds: missedIds.includes(session.id) ? missedIds : [...missedIds, session.id],
              };
            }
          }
          return t;
        });

        if (modified) {
          updatedSyllabi[stuId] = {
            ...studentSyl,
            updatedAt: Date.now(),
            topics: newTopics,
          };
          if (isFirebaseConfigured && db) {
            try {
              firestoreSet(doc(db, 'studentSyllabi', stuId), updatedSyllabi[stuId]);
            } catch (err: any) {
              console.warn('[NPB Firestore sync syllabus]:', err.message);
            }
          }
        }
      });

      setSyllabi(updatedSyllabi);
    }

    // Automated Syllabus Schemes Topic Progress Sync
    if (session.topicsTaught && session.topicsTaught.length > 0) {
      setSyllabusSchemes((prevSchemes) =>
        prevSchemes.map((sch) => {
          if (sch.targetBatchId !== session.batchId) return sch;
          let schemeChanged = false;
          const updatedTopics = sch.topics.map((top) => {
            const isCovered = session.topicsTaught.some(
              (tc: string) =>
                tc.toLowerCase().trim() === top.title.toLowerCase().trim() ||
                tc.toLowerCase().includes(top.title.toLowerCase()) ||
                top.title.toLowerCase().includes(tc.toLowerCase()) ||
                top.id === tc
            );
            if (isCovered) {
              schemeChanged = true;
              return {
                ...top,
                status: targetTopicStatus,
                lastTaughtDate: session.date,
              };
            }
            return top;
          });
          if (schemeChanged) {
            const updatedSch = { ...sch, topics: updatedTopics, updatedAt: Date.now() };
            if (isFirebaseConfigured && db) {
              try {
                firestoreSet(doc(db, 'syllabusSchemes', sch.id), updatedSch);
              } catch (err: any) {
                console.warn('[NPB Firestore sync scheme topic]:', err.message);
              }
            }
            return updatedSch;
          }
          return sch;
        })
      );
    }

    // Streak update for students
    setStudents((prev) =>
      prev.map((stu) => {
        const record = session.records[stu.id];
        if (!record) return stu;
        if (record.attendance === 'present') {
          return { ...stu, streakCount: (stu.streakCount || 0) + 1 };
        } else if (record.attendance === 'absent') {
          return { ...stu, streakCount: 0 };
        }
        return stu;
      })
    );

    // Automated In-Class Exam / Quiz Sync
    if (session.inClassExam?.hasExam) {
      const examId = session.inClassExam.examId || `exam-quiz-${session.id}`;
      const maxMarks = session.inClassExam.maxMarks || 10;
      const examResults: Record<string, any> = {};

      Object.entries(session.records).forEach(([stuId, rec]) => {
        const isAbsent = rec.attendance === 'absent' || rec.attendance === 'excused';
        const score = rec.inClassQuizScore ?? 0;
        examResults[stuId] = {
          studentId: stuId,
          isAbsent,
          sectionMarks: { 'sec-quiz': score },
          totalObtained: isAbsent ? 0 : score,
          percentage: isAbsent ? 0 : Math.round((score / maxMarks) * 100),
          remarks: rec.remarks,
        };
      });

      const generatedExam: Exam = {
        id: examId,
        batchId: session.batchId,
        title: session.inClassExam.title || `In-Class Quiz: ${session.date}`,
        examDate: session.date,
        scopeType: 'batch_wide',
        status: 'completed',
        sections: [
          {
            id: 'sec-quiz',
            name: session.inClassExam.title || 'In-Class Quiz',
            category: 'Grammar',
            linkedTopicTitles: session.topicsTaught || [],
            maxMarks,
          },
        ],
        totalMaxMarks: maxMarks,
        passMarks: Math.round(maxMarks * 0.4),
        absentPolicy: 'exclude_avg_but_zero_leaderboard',
        results: examResults,
        createdAt: Date.now(),
      };

      setExams((prev) => {
        const idx = prev.findIndex((e) => e.id === examId);
        return idx >= 0 ? prev.map((e) => (e.id === examId ? generatedExam : e)) : [generatedExam, ...prev];
      });

      if (isFirebaseConfigured && db) {
        try {
          await firestoreSet(doc(db, 'exams', examId), generatedExam);
        } catch (err: any) {
          console.warn('[NPB Firestore quiz sync]:', err.message);
        }
      }
    }

    // Automated Assigned Homework Sync
    if (session.assignedHomework?.hasHomework) {
      const hwId = session.assignedHomework.homeworkId || `hw-${session.id}`;
      const generatedHw: Homework = {
        id: hwId,
        batchId: session.batchId,
        title: session.assignedHomework.title || `Homework from ${session.date}`,
        assignedDate: session.date,
        dueDate: session.assignedHomework.dueDate,
        description: session.assignedHomework.description,
        relatedTopics: session.topicsTaught || [],
        targetType: 'whole_batch',
        gradingMode: 'status_only',
        submissions: {},
        createdAt: Date.now(),
      };

      setHomeworks((prev) => {
        const idx = prev.findIndex((h) => h.id === hwId);
        return idx >= 0 ? prev.map((h) => (h.id === hwId ? generatedHw : h)) : [generatedHw, ...prev];
      });

      if (isFirebaseConfigured && db) {
        try {
          await firestoreSet(doc(db, 'homeworks', hwId), generatedHw);
        } catch (err: any) {
          console.warn('[NPB Firestore homework sync]:', err.message);
        }
      }
    }

    // Automated Lecture Sheet Handout Sync
    if (session.distributedSheetIds && session.distributedSheetIds.length > 0) {
      const presentStudentIds = Object.entries(session.records)
        .filter(([_, rec]) => rec.attendance === 'present' || rec.attendance === 'late')
        .map(([stuId]) => stuId);

      if (presentStudentIds.length > 0) {
        setSheets((prev) =>
          prev.map((sh) => {
            if (session.distributedSheetIds?.includes(sh.id)) {
              const currentRec = sh.receivedByStudentIds || [];
              const combined = Array.from(new Set([...currentRec, ...presentStudentIds]));
              const updatedSheet = { ...sh, receivedByStudentIds: combined };
              if (isFirebaseConfigured && db) {
                try {
                  firestoreSet(doc(db, 'lectureSheets', sh.id), updatedSheet);
                } catch (err: any) {
                  console.warn('[NPB Firestore sheet sync]:', err.message);
                }
              }
              return updatedSheet;
            }
            return sh;
          })
        );
      }
    }
  };

  const deleteClassSession = async (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'classSessions', sessionId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteClassSession]:', err.message);
      }
    }
  };

  const saveHomework = async (homework: Homework) => {
    setHomeworks((prev) => {
      const idx = prev.findIndex((h) => h.id === homework.id);
      return idx >= 0 ? prev.map((h) => (h.id === homework.id ? homework : h)) : [homework, ...prev];
    });
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'homeworks', homework.id), homework);
      } catch (err: any) {
        console.warn('[NPB Firestore saveHomework]:', err.message);
      }
    }
  };

  const deleteHomework = async (hwId: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== hwId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'homeworks', hwId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteHomework]:', err.message);
      }
    }
  };

  const saveHomeworkSubmission = async (
    homeworkId: string,
    studentId: string,
    submission: HomeworkSubmission
  ) => {
    setHomeworks((prev) =>
      prev.map((h) => {
        if (h.id !== homeworkId) return h;
        const newSubmissions = {
          ...h.submissions,
          [studentId]: { ...submission, checkedAt: Date.now() },
        };
        const updatedHw = { ...h, submissions: newSubmissions };
        if (isFirebaseConfigured && db) {
          try {
            firestoreSet(doc(db, 'homeworks', h.id), updatedHw);
          } catch (err: any) {
            console.warn('[NPB Firestore saveHomeworkSubmission]:', err.message);
          }
        }
        return updatedHw;
      })
    );
  };

  // Critical Module 5 Requirement: Automated Weak Topic Radar & Syllabus update on Exam Save
  const saveExam = async (exam: Exam) => {
    setExams((prev) => {
      const idx = prev.findIndex((e) => e.id === exam.id);
      return idx >= 0 ? prev.map((e) => (e.id === exam.id ? exam : e)) : [exam, ...prev];
    });
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'exams', exam.id), exam);
      } catch (err: any) {
        console.warn('[NPB Firestore saveExam]:', err.message);
      }
    }

    // Analyze results for Weak Topics (< 60%) and update individual syllabi to Revision Needed
    if (exam.status === 'completed' && exam.sections && exam.results) {
      const updatedSyllabi = { ...syllabi };

      Object.entries(exam.results).forEach(([studentId, res]) => {
        if (res.isAbsent) return;
        const studentSyl = updatedSyllabi[studentId];
        if (!studentSyl || !studentSyl.topics) return;

        let modified = false;
        const newTopics = studentSyl.topics.map((t) => {
          let sectionMarksObtained = 0;
          let sectionMaxMarks = 0;
          let wasTested = false;

          exam.sections.forEach((sec) => {
            if (sec.linkedTopicTitles?.includes(t.title)) {
              wasTested = true;
              sectionMaxMarks += sec.maxMarks || 1;
              sectionMarksObtained += res.sectionMarks[sec.id] ?? 0;
            }
          });

          if (wasTested && sectionMaxMarks > 0) {
            modified = true;
            const percentage = Math.round((sectionMarksObtained / sectionMaxMarks) * 100);
            return {
              ...t,
              examMasteryAvg: percentage,
              status: percentage < 60 ? ('revision_needed' as const) : t.status,
            };
          }
          return t;
        });

        if (modified) {
          updatedSyllabi[studentId] = {
            ...studentSyl,
            updatedAt: Date.now(),
            topics: newTopics,
          };
          if (isFirebaseConfigured && db) {
            try {
              firestoreSet(doc(db, 'studentSyllabi', studentId), updatedSyllabi[studentId]);
            } catch (err: any) {
              console.warn('[NPB Firestore sync exam syllabus]:', err.message);
            }
          }
        }
      });

      setSyllabi(updatedSyllabi);

      // Automated Syllabus Scheme Performance Sync: Flag weak topics as revision_needed if batch average < 60%
      setSyllabusSchemes((prevSchemes) =>
        prevSchemes.map((sch) => {
          if (sch.targetBatchId !== exam.batchId) return sch;
          let changed = false;
          const updatedTopics = sch.topics.map((st) => {
            const matchedSecs = exam.sections?.filter((sec) =>
              sec.linkedTopicTitles?.some(
                (lt) =>
                  lt.toLowerCase().trim() === st.title.toLowerCase().trim() ||
                  lt.toLowerCase().includes(st.title.toLowerCase()) ||
                  st.title.toLowerCase().includes(lt.toLowerCase())
              )
            );
            if (!matchedSecs || matchedSecs.length === 0) return st;

            let totalObtained = 0;
            let totalPossible = 0;
            Object.values(exam.results).forEach((r) => {
              if (r.isAbsent) return;
              matchedSecs.forEach((sec) => {
                totalPossible += sec.maxMarks || 0;
                totalObtained += r.sectionMarks?.[sec.id] || 0;
              });
            });

            if (totalPossible > 0) {
              const avg = Math.round((totalObtained / totalPossible) * 100);
              if (avg < 60 && st.status !== 'revision_needed') {
                changed = true;
                return { ...st, status: 'revision_needed' as const };
              }
            }
            return st;
          });
          if (changed) {
            const updatedSch = { ...sch, topics: updatedTopics, updatedAt: Date.now() };
            if (isFirebaseConfigured && db) {
              try {
                firestoreSet(doc(db, 'syllabusSchemes', sch.id), updatedSch);
              } catch (err: any) {
                console.warn('[NPB Firestore sync exam scheme]:', err.message);
              }
            }
            return updatedSch;
          }
          return sch;
        })
      );
    }
  };

  const deleteExam = async (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'exams', examId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteExam]:', err.message);
      }
    }
  };

  const saveLectureSheet = async (sheet: LectureSheet) => {
    setSheets((prev) => {
      const idx = prev.findIndex((s) => s.id === sheet.id);
      return idx >= 0 ? prev.map((s) => (s.id === sheet.id ? sheet : s)) : [sheet, ...prev];
    });
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'lectureSheets', sheet.id), sheet);
      } catch (err: any) {
        console.warn('[NPB Firestore saveLectureSheet]:', err.message);
      }
    }
  };

  const toggleSheetDistributed = async (sheetId: string, studentId: string) => {
    setSheets((prev) =>
      prev.map((sh) => {
        if (sh.id !== sheetId) return sh;
        const received = sh.receivedByStudentIds || [];
        const isReceived = received.includes(studentId);
        const updated = isReceived
          ? received.filter((id) => id !== studentId)
          : [...received, studentId];
        const updatedSheet = { ...sh, receivedByStudentIds: updated };
        if (isFirebaseConfigured && db) {
          try {
            firestoreSet(doc(db, 'lectureSheets', sh.id), updatedSheet);
          } catch (err: any) {
            console.warn('[NPB Firestore toggleSheetDistributed]:', err.message);
          }
        }
        return updatedSheet;
      })
    );
  };

  const deleteLectureSheet = async (sheetId: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== sheetId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'lectureSheets', sheetId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteLectureSheet]:', err.message);
      }
    }
  };

  const saveBonusLog = async (log: BonusLog) => {
    setBonusLogs((prev) => [log, ...prev]);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === log.studentId
          ? { ...s, manualBonusPoints: (s.manualBonusPoints || 0) + log.points }
          : s
      )
    );
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'bonusLogs', log.id), log);
      } catch (err: any) {
        console.warn('[NPB Firestore saveBonusLog]:', err.message);
      }
    }
  };

  const deleteBonusLog = async (logId: string) => {
    const log = bonusLogs.find((l) => l.id === logId);
    if (log) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === log.studentId
            ? { ...s, manualBonusPoints: Math.max(0, (s.manualBonusPoints || 0) - log.points) }
            : s
        )
      );
    }
    setBonusLogs((prev) => prev.filter((l) => l.id !== logId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'bonusLogs', logId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteBonusLog]:', err.message);
      }
    }
  };

  const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      if (isFirebaseConfigured && db) {
        try {
          firestoreSet(doc(db, 'settings', 'global'), merged);
        } catch (err: any) {
          console.warn('[NPB Firestore updateSettings]:', err.message);
        }
      }
      return merged;
    });
  };

  const saveSyllabusScheme = async (scheme: SyllabusScheme) => {
    setSyllabusSchemes((prev) => {
      const idx = prev.findIndex((s) => s.id === scheme.id);
      return idx >= 0 ? prev.map((s) => (s.id === scheme.id ? scheme : s)) : [scheme, ...prev];
    });
    if (isFirebaseConfigured && db) {
      try {
        await firestoreSet(doc(db, 'syllabusSchemes', scheme.id), scheme);
      } catch (err: any) {
        console.warn('[NPB Firestore saveSyllabusScheme]:', err.message);
      }
    }
  };

  const deleteSyllabusScheme = async (schemeId: string) => {
    setSyllabusSchemes((prev) => prev.filter((s) => s.id !== schemeId));
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'syllabusSchemes', schemeId));
      } catch (err: any) {
        console.warn('[NPB Firestore deleteSyllabusScheme]:', err.message);
      }
    }
  };

  const applySchemeToStudentSyllabi = async (scheme: SyllabusScheme) => {
    const targetStudents = students.filter((stu) => {
      if (!stu.batchIds?.includes(scheme.targetBatchId)) return false;
      if (scheme.scopeType === 'batch_wide') return true;
      if (scheme.scopeType === 'batch_and_schools') {
        return scheme.targetSchoolIds?.includes(stu.schoolId);
      }
      if (scheme.scopeType === 'batch_and_students') {
        return scheme.targetStudentIds?.includes(stu.id);
      }
      return true;
    });

    const updatedSyllabi = { ...syllabi };

    for (const stu of targetStudents) {
      const existing = updatedSyllabi[stu.id]?.topics || [];
      const newTopics: StudentSyllabusTopic[] = scheme.topics.map((st) => {
        const match = existing.find((et) => et.title.toLowerCase().trim() === st.title.toLowerCase().trim());
        if (match) {
          return {
            ...match,
            category: st.unitTitle || match.category,
            priority: st.priority,
            targetDate: st.targetDate || match.targetDate,
            status: match.status === 'not_started' && st.status !== 'not_started' ? st.status : match.status,
          };
        }
        return {
          id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          category: st.unitTitle || 'General Unit',
          title: st.title,
          status: st.status || 'not_started',
          priority: st.priority,
          targetDate: st.targetDate,
          missedSessionIds: [],
          notes: `From syllabus: ${scheme.title}`,
        };
      });

      const extraTopics = existing.filter(
        (et) => !scheme.topics.some((st) => st.title.toLowerCase().trim() === et.title.toLowerCase().trim())
      );

      updatedSyllabi[stu.id] = {
        studentId: stu.id,
        updatedAt: Date.now(),
        topics: [...newTopics, ...extraTopics],
      };

      if (isFirebaseConfigured && db) {
        try {
          await firestoreSet(doc(db, 'studentSyllabi', stu.id), updatedSyllabi[stu.id]);
        } catch (err: any) {
          console.warn('[NPB Firestore sync scheme to student syllabus]:', err.message);
        }
      }
    }

    setSyllabi(updatedSyllabi);
  };

  // --- Seed Data & System Management ---

  const loadDemoData = () => {
    setSchools(initialSchools);
    setBatches(initialBatches);
    setStudents(initialStudents);
    setSyllabi(initialSyllabi);
    setSyllabusSchemes(initialSyllabusSchemes);
    setSessions(initialSessions);
    setHomeworks(initialHomeworks);
    setExams(initialExams);
    setSheets(initialSheets);
    setBonusLogs(initialBonusLogs);
    setSettings(initialGlobalSettings);
  };

  const clearAllData = () => {
    setSchools([]);
    setBatches([]);
    setStudents([]);
    setSyllabi({});
    setSyllabusSchemes([]);
    setSessions([]);
    setHomeworks([]);
    setExams([]);
    setSheets([]);
    setBonusLogs([]);
    setSettings(initialGlobalSettings);
  };

  const exportDatabaseJson = (): string => {
    const fullDb = {
      version: 'NPB-1.0',
      exportedAt: new Date().toISOString(),
      schools,
      batches,
      students,
      syllabi,
      syllabusSchemes,
      sessions,
      homeworks,
      exams,
      sheets,
      bonusLogs,
      settings,
    };
    return JSON.stringify(fullDb, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.schools) setSchools(parsed.schools);
      if (parsed.batches) setBatches(parsed.batches);
      if (parsed.students) setStudents(parsed.students);
      if (parsed.syllabi) setSyllabi(parsed.syllabi);
      if (parsed.syllabusSchemes) setSyllabusSchemes(parsed.syllabusSchemes);
      if (parsed.sessions) setSessions(parsed.sessions);
      if (parsed.homeworks) setHomeworks(parsed.homeworks);
      if (parsed.exams) setExams(parsed.exams);
      if (parsed.sheets) setSheets(parsed.sheets);
      if (parsed.bonusLogs) setBonusLogs(parsed.bonusLogs);
      if (parsed.settings) setSettings(parsed.settings);
      return true;
    } catch (err) {
      console.error('Failed to parse database backup JSON:', err);
      return false;
    }
  };

  const importStudentsCsv = (csvContent: string, targetBatchId?: string): number => {
    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length <= 1) return 0;

    let addedCount = 0;
    const newStudents: Student[] = [];

    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const roll = parts[1] || `R-${100 + i}`;
        const schoolName = parts[2] || 'Dhaka College';
        const classLevel = parts[3] || 'HSC 1st Year';
        const guardianPhone = parts[4] || '01700000000';
        const batchName = parts[5];

        let matchedBatchId = targetBatchId || batches[0]?.id || 'batch-1';
        if (batchName) {
          const foundB = batches.find((b) => b.name.toLowerCase().includes(batchName.toLowerCase()));
          if (foundB) matchedBatchId = foundB.id;
        }

        let matchedSchool = schools.find((s) => s.name.toLowerCase().includes(schoolName.toLowerCase()));
        const schoolId = matchedSchool ? matchedSchool.id : 'sch-gen';

        const newStudent: Student = {
          id: `stu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          publicRollNo: roll,
          name,
          schoolId,
          schoolName: matchedSchool ? matchedSchool.name : schoolName,
          classLevel,
          batchIds: [matchedBatchId],
          guardianPhone,
          shareToken: `npb-${Math.random().toString(36).substring(2, 10)}`,
          joinedAt: Date.now(),
          isActive: true,
          streakCount: 0,
          manualBonusPoints: 0,
        };

        newStudents.push(newStudent);
        addedCount++;
      }
    }

    if (newStudents.length > 0) {
      setStudents((prev) => [...newStudents, ...prev]);
    }
    return addedCount;
  };

  return (
    <DataContext.Provider
      value={{
        schools,
        batches,
        students,
        syllabi,
        syllabusSchemes,
        sessions,
        homeworks,
        exams,
        sheets,
        bonusLogs,
        settings,
        isLoading,
        lastCloudSyncStatus,
        saveBatch,
        deleteBatch,
        saveSchool,
        deleteSchool,
        saveStudent,
        deleteStudent,
        saveStudentSyllabus,
        cloneSyllabus,
        saveSyllabusScheme,
        deleteSyllabusScheme,
        applySchemeToStudentSyllabi,
        saveClassSession,
        deleteClassSession,
        saveHomework,
        deleteHomework,
        saveHomeworkSubmission,
        saveExam,
        deleteExam,
        saveLectureSheet,
        toggleSheetDistributed,
        deleteLectureSheet,
        saveBonusLog,
        deleteBonusLog,
        updateSettings,
        pushAllDataToFirestore,
        loadDemoData,
        clearAllData,
        exportDatabaseJson,
        importDatabaseJson,
        importStudentsCsv,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
