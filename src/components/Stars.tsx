export function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={`${size} text-amber-500`} aria-label={`${value.toFixed(1)} / 5`}>
      {"★".repeat(rounded)}
      <span className="text-stone-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
