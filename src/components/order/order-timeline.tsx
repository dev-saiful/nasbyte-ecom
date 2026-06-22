import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  status: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface OrderTimelineProps {
  currentStatus: string;
}

const statusSteps = [
  { status: "PENDING", label: "Order Placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = statusSteps.findIndex(
    (step) => step.status === currentStatus,
  );

  const steps: TimelineStep[] = statusSteps.map((step, index) => ({
    ...step,
    completed: index < currentIndex,
    current: index === currentIndex,
  }));

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.status} className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              step.completed && "bg-primary text-primary-foreground",
              step.current && "border-2 border-primary bg-background",
              !step.completed && !step.current && "border-2 border-muted",
            )}
          >
            {step.completed ? (
              <Check className="size-4" />
            ) : (
              <span className="text-xs font-medium">{index + 1}</span>
            )}
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                step.current && "text-primary",
                !step.completed && !step.current && "text-muted-foreground",
              )}
            >
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
