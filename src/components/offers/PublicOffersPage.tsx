// components/offers/PublicOffersPage.tsx
import React, { useState } from 'react';
import { useGetPublicOffersQuery } from '@/features/offerApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const PublicOffersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  
  const { data, isLoading, error } = useGetPublicOffersQuery({
    page,
    limit: 10,
    type: 'FLASH_SALE',
  });

  if (error) return (
    <div className="flex justify-center items-center min-h-64">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading offers
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Offers</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : (
          data?.data?.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

const OfferCard: React.FC<{ offer: any }> = ({ offer }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
    {offer.bannerImage && (
      <img 
        src={offer.bannerImage} 
        alt={offer.title}
        className="w-full h-48 object-cover"
      />
    )}
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start mb-2">
        <CardTitle className="text-lg">{offer.title}</CardTitle>
        <Badge variant="secondary">{offer.type.replace('_', ' ')}</Badge>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{offer.description}</p>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-green-600">
          {offer.discountType === 'PERCENTAGE' 
            ? `${offer.discountValue}%` 
            : `$${offer.discountValue}`}
        </span>
        {offer.countdownConfig && (
          <CountdownTimer endTime={offer.countdownConfig.countdownEnds} />
        )}
      </div>
      
      {offer.countdownConfig && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Remaining:</span>
            <span className="font-semibold">
              {offer.countdownConfig.remainingQty || 0}
            </span>
          </div>
          {offer.countdownConfig.urgencyText && (
            <p className="text-xs text-orange-600 font-medium">
              {offer.countdownConfig.urgencyText}
            </p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

const CountdownTimer: React.FC<{ endTime: string }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('EXPIRED');
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
      {timeLeft}
    </div>
  );
};