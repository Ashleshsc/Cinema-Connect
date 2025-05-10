# CinemaConnect

CinemaConnect is a modern web application that provides a seamless movie ticket booking experience. The platform allows users to browse movies, book tickets, and manage their bookings efficiently.

## Features

- User authentication and authorization
- Movie browsing and searching
- Dynamic Seat Allocation: Live synchronization allows for immediate updates when seats are booked or released, preventing overbooking and ensuring fair access to available seats
- Seat selection and ticket booking
- Payment integration with Razorpay
- QR code generation for tickets
- Email notifications
- Responsive design for all devices

## Tech Stack

### Frontend\section{Proposed Work}
\begin{frame}{Proposed Work}
\begin{itemize}
    \item \textbf{User Authentication:} Secure login and registration system using JWT to protect user sessions and manage access control.
    \item \textbf{Movie Browsing and Search:} Users can explore movies by genre, language, and city with real-time filtering and showtime listings.
    \item \textbf{Seat Selection and Booking:} Interactive seat maps enable users to choose and reserve seats dynamically with real-time updates.
    \item \textbf{Payment Integration:} Razorpay (test mode) integration allows users to make secure online payments.
    \item \textbf{Email and QR Ticket Generation:} Automatic email confirmation with PDF ticket and QR code for validation.
    \item \textbf{Admin Dashboard:} Admins can manage movies, showtimes, halls, and monitor booking statistics.
    \item \textbf{My Bookings and Rentals:} Users can view past bookings and rented movies through a personalized dashboard.
\end{itemize}
\end{frame}

- React 18
- TypeScript
- React Router DOM
- Axios for API calls
- Razorpay integration
- MetaMask integration for Web3 features

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Prisma ORM
- Nodemailer for email notifications
- PDFKit for PDF generation
- QRCode for ticket QR codes

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CinemaConnect.git
cd CinemaConnect
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Create a `.env` file in the frontend directory
   - Add necessary environment variables (see Environment Variables section)

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Development Scripts

### Backend
- `npm run dev`: Start development server
- `npm start`: Start production server

### Frontend
- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests

## Project Structure

```
CinemaConnect/
├── backend/
│   ├── src/
│   ├── prisma/
│   └── data/
├── frontend/
│   ├── src/
│   ├── public/
│   └── data/
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email [your-email@example.com] or open an issue in the repository. 