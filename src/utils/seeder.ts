import { collection, addDoc, writeBatch, doc, getDocs, query, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DestinationCategory, BookingStatus, PaymentStatus, MembershipTier } from '../types';

const countries = [
  { name: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux'] },
  { name: 'Italy', cities: ['Rome', 'Venice', 'Florence', 'Milan', 'Naples'] },
  { name: 'Japan', cities: ['Tokyo', 'Kyoto', 'Osaka', 'Nara', 'Hiroshima'] },
  { name: 'India', cities: ['Delhi', 'Mumbai', 'Jaipur', 'Varanasi', 'Goa'] },
  { name: 'USA', cities: ['New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Miami'] },
  { name: 'Greece', cities: ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes'] },
  { name: 'Egypt', cities: ['Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Sharm El Sheikh'] },
  { name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Cairns'] },
  { name: 'Brazil', cities: ['Rio de Janeiro', 'Sao Paulo', 'Salvador', 'Brasilia', 'Manaus'] },
  { name: 'Thailand', cities: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi'] },
  { name: 'Spain', cities: ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Granada'] },
  { name: 'UK', cities: ['London', 'Edinburgh', 'Manchester', 'Bath', 'Oxford'] },
  { name: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
  { name: 'Mexico', cities: ['Mexico City', 'Cancun', 'Oaxaca', 'Tulum', 'Guadalajara'] },
  { name: 'Turkey', cities: ['Istanbul', 'Cappadocia', 'Antalya', 'Ephesus', 'Bodrum'] },
  { name: 'Peru', cities: ['Lima', 'Cusco', 'Machu Picchu', 'Arequipa', 'Puno'] },
  { name: 'Iceland', cities: ['Reykjavik', 'Akureyri', 'Vik', 'Hofn', 'Selfoss'] },
  { name: 'Norway', cities: ['Oslo', 'Bergen', 'Tromso', 'Stavanger', 'Alesund'] },
  { name: 'New Zealand', cities: ['Auckland', 'Queenstown', 'Wellington', 'Christchurch', 'Rotorua'] },
  { name: 'Switzerland', cities: ['Zurich', 'Geneva', 'Lucerne', 'Interlaken', 'Zermatt'] },
  { name: 'Russia', cities: ['Moscow', 'Saint Petersburg', 'Kazan', 'Sochi', 'Vladivostok'] }
];

const categories: DestinationCategory[] = ['Heritage', 'Nature', 'Adventure', 'Beach', 'Spiritual'];

const descriptions = [
  "Experience the breathtaking views and rich culture of this iconic location.",
  "A perfect blend of modern luxury and ancient traditions.",
  "Discover hidden gems and local secrets in this vibrant city.",
  "Escape to paradise with stunning landscapes and unforgettable experiences.",
  "An adventure of a lifetime awaits you in this majestic destination."
];

export const seedDestinations = async () => {
  const batch = writeBatch(db);
  const destinationsRef = collection(db, 'destinations');
  
  let count = 0;
  for (const country of countries) {
    for (const city of country.cities) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const price = (Math.floor(Math.random() * 125) + 25) * 1000; // Realistic INR prices: 25k to 150k
      const duration = (Math.floor(Math.random() * 10) + 3) + ' Days';
      const rating = parseFloat((Math.random() * (5 - 4) + 4).toFixed(1));
      const slots = Math.floor(Math.random() * 20) + 5;
      
      const destination = {
        name: city,
        country: country.name,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        imageUrl: `https://picsum.photos/seed/${city.toLowerCase().replace(/\s/g, '-')}/800/600`,
        price,
        duration,
        rating,
        category,
        availableSlots: slots,
        createdAt: new Date().toISOString()
      };
      
      const newDocRef = doc(destinationsRef);
      batch.set(newDocRef, destination);
      count++;
    }
  }
  
  await batch.commit();
  return count;
};

export const seedBookings = async () => {
  const destinationsSnap = await getDocs(collection(db, 'destinations'));
  if (destinationsSnap.empty) {
    await seedDestinations();
  }
  
  const destinations = destinationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const batch = writeBatch(db);
  const bookingsRef = collection(db, 'bookings');
  
  const statuses: BookingStatus[] = ['Confirmed', 'Pending', 'Completed', 'Cancelled'];
  const paymentStatuses: PaymentStatus[] = ['Paid', 'Pending', 'Refunded'];
  
  const now = new Date();
  let count = 0;
  
  // Generate bookings for the last 6 months
  for (let i = 0; i < 50; i++) {
    const dest = destinations[Math.floor(Math.random() * destinations.length)] as any;
    const passengers = Math.floor(Math.random() * 4) + 1;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    
    // Random date in the last 6 months
    const date = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    
    const booking = {
      bookingRef: `SY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      destinationId: dest.id,
      destinationName: dest.name,
      destinationCountry: dest.country,
      travelerId: 'sample-user-id',
      travelerName: 'Sample Traveler ' + (i + 1),
      travelerEmail: `traveler${i + 1}@example.com`,
      travelDate: date.toISOString().split('T')[0],
      passengers,
      totalAmount: dest.price * passengers,
      status,
      paymentStatus: status === 'Cancelled' ? 'Refunded' : paymentStatus,
      createdAt: date.toISOString()
    };
    
    const newDocRef = doc(bookingsRef);
    batch.set(newDocRef, booking);
    count++;
  }
  
  await batch.commit();
  return count;
};

export const seedTravelers = async () => {
  const batch = writeBatch(db);
  const travelersRef = collection(db, 'travelers');
  const tiers: MembershipTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  
  let count = 0;
  for (let i = 0; i < 30; i++) {
    const traveler = {
      name: `Sample Traveler ${i + 1}`,
      email: `sample.traveler${i + 1}@example.com`,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      membershipTier: tiers[Math.floor(Math.random() * tiers.length)],
      totalTrips: Math.floor(Math.random() * 10),
      totalSpent: Math.floor(Math.random() * 500000) + 10000,
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      isSample: true
    };
    
    const newDocRef = doc(travelersRef);
    batch.set(newDocRef, traveler);
    count++;
  }
  
  await batch.commit();
  return count;
};

export const removeSampleTravelers = async () => {
  const travelersSnap = await getDocs(collection(db, 'travelers'));
  const batch = writeBatch(db);
  let count = 0;
  
  travelersSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.isSample === true || data.name.startsWith('Sample Traveler')) {
      batch.delete(doc.ref);
      count++;
    }
  });
  
  await batch.commit();
  return count;
};
