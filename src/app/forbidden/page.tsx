import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">403</h1>
        <p className="mt-2 text-muted-foreground">Access Denied</p>
        <Link
          href="/"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
