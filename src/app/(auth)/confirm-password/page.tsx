"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ConfirmPasswordInput,
  confirmPasswordSchema,
} from "@/lib/validators";

function ConfirmPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmPasswordInput>({
    resolver: zodResolver(confirmPasswordSchema),
  });

  async function onSubmit(data: ConfirmPasswordInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/confirm-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Incorrect password");
        return;
      }

      if (!result.confirmationToken) {
        toast.error("Something went wrong. Please try again.");
        return;
      }

      const separator = callbackUrl.includes("?") ? "&" : "?";
      router.push(
        `${callbackUrl}${separator}confirmed=true&token=${encodeURIComponent(result.confirmationToken)}`,
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm your password</CardTitle>
        <CardDescription>
          Please enter your password to continue.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Confirming..." : "Confirm password"}
          </Button>
          <Link
            href={callbackUrl}
            className="text-sm text-muted-foreground hover:underline"
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ConfirmPasswordPage() {
  return (
    <Suspense>
      <ConfirmPasswordForm />
    </Suspense>
  );
}
