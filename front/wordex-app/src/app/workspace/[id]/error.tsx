"use client";

export default function ErrorBoundary({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div className="p-10 text-red-500 bg-red-100 min-h-screen">
      <h1 className="text-2xl font-bold">Runtime Error Captured</h1>
      <pre className="mt-4 p-4 bg-white/50 rounded break-all whitespace-pre-wrap">{error.message}</pre>
      <pre className="mt-4 p-4 bg-white/50 rounded break-all whitespace-pre-wrap text-sm">{error.stack}</pre>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Retry Phase</button>
    </div>
  );
}
