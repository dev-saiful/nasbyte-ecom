"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@/lib/validators";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || "" },
  });

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This password reset link is invalid or missing a token.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Request a new reset link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function onSubmit(data: ResetPasswordInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password reset successfully</CardTitle>
          <CardDescription>
            Your password has been updated. Redirecting to sign in...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Sign in now
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <input type="hidden" {...register("token")} />
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
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
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              type="password"
              placeholder="••••••••"
              {...register("password_confirmation")}
              aria-invalid={!!errors.password_confirmation}
            />
            {errors.password_confirmation && (
              <p className="text-xs text-destructive">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
