import { Star } from "lucide-react";
import { TimeAgo } from "@/components/shared/time-ago";

interface ReviewUser {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

export interface ReviewData {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
}

interface ReviewCardProps {
  readonly review: ReviewData;
}

export function ReviewCard({ review }: ReviewCardProps): React.ReactElement {
  const displayName = review.user.displayName || review.user.username || "User";

  return (
    <div className="py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6B46C1]/10 text-sm font-semibold text-[#6B46C1]">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">{displayName}</span>
            <TimeAgo date={review.createdAt} className="text-xs" />
          </div>
          <div className="mt-0.5 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      {review.content && (
        <p className="mt-2 pl-11 text-sm text-primary whitespace-pre-wrap">
          {review.content}
        </p>
      )}
    </div>
  );
}
