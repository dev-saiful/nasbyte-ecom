"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema } from "@/lib/validators";
import type { z } from "zod";

type CategoryFormData = z.input<typeof categorySchema>;

interface AdminCategoryFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    imagePath?: string | null;
    isActive: boolean;
  };
}

export function AdminCategoryForm({ initialData }: AdminCategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      imagePath: initialData?.imagePath || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  async function onSubmit(data: CategoryFormData) {
    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/categories/${initialData.id}`
        : "/api/admin/categories";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to save category");
      }

      router.push("/admin/categories");
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
        <Input id="name" {...register("name")} placeholder="Category name" />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <Input
          id="slug"
          {...register("slug")}
          placeholder="auto-generated-from-name"
        />
        {errors.slug && (
          <p className="text-destructive text-sm">{errors.slug.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          Leave blank to auto-generate from name
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Optional category description"
          rows={3}
        />
        {errors.description && (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="imagePath" className="text-sm font-medium">
          Image Path
        </label>
        <Input
          id="imagePath"
          {...register("imagePath")}
          placeholder="/images/categories/..."
        />
        {errors.imagePath && (
          <p className="text-destructive text-sm">{errors.imagePath.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Update Category"
              : "Create Category"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
