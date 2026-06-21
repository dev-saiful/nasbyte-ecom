import { Check } from "lucide-react";

interface ProductFeaturesProps {
  features: string[];
}

export function ProductFeatures({ features }: ProductFeaturesProps) {
  if (!features || features.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Features</h3>
      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
