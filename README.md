# Trip Planner - Full-Stack Web Application

A comprehensive trip planning application for cycling and hiking enthusiasts. Plan routes, get weather forecasts, discover points of interest, and save your adventures with an intuitive web interface.

## Quick Start

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
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
WEATHER_API_KEY=your_openweathermap_api_key
PORT=5000
```

5. Create a `.env` file in the client directory with the following variables:
```
REACT_APP_UNSPLASH_API_KEY=your_unsplash_api_key
```
To get an Unsplash API key:
- Visit https://unsplash.com/developers
- Create an account and a new application
- Copy the Access Key (not the Secret key)
- The app uses this to fetch trip images based on trip type and location

6. Start the development servers:

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

## Known Issues

- Unsplash API rate limits may cause fallback to default images during heavy usage
- Weather forecasts are fetched live and may fail if OpenWeather API is unavailable
- Large routes (>100 waypoints) may cause performance issues in map rendering
- POI data formatting inconsistencies when loading saved trips
- Route optimization may timeout for very long distances (>500km)

## Project Overview

This is a full-stack MERN application that enables users to plan, visualize, and save cycling and hiking trips with real-time routing, weather integration, and interactive maps.

### Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │    │   Express   │    │  MongoDB    │
│   Client    │◄──►│   Server    │◄──►│  Database   │
│  (Port 3000)│    │ (Port 5000) │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │
       │            ┌──────▼──────┐
       │            │ External    │
       └───────────►│ APIs        │
                    │ • ORS       │
                    │ • Weather   │
                    │ • Unsplash  │
                    └─────────────┘
```

**Frontend**: React 18 with Material-UI components, Leaflet maps, and React Router
**Backend**: Express.js REST API with JWT authentication and bcrypt password hashing
**Database**: MongoDB with Mongoose ODM for user accounts and trip data
**External APIs**: OpenRouteService (routing), OpenWeather (forecasts), Unsplash (images)

## Features

### 🔐 User Authentication
- Secure user registration and login with bcrypt password hashing
- JWT-based authentication with protected routes
- Private trip data - users can only access their own trips

### 🗺️ Trip Planning
- **Smart Routing**: OpenRouteService integration with activity-specific profiles
  - Cycling routes 
  - Hiking trails 
  - Road trips 
- **Distance Constraints**: 
  - Cycling: ≤60km per day (auto-adjusts trip duration)
  - Hiking: 5-15km per day with circular routes (start = end)
- **Weather Integration**: 3-day forecasts from OpenWeather One Call API
- **Visual Enhancement**: Location-themed images from Unsplash API

### 📱 Trip Management
- Save planned trips with route geometry and metadata
- View trip history and personal trip library
- Load saved trips onto interactive maps
- Update and delete existing trips
- Live weather refresh for saved routes

### 🎯 Points of Interest
- Discover and add POIs along routes
- Categorized POI types (restaurants, attractions, accommodations)
- Custom POI descriptions and notes

## Tech Stack

### Frontend Dependencies
- **React 18**: Modern React with hooks and functional components
- **Material-UI**: Professional UI component library
- **Leaflet & React-Leaflet**: Interactive map rendering and controls
- **React Router**: Client-side routing and navigation
- **Axios**: HTTP client for API communication

### Backend Dependencies
- **Express.js**: Web application framework
- **MongoDB & Mongoose**: Database and ODM
- **JWT & bcryptjs**: Authentication and password security
- **CORS**: Cross-origin resource sharing
- **Multer**: File upload handling

## API Endpoints

### Authentication Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user account | No |
| POST | `/api/auth/login` | User login and JWT issuance | No |
| GET | `/api/auth/logout` | User logout (client-side) | No |

### Trip Management Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/trips` | Get all user trips | Yes |
| POST | `/api/trips` | Create new trip | Yes |
| GET | `/api/trips/:id` | Get specific trip | Yes (owner only) |
| PUT | `/api/trips/:id` | Update trip | Yes (owner only) |
| DELETE | `/api/trips/:id` | Delete trip | Yes (owner only) |

### Authentication Flow
1. User registers with email/password → Password hashed with bcrypt
2. User logs in → Server validates credentials and issues JWT
3. Client stores JWT and includes in Authorization header
4. Protected routes verify JWT and extract user ID for data filtering

