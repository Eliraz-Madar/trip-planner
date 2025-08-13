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
git clone https://github.com/Eliraz-Madar/trip-planner.git
cd trip-planner
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
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
REACT_APP_ORS_API_KEY=your_ORS_api_key
REACT_APP_UNSPLASH_API_KEY=your_unsplash_api_key
```

5. Create a `.env` file in the client directory with the following variables:
```
REACT_APP_ORS_API_KEY=your_ORS_api_key
REACT_APP_WEATHER_API_KEY=your_weather_api_key
REACT_APP_UNSPLASH_API_KEY=your_unsplash_api_key
```
To get an Unsplash API key:
- Visit https://unsplash.com/developers
- Create an account and a new application
- Copy the Access Key (not the Secret key)
- The app uses this to fetch trip images based on trip type and location

6. Start the development servers:

First start with the Backend:
```bash
cd path_to_server
npm run dev
```

Then Frontend:
```bash
cd path_to_client
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

## Known Issues
- Unsplash API rate limits may trigger a fallback image under heavy usage. 
- Weather forecasts are fetched live; failures may occur if OpenWeather is unavailable. 
- Very large routes (>100 waypoints) can impact map rendering performance.
- POI data formatting can be inconsistent when loading saved trips; ensure strict schema validation.

