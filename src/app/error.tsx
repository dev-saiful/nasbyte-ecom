"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
