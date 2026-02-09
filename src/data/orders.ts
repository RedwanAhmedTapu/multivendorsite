import { Order, OrderStatus, PaymentStatus, ShippingStatus } from "@/types/order";

export const generateOrders = (): Order[] => {
  return [
    {
      id: "1",
      orderNumber: "ORD-2024-001",
      customerId: "CUST-001",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "+8801712345678",
      shippingAddress: {
        street: "123 Main Street",
        city: "Dhaka",
        state: "Dhaka",
        country: "Bangladesh",
        postalCode: "1207"
      },
      items: [
        {
          id: "1",
          productId: "PROD-001",
          productName: "Wireless Headphones",
          variantId: "VAR-001",
          variantName: "Black",
          image: "/headphones.jpg",
          price: 2999,
          specialPrice: 2499,
          quantity: 1,
          total: 2499,
          vendorId: "VENDOR-001",
          vendorName: "TechGadgets Ltd"
        },
        {
          id: "2",
          productId: "PROD-002",
          productName: "Smart Watch",
          variantId: "VAR-002",
          variantName: "Silver",
          image: "/watch.jpg",
          price: 5999,
          quantity: 2,
          total: 11998,
          vendorId: "VENDOR-002",
          vendorName: "Wearables Inc"
        }
      ],
      subtotal: 14498,
      shippingFee: 120,
      tax: 1450,
      discount: 500,
      total: 15568,
      orderStatus: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      shippingStatus: ShippingStatus.PENDING,
      paymentMethod: "Credit Card",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      trackingNumber: "TRK-789456123",
      estimatedDelivery: new Date("2024-01-22")
    },
    // Add more sample orders...
  ];
};

export const orderStatusOptions = [
  { value: OrderStatus.PENDING, label: "Pending" },
  { value: OrderStatus.CONFIRMED, label: "Confirmed" },
  { value: OrderStatus.PROCESSING, label: "Processing" },
  { value: OrderStatus.SHIPPED, label: "Shipped" },
  { value: OrderStatus.DELIVERED, label: "Delivered" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
  { value: OrderStatus.RETURNED, label: "Returned" },
  { value: OrderStatus.REFUNDED, label: "Refunded" }
];