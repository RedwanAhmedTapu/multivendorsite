// app/payment-option/page.tsx
import { redirect } from 'next/navigation';
import PaymentOptions from '@/components/paymentoption/PaymentOptions';

interface PageProps {
  searchParams: Promise<{ orderId?: string }>; // Note: Promise in Next.js 16+
}

async function getOrderData(orderId: string) {
  try {
    // Fix the API URL - remove duplicate /api
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const url = `${apiUrl}/api/orders/${orderId}`;
    
    const response = await fetch(url, {
      // Remove cache: 'no-store' or use next: { revalidate: 0 } for ISR
      next: { revalidate: 0 }, // Use this instead of cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`Failed to fetch order: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }
}

export default async function PaymentPage({ searchParams }: PageProps) {
  // Await the searchParams in Next.js 16+
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams.orderId;

  if (!orderId) {
    redirect('/cart');
    return null;
  }

  const order = await getOrderData(orderId);

  if (!order) {
    redirect('/cart');
    return null;
  }

  const orderSummary = {
    subtotal: order.subtotal || order.totalAmount || 0,
    itemCount: order.items?.length || 0,
    total: order.totalAmount || 0,
  };

  return (
    <PaymentOptions 
      orderId={Number(orderId)} 
      orderSummary={orderSummary} 
    />
  );
}