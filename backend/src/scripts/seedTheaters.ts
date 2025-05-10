import { connectDB } from '../db';
import { seedTheaters } from '../data/theaters';

const seed = async () => {
  try {
    await connectDB();
    await seedTheaters();
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seed(); 