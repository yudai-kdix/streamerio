"use client";

import { Fragment, type ReactNode, useCallback } from "react";


export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  media?: ReactNode;
  content?: ReactNode;
  nextLabel?: string;
  nextDisabled?: boolean;
  onNext?: () => void | boolean | Promise<void | boolean>;
};

type Props = {
  open: boolean;
  steps: OnboardingStep[];
  currentStep: number;
  onPrev: () => void;
  onNextDefault: () => void;
  onClose: () => void;
  allowClose: boolean;
};

export default function OnboardingModal({
  open,
  steps,
  currentStep,
  onPrev,
  onNextDefault,
  onClose,
  allowClose,
}: Props) {
  const total = steps.length;
  const step = steps[currentStep];

  const handleNext = useCallback(async () => {
    if (!step) return;
    if (step.onNext) {
      const result = await step.onNext();
      if (result === false) return;
      onNextDefault();
    } else {
      onNextDefault();
    }
  }, [onNextDefault, step]);

  if (!open || !step) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
      <div className="relative w-full max-w-xl rounded-2xl bg-black/90 border border-white/20 shadow-2xl text-white p-6">
        {allowClose ? (
          <button
            type="button"
            aria-label="操作説明を閉じる"
            className="absolute top-4 right-4 rounded-full border border-white/40 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
            onClick={onClose}
          >
            ×
          </button>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-white/50">
              Step {currentStep + 1} / {total}
            </p>
            <h2 className="text-2xl font-semibold">{step.title}</h2>
            <p className="text-sm text-white/70">{step.description}</p>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/5 min-h-[160px] flex items-center justify-center overflow-hidden">
            {step.media ? (
              <Fragment>{step.media}</Fragment>
            ) : (
              <p className="text-center text-sm text-white/50 px-6 py-8">
                ここに GIF や画像をいれるイメージ。
              </p>
            )}
          </div>

          {step.content ? <div>{step.content}</div> : null}

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/80 disabled:opacity-40"
            >
              <span aria-hidden="true">←</span>
              前へ
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={step.nextDisabled}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-400/90 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-40"
            >
              {step.nextLabel ?? "次へ"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
