import React from 'react';
import { ExamSection } from '../../types/models';
import { Plus, Trash2, Layers } from 'lucide-react';

interface ExamSectionBuilderProps {
  sections: ExamSection[];
  availableTopics: string[];
  onChange: (sections: ExamSection[]) => void;
}

export const ExamSectionBuilder: React.FC<ExamSectionBuilderProps> = ({
  sections,
  availableTopics,
  onChange,
}) => {
  const handleAddSection = () => {
    const newSection: ExamSection = {
      id: `sec-${Date.now().toString(36)}-${sections.length + 1}`,
      name: `Part ${String.fromCharCode(65 + sections.length)}: Section Name`,
      category: 'Grammar',
      linkedTopicTitles: [],
      maxMarks: 10,
    };
    onChange([...sections, newSection]);
  };

  const handleRemoveSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const handleUpdateSection = (index: number, field: keyof ExamSection, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleToggleLinkedTopic = (index: number, topic: string) => {
    const section = sections[index];
    const current = section.linkedTopicTitles || [];
    const updatedTopics = current.includes(topic)
      ? current.filter((t) => t !== topic)
      : [...current, topic];
    handleUpdateSection(index, 'linkedTopicTitles', updatedTopics);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-bright-lilac" />
          <span>Section-Wise Paper Breakdown ({sections.length} Sections)</span>
        </span>
        <button
          type="button"
          onClick={handleAddSection}
          className="inline-flex items-center gap-1 text-xs font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Paper Section</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Linking syllabus topics to sections powers the automated <strong>Weak Topic Radar</strong> (&lt;60% flags).
      </p>

      {sections.map((sec, idx) => (
        <div
          key={sec.id}
          className="p-3.5 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs"
        >
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <input
              type="text"
              value={sec.name}
              onChange={(e) => handleUpdateSection(idx, 'name', e.target.value)}
              placeholder="e.g. Part A: Modifiers"
              className="flex-1 min-w-[150px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />

            <select
              value={sec.category}
              onChange={(e) => handleUpdateSection(idx, 'category', e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="Grammar">Grammar</option>
              <option value="Reading">Reading</option>
              <option value="Writing">Writing</option>
              <option value="Vocabulary">Vocabulary</option>
              <option value="MCQ">MCQ</option>
              <option value="General">General</option>
            </select>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Max:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={sec.maxMarks}
                onChange={(e) => handleUpdateSection(idx, 'maxMarks', Number(e.target.value))}
                className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center font-bold"
              />
            </div>

            {sections.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveSection(idx)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Linked Syllabus Topics Selector */}
          {availableTopics.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                Linked Syllabus Topics (Tap to toggle):
              </span>
              <div className="flex flex-wrap gap-1">
                {availableTopics.map((topic, tIdx) => {
                  const isLinked = sec.linkedTopicTitles?.includes(topic);
                  return (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => handleToggleLinkedTopic(idx, topic)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                        isLinked
                          ? 'bg-bright-lilac text-white font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
