import { Theater } from '../models/Theater';
import { Screen } from '../models/Screen';
import { Showtime } from '../models/Showtime';

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
const theaterChains = ['PVR', 'INOX', 'Cinepolis', 'Carnival', 'Miraj'];

export const seedTheaters = async () => {
  try {
    // Clear existing data
    await Theater.deleteMany({});
    await Screen.deleteMany({});
    await Showtime.deleteMany({});

    const theaters = [];
    
    // Create theaters for each city
    for (const city of cities) {
      for (const chain of theaterChains) {
        const theater = new Theater({
          name: `${chain} ${city}`,
          city: city,
          address: `${Math.floor(Math.random() * 100) + 1} ${city} Street, ${city}`,
          amenities: ['Parking', 'Food Court', 'Wheelchair Access']
        });

        const savedTheater = await theater.save();
        theaters.push(savedTheater);

        // Create screens for each theater
        const screenTypes = ['Standard', 'Premium', 'IMAX'];
        for (let i = 1; i <= 3; i++) {
          const screen = new Screen({
            name: `Screen ${i}`,
            theater: savedTheater._id,
            type: screenTypes[i - 1],
            capacity: Math.floor(Math.random() * 100) + 100
          });

          const savedScreen = await screen.save();
          
          // Create showtimes for each screen
          const showtimes = ['10:00 AM', '1:30 PM', '4:30 PM', '7:30 PM', '10:30 PM'];
          for (const time of showtimes) {
            const showtime = new Showtime({
              screen: savedScreen._id,
              time: time,
              price: Math.floor(Math.random() * 200) + 200,
              availableSeats: savedScreen.capacity
            });
            await showtime.save();
          }
        }
      }
    }

    console.log('Theaters seeded successfully');
    return theaters;
  } catch (error) {
    console.error('Error seeding theaters:', error);
    throw error;
  }
}; 