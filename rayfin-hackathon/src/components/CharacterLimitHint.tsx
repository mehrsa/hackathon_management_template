export function CharacterLimitHint({
  value,
  maxLength,
}: {
  value: string;
  maxLength?: number;
}) {
  if (typeof maxLength !== 'number') {
    return null;
  }

  return (
    <span aria-hidden="true" className="mt-2 block text-xs leading-5 text-slate-500">
      {value.length} / {maxLength} characters
    </span>
  );
}
