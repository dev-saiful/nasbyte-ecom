import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddressCardProps {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AddressCard({
  recipientName,
  phone,
  addressLine,
  city,
  postalCode,
  country,
  isDefault,
  onEdit,
  onDelete,
  id,
}: AddressCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{recipientName}</CardTitle>
          {isDefault && <Badge variant="secondary">Default</Badge>}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(id)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{phone}</p>
        <p className="text-sm text-muted-foreground">
          {addressLine}
          <br />
          {city}
          {postalCode && `, ${postalCode}`}
          <br />
          {country}
        </p>
      </CardContent>
    </Card>
  );
}
