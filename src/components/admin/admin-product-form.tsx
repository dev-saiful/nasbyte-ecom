"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProductInput } from "@/lib/validators";
import { adminProductSchema } from "@/lib/validators";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AdminProductFormProps {
  onSubmit: (data: AdminProductInput) => Promise<void>;
  isLoading: boolean;
  initialData?: AdminProductInput | null;
  categories?: Category[];
}

export function AdminProductForm({
  onSubmit,
  isLoading,
  initialData,
  categories = [],
}: AdminProductFormProps) {
  const [featureInput, setFeatureInput] = useState("");

  const form = useForm<AdminProductInput>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? 0,
      compareAtPrice: initialData?.compareAtPrice ?? undefined,
      sku: initialData?.sku ?? "",
      stock: initialData?.stock ?? 0,
      categoryId: initialData?.categoryId ?? null,
      hasVariants: initialData?.hasVariants ?? false,
      isFeatured: initialData?.isFeatured ?? false,
      isActive: initialData?.isActive ?? true,
      features: initialData?.features ?? [],
      options: initialData?.options ?? [],
      variants: initialData?.variants ?? [],
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const hasVariants = watch("hasVariants");
  const features = watch("features") ?? [];

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });

  const addFeature = () => {
    if (featureInput.trim()) {
      setValue("features", [...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setValue(
      "features",
      features.filter((_, i) => i !== index),
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={4} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (BDT) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare at Price</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                {...register("compareAtPrice", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                {...register("stock", { valueAsNumber: true })}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Product is visible and can be purchased
              </p>
            </div>
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Featured</Label>
              <p className="text-sm text-muted-foreground">
                Product appears on homepage
              </p>
            </div>
            <Switch
              checked={watch("isFeatured")}
              onCheckedChange={(checked) => setValue("isFeatured", checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Has Variants</Label>
              <p className="text-sm text-muted-foreground">
                Product has multiple options (size, color, etc.)
              </p>
            </div>
            <Switch
              checked={hasVariants}
              onCheckedChange={(checked) => setValue("hasVariants", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a feature"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addFeature}>
              <Plus className="size-4" />
            </Button>
          </div>
          {features.length > 0 && (
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={feature} className="flex items-center gap-2">
                  <Checkbox checked disabled />
                  <span className="flex-1 text-sm">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasVariants && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Options</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendOption({ name: "", values: [""] })}
              >
                <Plus className="mr-2 size-4" />
                Add Option
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-md border p-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Option name (e.g., Color, Size)"
                    {...register(`options.${index}.name`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => removeOption(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {watch(`options.${index}.values`)?.map((val, valueIndex) => (
                    <div
                      key={`${index}-${val ?? valueIndex}`}
                      className="flex items-center gap-2"
                    >
                      <Input
                        placeholder="Value"
                        {...register(`options.${index}.values.${valueIndex}`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          const currentValues = watch(
                            `options.${index}.values`,
                          );
                          if (currentValues && currentValues.length > 1) {
                            setValue(
                              `options.${index}.values`,
                              currentValues.filter((_, i) => i !== valueIndex),
                            );
                          }
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const currentValues =
                        watch(`options.${index}.values`) ?? [];
                      setValue(`options.${index}.values`, [
                        ...currentValues,
                        "",
                      ]);
                    }}
                  >
                    <Plus className="mr-2 size-3" />
                    Add Value
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : initialData
              ? "Update Product"
              : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
