import { useState, useEffect } from 'react';
import { ReviewCard } from './ReviewCard';
import { useGbpReviews } from '@/hooks/useGbpReviews';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewsManagerProps {
  organizationId: string;
  profileId?: string;
}

export const ReviewsManager = ({ organizationId, profileId }: ReviewsManagerProps) => {
  const {
    reviews,
    loading,
    fetchReviews,
    approveReview,
    editResponse,
    rejectReview,
    regenerateResponse,
  } = useGbpReviews(organizationId);

  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (ratingFilter !== 'all') filters.rating = parseInt(ratingFilter);
    if (profileId) filters.profileId = profileId;
    if (searchQuery) filters.search = searchQuery;

    const debounce = setTimeout(() => {
      fetchReviews(filters);
    }, 300);

    return () => clearTimeout(debounce);
  }, [statusFilter, ratingFilter, profileId, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="pending_ai">AI Generating</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐ (5 stars)</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐ (4 stars)</SelectItem>
            <SelectItem value="3">⭐⭐⭐ (3 stars)</SelectItem>
            <SelectItem value="2">⭐⭐ (2 stars)</SelectItem>
            <SelectItem value="1">⭐ (1 star)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'No reviews match your filters. Try adjusting your search criteria.'
              : 'Reviews will appear here once customers leave reviews on your Google Business Profile.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={approveReview}
              onEdit={editResponse}
              onReject={rejectReview}
              onRegenerate={regenerateResponse}
            />
          ))}
        </div>
      )}
    </div>
  );
};
