"use client";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Bekreft",
  cancelLabel = "Avbryt",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {message && <p className="text-sm text-ink-secondary mt-2">{message}</p>}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-line text-ink-secondary font-medium hover:text-ink"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white font-medium ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}