## External API Integration

### OpenRouteService (Routing)
- **Documentation**: [giscience.github.io/openrouteservice](https://giscience.github.io/openrouteservice/)
- **Purpose**: Generate realistic turn-by-turn directions
- **Profiles**: `cycling-regular`, `foot-hiking`
- **Output**: GeoJSON routes with elevation and timing data

### OpenWeather (Weather Forecasts)
- **API**: One Call 3.0 - [OpenWeatherMap](https://openweathermap.org/api/one-call-3)
- **Purpose**: 3-day weather forecasts for trip start locations
- **Data**: Temperature, precipitation, wind, weather conditions

### Unsplash (Trip Images)
- **Documentation**: [Unsplash Developers](https://unsplash.com/developers)
- **Purpose**: Location-themed representative images
- **Fallback**: Default images for cycling/hiking if API fails

## Installation & Setup Full Guide

### Prerequisites
- **Node.js** 16+ and npm
- **MongoDB** (local installation or Atlas cloud)
- **API Keys** for external services (see Environment Variables)

### 1. Clone Repository 
```bash
git clone <repository-url>
cd trip-planner
```

### 2. Database Setup
Ensure MongoDB is running:
- **Local**: `mongod` command or MongoDB service
- **Atlas**: Use connection string in server `.env`

### Environment Variables

#### Server Configuration (server/.env)
```bash
# Server Settings
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/trip-planner
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trip-planner

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Weather API
WEATHER_API_KEY=your_openweathermap_api_key
```

#### Client Configuration (client/.env)
```bash
# External API Keys
REACT_APP_UNSPLASH_API_KEY=your_unsplash_access_key
REACT_APP_WEATHER_API_KEY=your_openweathermap_api_key
REACT_APP_ORS_API_KEY=your_openrouteservice_api_key

# API Base URL (for production)
REACT_APP_API_URL=http://localhost:5000
```

### Getting API Keys

#### 1. OpenRouteService
1. Visit [openrouteservice.org](https://openrouteservice.org/dev/#/signup)
2. Create developer account
3. Generate API key with Directions API access
4. Free tier: 2,000 requests/day

#### 2. OpenWeatherMap
1. Sign up at [openweathermap.org](https://home.openweathermap.org/users/sign_up)
2. Subscribe to One Call API 3.0
3. Free tier: 1,000 calls/day, 3-day forecast
4. Copy API key from dashboard

#### 3. Unsplash
1. Create account at [unsplash.com/developers](https://unsplash.com/developers)
2. Create new application
3. Get Access Key (not Secret Key)
4. Demo tier: 50 requests/hour


### 3. Backend Setup
```bash
cd server
npm install

# Edit /server/.env with your database URL, JWT secret, and API keys

# Start development server
npm run dev
```

### 4. Frontend Setup
```bash
cd ../client
npm install

# Edit /client/.env with your API keys

# Start development server
npm start
```

## Available Scripts

### Server Scripts
```bash
npm start          # Production server
npm run dev        # Development with nodemon auto-restart
```

### Client Scripts
```bash
npm start          # Development server (port 3000)
npm run build      # Production build
npm test           # Run test suite
npm run eject      # Eject from Create React App
```

## Project Structure

```
trip-planner/
├── README.md
├── client/                     # React Frontend
│   ├── public/
│   │   ├── images/            # Default trip images
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── trips/         # Trip-specific components
│   │   │       ├── CyclingPlan.js
│   │   │       ├── PointsOfInterest.js
│   │   │       ├── TripForm.js
│   │   │       ├── TripMap.js
│   │   │       └── WeatherForecast.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js # Authentication state
│   │   ├── pages/             # Route components
│   │   │   ├── Home.js        # Landing page
│   │   │   ├── Login.js       # User authentication
│   │   │   ├── Register.js    # User registration
│   │   │   ├── PlanTrip.js    # Trip planning interface
│   │   │   ├── MyTrips.js     # Trip history
│   │   │   └── User.js        # User profile
│   │   ├── services/          # API service modules
│   │   │   ├── poiService.js
│   │   │   ├── routeService.js
│   │   │   ├── tripService.js
│   │   │   ├── unsplashService.js
│   │   │   └── weatherService.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── server/                     # Express Backend
    ├── controllers/
    │   └── tripController.js   # Trip CRUD operations
    ├── middleware/
    │   └── auth.js            # JWT verification
    ├── models/
    │   ├── Trip.js            # Trip schema
    │   └── User.js            # User schema with bcrypt
    ├── routes/
    │   ├── auth.js            # Authentication endpoints
    │   ├── trips.js           # Trip management endpoints
    │   └── upload.js          # File upload handling
    ├── server.js              # Express app configuration
    ├── package.json
    └── .env.example
```

## Usage Guide

### 1. Planning a New Trip
1. **Register/Login** to your account
2. **Navigate** to "Plan Trip" page
3. **Select** trip type (Cycling or Hiking)
4. **Choose** destination country/city
5. **Add waypoints** by clicking on the map
6. **Review** generated route and weather forecast
7. **Add POIs** and customize trip details
8. **Save** your trip for future reference

### 2. Managing Saved Trips
1. **Visit** "My Trips" page
2. **Click** on any trip card to view details
3. **Update** trip information as needed
4. **Delete** trips you no longer need
5. **Export** trip data for offline use

### 3. Route Customization
- **Drag** waypoint markers to adjust routes
- **Add** intermediate stops for breaks
- **View** elevation profiles for cycling routes
- **Check** distance and duration estimates

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MongoDB status
# Local: brew services start mongodb-community
# Or start mongod manually

# Verify connection string in server/.env
MONGODB_URI=mongodb://localhost:27017/trip-planner
```

**API Key Errors**
- Verify all API keys are correctly copied to `.env` files
- Check API key permissions and rate limits
- Ensure no trailing spaces in environment variables
- Restart development servers after changing `.env`

**Route Generation Fails**
- Confirm OpenRouteService API key is valid
- Check if coordinates are within service coverage
- Verify trip type matches available routing profiles
- Try shorter routes if timeout occurs

**Weather Data Not Loading**
- Ensure OpenWeather API key is active
- Verify One Call 3.0 subscription
- Check coordinate format (latitude, longitude)
- Monitor API rate limits

**Map Display Issues**
- Check browser console for Leaflet errors
- Ensure stable internet for map tiles
- Clear browser cache if tiles don't load
- Verify React-Leaflet version compatibility

### Development Tips

- **API Testing**: Use Postman or curl to test endpoints
- **Database Inspection**: Use MongoDB Compass or CLI
- **Error Monitoring**: Check browser console and server logs
- **Performance**: Monitor network requests in DevTools

## Security Considerations

- **Password Security**: bcrypt with 10 salt rounds
- **JWT Tokens**: Secure secret keys (minimum 32 characters)
- **API Keys**: Environment variables only, never in code
- **CORS**: Configured for specific origins in production
- **Input Validation**: Server-side validation for all endpoints
- **Route Protection**: JWT verification for all protected routes

## Deployment

### Environment Setup
1. Set production environment variables
2. Configure MongoDB Atlas for production database
3. Update CORS settings for production domain
4. Set NODE_ENV=production

### Build Process
```bash
# Build client for production
cd client
npm run build

# Production server with built client
cd ../server
NODE_ENV=production npm start
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Documentation References

- **React**: [react.dev](https://react.dev) - Frontend framework
- **Express.js**: [expressjs.com](https://expressjs.com) - Backend framework  
- **Leaflet**: [leafletjs.com](https://leafletjs.com) - Interactive maps
- **OpenRouteService**: [giscience.github.io/openrouteservice](https://giscience.github.io/openrouteservice/) - Routing API
- **OpenWeather**: [openweathermap.org/api](https://openweathermap.org/api) - Weather API
- **Unsplash**: [unsplash.com/developers](https://unsplash.com/developers) - Image API
- **JWT**: [jwt.io](https://jwt.io) & [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) - Authentication
- **bcrypt**: [npmjs.com/package/bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing

## License

This project is developed for educational purposes. Please respect external API terms of service and rate limits.

---

**Happy Trip Planning! 🚴‍♂️🥾🗺️**
