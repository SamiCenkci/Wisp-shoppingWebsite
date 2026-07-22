"use client";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function StarRating({ value, onChange, readOnly = false, size = "md" }: Props) {
  const sizeClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-2xl";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`${sizeClass} leading-none transition-transform ${
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
          aria-label={`${star} av 5`}
        >
          <span className={star <= value ? "text-yellow-400" : "text-ink-muted opacity-30"}>★</span>
        </button>
      ))}
    </div>
  );
}