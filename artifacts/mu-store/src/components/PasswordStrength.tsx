interface Props { password: string }

const LEVELS = [
  { label: "Very weak", color: "bg-red-500", width: "w-1/4" },
  { label: "Weak",      color: "bg-orange-400", width: "w-2/4" },
  { label: "Good",      color: "bg-yellow-400", width: "w-3/4" },
  { label: "Strong",    color: "bg-green-500",  width: "w-full" },
];

function getStrength(pw: string): number {
  if (!pw) return -1;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(3, Math.floor(score * 0.8));
}

export default function PasswordStrength({ password }: Props) {
  const level = getStrength(password);
  if (level < 0) return null;
  const { label, color, width } = LEVELS[level];

  return (
    <div className="space-y-1.5 mt-1">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ease-out ${color} ${width}`} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {password.length < 8
            ? `${8 - password.length} more character${8 - password.length !== 1 ? "s" : ""} needed`
            : ""}
        </span>
        <span className={`text-xs font-semibold ${level === 3 ? "text-green-600" : level === 2 ? "text-yellow-600" : level === 1 ? "text-orange-500" : "text-red-500"}`}>
          {label}
        </span>
      </div>
      {password.length >= 8 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { ok: /[A-Z]/.test(password), label: "Uppercase" },
            { ok: /[0-9]/.test(password), label: "Number" },
            { ok: /[^A-Za-z0-9]/.test(password), label: "Symbol" },
          ].map(({ ok, label }) => (
            <span key={label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${ok ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400" : "bg-muted border-border text-muted-foreground"}`}>
              {ok ? "✓" : "○"} {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
