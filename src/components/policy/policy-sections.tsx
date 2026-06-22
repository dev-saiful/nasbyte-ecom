import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `We collect personal information to process your orders and improve our services. Your data is stored securely and is only shared with third parties necessary for order fulfillment (shipping partners, payment processors). We do not sell your personal information to third parties.`,
  },
  {
    id: "terms",
    title: "Terms of Service",
    content: `By using our website, you agree to our terms and conditions. All products are subject to availability. We reserve the right to modify or discontinue products at any time. Prices are subject to change without notice.`,
  },
  {
    id: "shipping",
    title: "Shipping Policy",
    content: `We offer flat-rate shipping of 150 BDT for all orders within Bangladesh. Orders are typically processed within 1-2 business days. Delivery usually takes 3-5 business days depending on your location. You will receive a tracking number once your order is shipped.`,
  },
  {
    id: "returns",
    title: "Return Policy",
    content: `We accept returns within 7 days of delivery for most items. Items must be unused and in original packaging. To initiate a return, please contact our support team with your order number. Refunds will be processed within 5-7 business days after we receive the returned item.`,
  },
];

export function PolicySections() {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <div key={section.id}>
          {index > 0 && <Separator className="mb-8" />}
          <Card>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{section.content}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
