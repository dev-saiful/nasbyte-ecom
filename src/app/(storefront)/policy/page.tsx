import { PolicySections } from "@/components/policy/policy-sections";

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">Policies</h1>
      <p className="mt-2 text-muted-foreground">
        Please review our policies below
      </p>
      <div className="mt-8">
        <PolicySections />
      </div>
    </div>
  );
}
