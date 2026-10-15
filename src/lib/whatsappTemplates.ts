/**
 * WhatsApp Message Templates and Click-to-Chat Link Generators
 * English Tutor: Abdullah All Masum (01619663933)
 */

export function cleanPhoneNumber(phone: string): string {
  // Normalize Bangladeshi phone numbers: 017... -> 88017...
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '88' + cleaned;
  }
  return cleaned;
}

export function createWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
}

export function getReportShareUrl(shareToken: string): string {
  const baseUrl = window.location.href.split('#')[0].replace(/\/+$/, '');
  return `${baseUrl}/#/report/${shareToken}`;
}

export const WhatsAppTemplates = {
  guardianLiveReport(studentName: string, guardianName: string, shareUrl: string): string {
    return `Assalamu Alaikum ${guardianName || 'Guardian'},\n\nHere is the real-time academic report card for ${studentName} from NPB English Care:\n🔗 ${shareUrl}\n\nTrack syllabus progress, exam scores, homework, and attendance anytime.\n\nWarm regards,\nAbdullah All Masum\nEnglish Tutor | NPB\nWhatsApp: 01619663933`;
  },

  attendanceAlert(studentName: string, status: 'absent' | 'late', date: string, batchName: string): string {
    const statusText = status === 'absent' ? 'ABSENT' : 'LATE';
    return `Assalamu Alaikum,\n\nThis is an academic notice from NPB English: ${studentName} was marked *${statusText}* for the ${batchName} session on ${date}.\n\nPlease ensure regular attendance for consistent performance.\n\nRegards,\nAbdullah All Masum\nEnglish Tutor | NPB\nContact: 01619663933`;
  },

  homeworkDefaulterSummary(batchName: string, date: string, defaulterNames: string[], doneCount: number, totalCount: number): string {
    let msg = `*NPB English — Homework Status Log*\n📅 Date: ${date}\n🏷️ Batch: ${batchName}\n📊 Submission Rate: ${doneCount}/${totalCount} students completed.\n\n`;
    if (defaulterNames.length > 0) {
      msg += `⚠️ *Incomplete / Missing Work:*\n${defaulterNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\n`;
      msg += `Students listed above are requested to complete their exercises before the next class.`;
    } else {
      msg += `🎉 Excellent! All attending students submitted their homework today!`;
    }
    msg += `\n\n— Abdullah All Masum (01619663933)`;
    return msg;
  },

  examResultNotification(
    studentName: string,
    examTitle: string,
    obtained: number,
    total: number,
    percentage: number,
    shareUrl: string
  ): string {
    return `Assalamu Alaikum,\n\nExam results for *${examTitle}* (NPB English) are published:\n👤 Student: ${studentName}\n📝 Score: ${obtained}/${total} (${percentage}%)\n\nView the detailed section-wise breakdown and teacher remarks here:\n🔗 ${shareUrl}\n\nRegards,\nAbdullah All Masum\n01619663933`;
  },

  makeupSessionAlert(topicTitle: string, date: string, time: string, studentNames: string[]): string {
    return `📢 *NPB English — Scheduled Makeup Session*\n\nTopic: *${topicTitle}*\n📅 Date: ${date}\n⏰ Time: ${time}\n👥 Invited Students: ${studentNames.join(', ')}\n\nPlease join on time with your lecture sheets.\n\n— Abdullah All Masum (01619663933)`;
  },
};
