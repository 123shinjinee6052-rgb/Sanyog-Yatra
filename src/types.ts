export type UserRole = 'admin' | 'customer';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type DestinationCategory = 'Heritage' | 'Nature' | 'Adventure' | 'Beach' | 'Spiritual';
export type MembershipTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  price: number;
  duration: string;
  rating: number;
  category: DestinationCategory;
  availableSlots: number;
  lastPriceUpdate?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  destinationId: string;
  destinationName?: string;
  destinationCountry?: string;
  travelerId: string;
  travelerName?: string;
  travelerEmail?: string;
  travelDate: string;
  passengers: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Refunded';
  confirmedAt?: string;
  createdAt: string;
}

export interface Traveler {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipTier: MembershipTier;
  totalTrips: number;
  totalSpent: number;
  joinedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId: string;
  paidAt: string;
}
