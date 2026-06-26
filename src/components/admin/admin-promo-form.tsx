"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Promo {
  id: number;
  title: string | null;
  isActive: boolean;
}

export function AdminPromoForm({ promo }: { promo: Promo | null }) {
  const [title, setTitle] = useState(promo?.title || "");
  const [isActive, setIsActive] = useState(promo?.isActive || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/storefront/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success("Promo banner updated");
    } catch {
      toast.error("Failed to save promo banner");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Edit Promo Banner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Banner Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter promo banner text"
              maxLength={140}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/140 characters
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {isActive && title ? (
            <div className="rounded-md bg-primary/10 p-4 text-center">
              <p className="text-sm font-medium text-primary">{title}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Banner is inactive or empty. It will not appear on the storefront.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
