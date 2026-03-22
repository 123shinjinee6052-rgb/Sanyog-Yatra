import { Booking } from '../types';

export const downloadBookingsCSV = (bookings: Booking[]) => {
  if (bookings.length === 0) return;

  const headers = [
    'Booking Ref',
    'Destination',
    'Country',
    'Traveler Name',
    'Traveler Email',
    'Travel Date',
    'Passengers',
    'Total Amount (₹)',
    'Status',
    'Payment Status',
    'Created At'
  ];

  const csvRows = bookings.map(b => [
    b.bookingRef,
    b.destinationName || 'N/A',
    b.destinationCountry || 'N/A',
    b.travelerName || 'N/A',
    b.travelerEmail || 'N/A',
    b.travelDate,
    b.passengers,
    b.totalAmount,
    b.status,
    b.paymentStatus || 'Unpaid',
    b.createdAt
  ].map(field => `"${field}"`).join(','));

  const csvContent = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `bookings_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
