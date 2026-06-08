export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
      {message}
    </div>
  );
}
