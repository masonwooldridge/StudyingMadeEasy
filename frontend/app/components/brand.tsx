type BrandProps = {
  light?: boolean;
  compact?: boolean;
};

export default function Brand({ light = false, compact = false }: BrandProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-9 w-9 place-items-center rounded-full border text-[11px] font-extrabold tracking-[0.14em] ${
          light
            ? "border-white/30 bg-white/10 text-white"
            : "border-[#264a38]/20 bg-[#264a38] text-[#f7f3e9]"
        }`}
      >
        SE
      </span>
      {!compact && (
        <span
          className={`display-type text-[1.35rem] font-semibold tracking-[-0.03em] ${
            light ? "text-white" : "text-[#1d251f]"
          }`}
        >
          StudyingMadeEasy
        </span>
      )}
    </div>
  );
}
