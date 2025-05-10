import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Theater from '../models/theater.js';

// Load environment variables first
dotenv.config();

console.log('Starting seed process...');
console.log('MongoDB URI:', process.env.MONGODB_URI);

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur'];

const theaterChains = ['PVR', 'INOX', 'Cinepolis', 'Carnival', 'Miraj', 'Cinepolis'];

const locations = {
  Mumbai: [
    'Phoenix MarketCity, Kurla',
    'Infiniti Mall, Malad West',
    'R City Mall, Ghatkopar',
    'High Street Phoenix, Lower Parel',
    'Infinity Mall, Andheri West',
    'Growels 101 Mall, Kandivali East'
  ],
  Delhi: [
    'Select City Walk, Saket',
    'Ambience Mall, Vasant Kunj',
    'Pacific Mall, Subhash Nagar',
    'DLF Promenade, Vasant Kunj',
    'DLF Mall of India, Noida',
    'Unity One Mall, Rohini'
  ],
  Bangalore: [
    'Phoenix MarketCity, Whitefield',
    'Mantri Square Mall, Malleshwaram',
    'Orion Mall, Rajajinagar',
    'UB City, Vittal Mallya Road',
    'Garuda Mall, Magrath Road',
    'Forum Mall, Koramangala'
  ],
  Hyderabad: [
    'Inorbit Mall, Cyberabad',
    'GVK One Mall, Banjara Hills',
    'Forum Sujana Mall, Kukatpally',
    'City Center Mall, Banjara Hills',
    'Sarath City Capital Mall, Kondapur',
    'Manjeera Trinity Mall, Kukatpally'
  ],
  Chennai: [
    'Express Avenue Mall, Royapettah',
    'Phoenix MarketCity, Velachery',
    'VR Mall, Anna Nagar',
    'Spencer Plaza, Anna Salai',
    'Forum Vijaya Mall, Vadapalani',
    'Grand Mall, Velachery'
  ],
  Kolkata: [
    'South City Mall, Prince Anwar Shah Road',
    'Quest Mall, Park Street',
    'Acropolis Mall, Kasba',
    'Mani Square Mall, EM Bypass',
    'City Centre 2, New Town',
    'Axis Mall, Rajarhat'
  ],
  Jaipur: [
    'World Trade Park, Malviya Nagar',
    'MGF Metropolitan Mall, Tonk Road',
    'GT Central Mall, Vaishali Nagar',
    'Pink Square Mall, Mansarovar',
    'Crystal Palm Mall, Bani Park',
    'Elements Mall, Ajmer Road'
  ]
};

const seedTheaters = async () => {
  try {
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Clear existing theaters
    console.log('Clearing existing theaters...');
    await Theater.deleteMany({});

    for (const city of cities) {
      for (let i = 0; i < theaterChains.length; i++) {
        const chain = theaterChains[i];
        const location = locations[city][i];
        
        const theater = new Theater({
          name: `${chain} ${city}`,
          location: location,
          city: city,
          screens: [
            {
              id: `${chain}_${city}_1`.toLowerCase(),
              name: 'Screen 1 - Standard',
              showtimes: [
                {
                  id: `${chain}_${city}_1_1`.toLowerCase(),
                  time: '10:00 AM',
                  price: 150,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                },
                {
                  id: `${chain}_${city}_1_2`.toLowerCase(),
                  time: '1:30 PM',
                  price: 180,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                },
                {
                  id: `${chain}_${city}_1_3`.toLowerCase(),
                  time: '6:30 PM',
                  price: 220,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                }
              ]
            },
            {
              id: `${chain}_${city}_2`.toLowerCase(),
              name: 'Screen 2 - Premium',
              showtimes: [
                {
                  id: `${chain}_${city}_2_1`.toLowerCase(),
                  time: '11:00 AM',
                  price: 250,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                },
                {
                  id: `${chain}_${city}_2_2`.toLowerCase(),
                  time: '4:30 PM',
                  price: 300,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                }
              ]
            },
            {
              id: `${chain}_${city}_3`.toLowerCase(),
              name: 'Screen 3 - IMAX',
              showtimes: [
                {
                  id: `${chain}_${city}_3_1`.toLowerCase(),
                  time: '12:00 PM',
                  price: 400,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                },
                {
                  id: `${chain}_${city}_3_2`.toLowerCase(),
                  time: '3:30 PM',
                  price: 450,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                },
                {
                  id: `${chain}_${city}_3_3`.toLowerCase(),
                  time: '7:00 PM',
                  price: 500,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                }
              ]
            },
            {
              id: `${chain}_${city}_4`.toLowerCase(),
              name: 'Screen 4 - 4DX',
              showtimes: [
                {
                  id: `${chain}_${city}_4_1`.toLowerCase(),
                  time: '1:00 PM',
                  price: 600,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                },
                {
                  id: `${chain}_${city}_4_2`.toLowerCase(),
                  time: '5:00 PM',
                  price: 650,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                },
                {
                  id: `${chain}_${city}_4_3`.toLowerCase(),
                  time: '8:30 PM',
                  price: 700,
                  seats: Array.from({ length: 100 }, (_, i) => ({
                    id: `seat_${i + 1}`,
                    row: String.fromCharCode(65 + Math.floor(i / 10)),
                    number: (i % 10) + 1,
                    isBooked: false
                  }))
                }
              ]
            }
          ]
        });

        try {
          await theater.save();
          console.log(`Created theater: ${theater.name} in ${theater.city}`);
        } catch (error) {
          console.error(`Error creating theater ${theater.name}:`, error);
        }
      }
    }

    console.log('Theater seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding theaters:', error);
    process.exit(1);
  }
};

// Run the seed function
seedTheaters().catch(error => {
  console.error('Unhandled error in seed process:', error);
  process.exit(1);
});