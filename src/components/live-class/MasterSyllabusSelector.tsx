import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Plus,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Layers,
} from 'lucide-react';

export interface SyllabusCategory {
  unitTitle: string;
  badgeColor: string;
  topics: string[];
}

export const MASTER_ENGLISH_SYLLABUS: SyllabusCategory[] = [
  {
    unitTitle: 'Unit 1: English 2nd Paper Grammar Core',
    badgeColor: 'bg-light-indigo/15 text-light-indigo dark:text-spiro-disco-ball border-light-indigo/20',
    topics: [
      'Modifiers (Pre & Post Modifiers)',
      'Narration (Direct & Indirect Speech)',
      'Right Form of Verbs',
      'Special Phrases (was born, would rather, had better, let alone)',
      'Completing Sentences (Clauses & Conditionals)',
      'Use of Prepositions & Phrasal Verbs',
      'Sentence Connectors & Linkers',
      'Transformation of Sentences (Simple/Complex/Compound)',
      'Pronoun Reference',
      'Synonym & Antonym Analysis',
      'Punctuation & Capitalization',
    ],
  },
  {
    unitTitle: 'Unit 2: Guided Writing & Composition',
    badgeColor: 'bg-weird-green/15 text-emerald-800 dark:text-weird-green border-weird-green/20',
    topics: [
      'Formal Letter & Email Writing',
      'Report Writing (Newspaper & Investigation)',
      'Paragraph Writing (Cause & Effect, Comparison)',
      'Summary Writing (Textual Passages)',
      'Story Writing & Dialogue Practice',
    ],
  },
  {
    unitTitle: 'Unit 3: Board Questions & College Test Papers',
    badgeColor: 'bg-radiant-yellow/15 text-amber-800 dark:text-radiant-yellow border-radiant-yellow/20',
    topics: [
      'Dhaka Board 2024 Question Solution',
      'Rajshahi & Chittagong Board Solves',
      'Top College Test Paper Exercises (Notre Dame, VNSC, DRMC)',
      'Board Standard 100-Marks Model Test Analysis',
    ],
  },
  {
    unitTitle: 'Unit 4: Spoken English & Academic Vocabulary',
    badgeColor: 'bg-bright-lilac/15 text-purple-800 dark:text-bright-lilac border-bright-lilac/20',
    topics: [
      'Everyday Spoken English & Conversational Phrases',
      'Common Grammatical Errors in Spoken English',
      'Pronunciation & Phonetics Fundamentals',
      '500 High-Frequency Academic Vocabulary Words',
    ],
  },
];

interface MasterSyllabusSelectorProps {
  selectedTopics: string[];
  onChange: (topics: string[]) => void;
  enrolledStudentsCount: number;
}

export const MasterSyllabusSelector: React.FC<MasterSyllabusSelectorProps> = ({
  selectedTopics,
  onChange,
  enrolledStudentsCount,
}) => {
  const [expandedUnit, setExpandedUnit] = useState<number | null>(0); // First unit open by default
  const [customTopicInput, setCustomTopicInput] = useState('');

  const handleToggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      onChange(selectedTopics.filter((t) => t !== topic));
    } else {
      onChange([...selectedTopics, topic]);
    }
  };

  const handleAddCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTopicInput.trim();
    if (!clean) return;
    if (!selectedTopics.includes(clean)) {
      onChange([...selectedTopics, clean]);
    }
    setCustomTopicInput('');
  };

  const handleRemoveTopic = (topic: string) => {
    onChange(selectedTopics.filter((t) => t !== topic));
  };

  return (
    <div className="space-y-4">
      {/* Selected Topics Showcase */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-spiro-disco-ball" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Topics Selected for Today's Lesson ({selectedTopics.length})
            </span>
          </div>
          {selectedTopics.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] font-bold text-slate-400 hover:text-light-red transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {selectedTopics.length === 0 ? (
          <div className="p-3 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            Click on any syllabus topic from the units below, or add a custom lesson topic.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedTopics.map((topic, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-light-indigo/15 text-light-indigo dark:text-spiro-disco-ball border border-light-indigo/25 shadow-2xs animate-in zoom-in-95 duration-150"
              >
                <span>{topic}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className="p-0.5 rounded hover:bg-light-indigo/20 text-slate-400 hover:text-light-red"
                  title="Remove topic"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom Topic Quick Add Form */}
        <form onSubmit={handleAddCustomTopic} className="flex gap-2 pt-1">
          <input
            type="text"
            value={customTopicInput}
            onChange={(e) => setCustomTopicInput(e.target.value)}
            placeholder="Type a specific topic (e.g. Modifiers Rules 1-5, Practice Sheet #3)..."
            className="flex-1 px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-light-indigo"
          />
          <button
            type="submit"
            disabled={!customTopicInput.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </form>
      </div>

      {/* Structured Curriculum Library Accordions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-light-indigo dark:text-spiro-disco-ball" />
            <span>Structured Curriculum Library (Click to Select)</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {MASTER_ENGLISH_SYLLABUS.reduce((sum, u) => sum + u.topics.length, 0)} Total Master Topics
          </span>
        </div>

        <div className="space-y-2">
          {MASTER_ENGLISH_SYLLABUS.map((unit, unitIdx) => {
            const isExpanded = expandedUnit === unitIdx;
            const selectedInUnit = unit.topics.filter((t) => selectedTopics.includes(t)).length;

            return (
              <div
                key={unitIdx}
                className="rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden shadow-2xs transition-all"
              >
                {/* Unit Header Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedUnit(isExpanded ? null : unitIdx)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${unit.badgeColor}`}>
                      {unit.unitTitle.split(':')[0]}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {unit.unitTitle.includes(':') ? unit.unitTitle.split(':')[1].trim() : unit.unitTitle}
                    </span>
                    {selectedInUnit > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-weird-green/20 text-emerald-800 dark:text-weird-green">
                        {selectedInUnit} selected
                      </span>
                    )}
                  </div>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Topics Grid when expanded */}
                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                      {unit.topics.map((topic, tIdx) => {
                        const isSelected = selectedTopics.includes(topic);
                        return (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => handleToggleTopic(topic)}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-light-indigo text-white shadow-xs font-bold'
                                : 'bg-white dark:bg-dark-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70'
                            }`}
                          >
                            <span className="truncate pr-2">{topic}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                                isSelected
                                  ? 'bg-white text-light-indigo border-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
