import { CheckCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  user: { name: string };
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

export function ProductReviews({
  reviews,
  averageRating,
  reviewCount,
}: ProductReviewsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="size-6 fill-primary text-primary" />
          <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-muted-foreground">({reviewCount} reviews)</span>
      </div>

      <Separator />

      {reviews.length === 0 ? (
        <p className="text-center text-muted-foreground">No reviews yet</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {review.user.name}
                  </CardTitle>
                  {review.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <CheckCircle className="size-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-3 ${
                        star <= review.rating
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {review.title && (
                  <h4 className="mb-1 font-medium">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
