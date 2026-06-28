import { PasswordChangeForm } from "@/components/account/security-forms";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Security Settings</h1>
      <PasswordChangeForm />
    </div>
  );
}
