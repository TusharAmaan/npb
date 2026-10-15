import React, { useRef, useState } from 'react';
import { Student, Batch, StudentAnalytics, StudentSyllabus } from '../../types/models';
import { NPBLogo } from '../common/NPBLogo';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, Check, PhoneCall, Calendar } from 'lucide-react';

interface PrintableReportCardProps {
  student: Student;
  batch: Batch;
  analytics: StudentAnalytics;
  syllabus?: StudentSyllabus;
  tutorName?: string;
  whatsappNumber?: string;
}

export const PrintableReportCard: React.FC<PrintableReportCardProps> = ({
  student,
  batch,
  analytics,
  syllabus,
  tutorName = 'Abdullah All Masum',
  whatsappNumber = '01619663933',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [teacherRemarks, setTeacherRemarks] = useState(
    `${student.name} has demonstrated excellent commitment and strong grammatical aptitude. Regular practice of board questions is advised.`
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`NPB_ReportCard_${student.name.replace(/\s+/g, '_')}_${student.publicRollNo}.pdf`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const completedTopicsCount = (syllabus?.topics || []).filter((t) => t.status === 'completed').length;
  const totalTopicsCount = (syllabus?.topics || []).length;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="no-print bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Official Academic Report Card (A4 Printable)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click to generate crisp vector PDF or send to physical printer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* A4 Report Card Container (rendered in clean white for PDF & Print) */}
      <div
        ref={printRef}
        className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 max-w-4xl mx-auto space-y-6 print:shadow-none print:border-none print:p-4"
        style={{ minHeight: '1050px' }}
      >
        {/* Header Block */}
        <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <NPBLogo size={52} />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                NPB ENGLISH CARE
              </h1>
              <p className="text-xs font-bold text-slate-700">
                Academic Performance & Continuous Assessment Report
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>Tutor: <strong>{tutorName}</strong></span>
                <span>•</span>
                <span>WhatsApp: <strong>01619663933</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="font-black text-sm px-3 py-1 bg-slate-100 text-slate-900 rounded-md border border-slate-300 inline-block">
              ROLL: {student.publicRollNo}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Issued: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Student Meta Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold">Student Name</span>
            <strong className="text-sm font-black text-slate-900">{student.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">School / College</span>
            <strong className="font-bold text-slate-800">{student.schoolName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Enrolled Batch</span>
            <strong className="font-bold text-slate-800">{batch.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Class / Year</span>
            <strong className="font-bold text-slate-800">{student.classLevel}</strong>
          </div>
        </div>

        {/* 4 Score KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Overall Score</span>
            <div className="text-2xl font-black text-indigo-700 mt-0.5">
              {analytics.totalPerformanceScore}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Rank #{analytics.rankInBatch} in Batch</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Attendance Rate</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {analytics.attendanceRate}%
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">
              P: {analytics.attendanceStats.present} / {analytics.attendanceStats.total} Classes
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Homework Rate</span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">
              {analytics.homeworkRate}%
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">
              Done: {analytics.homeworkStats.done} / {analytics.homeworkStats.total}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Exam Average</span>
            <div className="text-2xl font-black text-sky-600 mt-0.5">
              {analytics.examAverage}%
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">{analytics.examCount} Tests Taken</span>
          </div>
        </div>

        {/* Individual Syllabus Completion Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b pb-1.5">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">
              Syllabus Progress Breakdown ({completedTopicsCount} / {totalTopicsCount} Topics Completed)
            </h3>
            <span className="text-xs font-bold text-indigo-700">
              {totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0}% Mastered
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {(syllabus?.topics || []).slice(0, 8).map((t) => (
              <div
                key={t.id}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{t.title}</span>
                  <span className="text-[10px] text-slate-400">{t.category}</span>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    t.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'in_progress'
                      ? 'bg-sky-100 text-sky-800'
                      : t.status === 'revision_needed'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Weak Topics / Focus Area */}
        <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 text-xs">
          <span className="font-black uppercase text-red-700 text-[11px] block mb-1">
            Diagnostic Academic Focus Area (&lt;60% Mastery)
          </span>
          {analytics.weakTopics.length === 0 ? (
            <p className="text-slate-600">
              Zero academic weak topics flagged. All tested grammar and comprehension topics maintain satisfactory scores.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">
              {analytics.weakTopics.map((wt, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-red-200 rounded font-bold text-red-700">
                  {wt.topicTitle} ({wt.score}% mastery)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Teacher Remarks Box */}
        <div className="space-y-1 text-xs">
          <span className="font-bold text-slate-700 block">Tutor Remarks & Guidance:</span>
          <textarea
            rows={2}
            value={teacherRemarks}
            onChange={(e) => setTeacherRemarks(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Formal Tutor Signature Block */}
        <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-500">Contact: {whatsappNumber} (WhatsApp)</p>
            <p className="text-slate-400 text-[10px]">Document generated by NPB Academic System</p>
          </div>

          <div className="text-center">
            <div className="font-serif italic text-base font-bold text-slate-900 pb-1 border-b border-slate-900 min-w-[160px]">
              {tutorName}
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
              Authorized Tutor Signature
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
