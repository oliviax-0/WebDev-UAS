# Flight Booking System with Amadeus API

A full-stack flight booking application using Django REST Framework and React with real-time Amadeus API integration.

## Features

✅ **Real-Time Flight Search**: Search flights using Amadeus API
✅ **Dynamic Form**: Return date field shows/hides based on trip type (one-way/round-trip)
✅ **Flight Results Display**: Shows airline code, flight details, departure/arrival times, and prices
✅ **Data Persistence**: Selected flight data passes seamlessly to booking page
✅ **Booking Submission**: Enter passenger name and passport number to complete booking
✅ **Database Storage**: All bookings saved to SQLite database

## Tech Stack

### Backend

- Django 6.0
- Django REST Framework
- Django CORS Headers
- Amadeus Python SDK
- SQLite Database

### Frontend

- React 19
- React Router DOM
- Axios
- Vite

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies (already done):

   ```bash
   pip install djangorestframework django-cors-headers amadeus
   ```

3. Run migrations (already done):

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. Start Django server:
   ```bash
   python manage.py runserver
   ```
   Backend will run at: http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies (already done):

   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Frontend will run at: http://localhost:5173

## API Endpoints

- `GET /api/search/` - Search flights
  - Parameters: `origin`, `destination`, `departure_date`, `return_date` (optional), `adults`
- `POST /api/bookings/` - Create booking
  - Body: `passenger_name`, `passport_number`, flight details
- `GET /api/bookings/list/` - Get all bookings

## Usage

1. **Search Flights**: Enter origin, destination, dates, and trip type
2. **Select Trip Type**: Choose "One Way" (return date hidden) or "Round Trip" (return date shown)
3. **View Results**: Browse available flights with all details
4. **Select Flight**: Click "Select Flight" on your preferred option
5. **Complete Booking**: Enter passenger information and confirm

## Airport Codes Examples

- JFK - New York John F. Kennedy
- LAX - Los Angeles
- ORD - Chicago O'Hare
- LHR - London Heathrow
- CDG - Paris Charles de Gaulle
- DXB - Dubai
- SYD - Sydney

## Notes

- Amadeus API credentials are configured in `backend/bookings/views.py`
- CORS is configured for localhost:5173 (Vite) and localhost:3000
- All flight data comes from real-time Amadeus API - no static/fake data
