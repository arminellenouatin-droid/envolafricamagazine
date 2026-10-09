"use client";

import { useEffect, useState } from "react";

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type WabPollProps = {
  postId: string;
  question: string;
  options: PollOption[];
  totalVotes?: number;
  endsAtLabel?: string;
};

export default function WabPollWidget({
  postId,
  question,
  options: initialOptions,
  totalVotes: initialTotalVotes,
  endsAtLabel = "Il reste 3 jours",
}: WabPollProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [options, setOptions] = useState<PollOption[]>(initialOptions);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`eam_wab_poll_${postId}`);
      if (saved) {
        setSelectedOptionId(saved);
        setHasVoted(true);
      }
    } catch {}
  }, [postId]);

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0) || initialTotalVotes || 0;

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    const nextOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    setOptions(nextOptions);
    setSelectedOptionId(optionId);
    setHasVoted(true);

    try {
      localStorage.setItem(`eam_wab_poll_${postId}`, optionId);
    } catch {}
  };

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#d8e2e6] bg-[#fbfdfc] p-4 text-[#001325] shadow-sm">
      <div className="flex items-center justify-between text-xs text-[#5f6368] mb-2.5">
        <span className="inline-flex items-center gap-1 font-bold text-[#006874]">
          <span className="material-symbols-outlined text-[16px]">poll</span> Sondage B2B
        </span>
        <span className="text-[11px] font-medium">{endsAtLabel}</span>
      </div>

      <h4 className="font-display text-sm sm:text-base font-bold text-[#082843] mb-3">
        {question}
      </h4>

      <div className="space-y-2">
        {options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = selectedOptionId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={hasVoted}
              onClick={() => handleVote(option.id)}
              className={`group relative w-full overflow-hidden rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-[#006874] bg-[#eefcfa] font-bold"
                  : hasVoted
                  ? "border-[#e0e5e8] bg-white cursor-default"
                  : "border-[#d8e2e6] bg-white hover:border-[#006874] hover:bg-[#f6fbfb]"
              }`}
            >
              {/* Animated Progress Bar when voted */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                    isSelected ? "bg-[#cbe8e4]/80" : "bg-slate-100/90"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between p-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[10px] transition ${
                      isSelected
                        ? "border-[#006874] bg-[#006874] text-white"
                        : "border-[#9da3a8]"
                    }`}
                  >
                    {isSelected && "✓"}
                  </span>
                  <span className={`truncate ${isSelected ? "text-[#006874] font-bold" : "text-[#1b2524]"}`}>
                    {option.text}
                  </span>
                </div>

                {hasVoted && (
                  <span className="shrink-0 font-extrabold text-[#006874]">
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#5f6368] pt-2 border-t border-[#edf2f4]">
        <span>
          {totalVotes} vote{totalVotes > 1 ? "s" : ""} au total
        </span>
        {hasVoted && <span className="font-semibold text-emerald-700">✓ Vote pris en compte</span>}
      </div>
    </div>
  );
}
