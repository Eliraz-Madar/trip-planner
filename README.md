# Personal Trip Planner

A full-stack web application that helps users plan and manage their hiking and cycling trips with real-time weather forecasts.

## Features

- User authentication and authorization
- Interactive route planning for hiking and cycling trips
- Real-time weather forecasts for planned routes
- Save and manage trip history
- Responsive and user-friendly interface

## Tech Stack

- **Frontend**: React.js, Leaflet.js for maps, Axios for API calls
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Weather API**: OpenWeatherMap
- **Maps**: Leaflet.js

## Project Structure

```
personal-trip-planner/
├── client/                 # Frontend React application
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── utils/         # Utility functions
│       └── App.js         # Main App component
├── server/                 # Backend Node.js application
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── server.js         # Entry point
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd personal-trip-planner
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Create a `.env` file in the server directory with the following variables:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
WEATHER_API_KEY=your_openweathermap_api_key
PORT=5000
```

5. Start the development servers:

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/logout` - Logout user

### Trip Endpoints

- POST `/api/trips` - Create a new trip
- GET `/api/trips` - Get all trips for logged-in user
- GET `/api/trips/:id` - Get specific trip details
- DELETE `/api/trips/:id` - Delete a trip

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Protected routes
- Input validation and sanitization
- CORS configuration
- Environment variable management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 