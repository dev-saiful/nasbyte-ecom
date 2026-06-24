"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminUserCreateSchema, adminUserUpdateSchema } from "@/lib/validators";
import type { z } from "zod";

type CreateFormData = z.input<typeof adminUserCreateSchema>;
type UpdateFormData = z.input<typeof adminUserUpdateSchema>;

interface AdminUserFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
  };
}

export function AdminUserForm({ initialData }: AdminUserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState(initialData?.role || "USER");
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEdit ? adminUserUpdateSchema : adminUserCreateSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      ...(isEdit ? {} : { password: "" }),
    },
  });

  async function onSubmit(data: CreateFormData | UpdateFormData) {
    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/users/${initialData.id}`
        : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";

      const body: any = { ...data };
      if (isEdit && !body.password) {
        delete body.password;
      }
      if (!isEdit) {
        body.role = role;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to save user");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name *
        </label>
        <Input id="name" {...register("name")} placeholder="Full name" />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email *
        </label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="user@example.com"
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <Input id="phone" {...register("phone")} placeholder="+880..." />
        {errors.phone && (
          <p className="text-destructive text-sm">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password {isEdit ? "(leave blank to keep current)" : "*"}
        </label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          placeholder={isEdit ? "••••••••" : "Min. 8 characters"}
        />
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <Select value={role} onValueChange={(v) => { if (v) setRole(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Update User"
              : "Create User"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
