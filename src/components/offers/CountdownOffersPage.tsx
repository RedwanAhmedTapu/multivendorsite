// components/offers/CountdownOffersPage.tsx
import React, { useState, useEffect } from 'react';
import { useGetCountdownOffersQuery } from '@/features/offerApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const CountdownOffersPage: React.FC = () => {
  const { data: countdownOffers, isLoading, error } = useGetCountdownOffersQuery();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading countdown offers
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Limited Time Offers</h1>
      <p className="text-gray-600 mb-8">Don't miss out on these exclusive deals!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : (
          countdownOffers?.data?.map((offer) => (
            <CountdownOfferCard key={offer.id} offer={offer} />
          ))
        )}
      </div>

      {countdownOffers?.data?.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 py-8">
              No active countdown offers at the moment. Check back later!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const CountdownOfferCard: React.FC<{ offer: any }> = ({ offer }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      if (!offer.countdownConfig) return;
      
      const endTime = new Date(offer.countdownConfig.countdownEnds).getTime();
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        setTimeRemaining('EXPIRED');
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [offer.countdownConfig]);

  if (!offer.countdownConfig) return null;

  const discountPercent = offer.countdownConfig.originalPrice && offer.countdownConfig.flashPrice
    ? Math.round((1 - offer.countdownConfig.flashPrice / offer.countdownConfig.originalPrice) * 100)
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-orange-200">
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
          <Badge variant="default" className="bg-orange-100 text-orange-800">
            {discountPercent}% OFF
          </Badge>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{offer.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-gray-500 line-through">
              ${offer.countdownConfig.originalPrice}
            </span>
            <span className="text-2xl font-bold text-green-600 block">
              ${offer.countdownConfig.flashPrice}
            </span>
          </div>
          
          {timeRemaining && timeRemaining !== 'EXPIRED' && (
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Ends in</div>
              <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {timeRemaining}
              </div>
            </div>
          )}
        </div>

        {timeRemaining === 'EXPIRED' && (
          <Badge variant="secondary" className="w-full justify-center">
            Offer Expired
          </Badge>
        )}

        {offer.countdownConfig.remainingQty !== undefined && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="flex justify-between text-sm text-red-800">
              <span>Limited Stock:</span>
              <span className="font-semibold">
                {offer.countdownConfig.remainingQty} left
              </span>
            </div>
          </div>
        )}

        {offer.countdownConfig.urgencyText && (
          <p className="text-xs text-orange-600 font-medium text-center">
            {offer.countdownConfig.urgencyText}
          </p>
        )}

        <Button className="w-full" disabled={timeRemaining === 'EXPIRED'}>
          {timeRemaining === 'EXPIRED' ? 'Offer Ended' : 'Shop Now'}
        </Button>
      </CardContent>
    </Card>
  );
};