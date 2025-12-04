from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from amadeus import Client, ResponseError
from .models import Booking
from decimal import Decimal

# Initialize Amadeus client
# NOTE: This is using Amadeus Test Environment with limited sample data
# For full real-time data from all airlines, upgrade to Production API
# Test Environment has limited routes and dates available
amadeus = Client(
    client_id='OmrWfxumvmvLZhsFrGrdVmDFf5tBAgJM',
    client_secret='tU6y1Nsr3iRCPGWv'
)
# Airline code to name mapping
AIRLINE_NAMES = {
    'AA': 'American Airlines',
    'AC': 'Air Canada',
    'AF': 'Air France',
    'AI': 'Air India',
    'AK': 'AirAsia',
    'AM': 'Aeroméxico',
    'AR': 'Aerolíneas Argentinas',
    'AS': 'Alaska Airlines',
    'AY': 'Finnair',
    'AZ': 'ITA Airways',
    'BA': 'British Airways',
    'BR': 'EVA Air',
    'CA': 'Air China',
    'CI': 'China Airlines',
    'CX': 'Cathay Pacific',
    'CZ': 'China Southern Airlines',
    'DL': 'Delta Air Lines',
    'EK': 'Emirates',
    'ET': 'Ethiopian Airlines',
    'EY': 'Etihad Airways',
    'FZ': 'flydubai',
    'GA': 'Garuda Indonesia',
    'GF': 'Gulf Air',
    'HA': 'Hawaiian Airlines',
    'HU': 'Hainan Airlines',
    'IB': 'Iberia',
    'JL': 'Japan Airlines',
    'JQ': 'Jetstar Airways',
    'KE': 'Korean Air',
    'KL': 'KLM Royal Dutch Airlines',
    'LH': 'Lufthansa',
    'LX': 'Swiss International Air Lines',
    'MH': 'Malaysia Airlines',
    'MS': 'EgyptAir',
    'MU': 'China Eastern Airlines',
    'NH': 'All Nippon Airways',
    'NZ': 'Air New Zealand',
    'OS': 'Austrian Airlines',
    'OZ': 'Asiana Airlines',
    'PR': 'Philippine Airlines',
    'QF': 'Qantas',
    'QR': 'Qatar Airways',
    'SA': 'South African Airways',
    'SG': 'SpiceJet',
    'SK': 'Scandinavian Airlines',
    'SQ': 'Singapore Airlines',
    'SU': 'Aeroflot',
    'SV': 'Saudia',
    'TG': 'Thai Airways',
    'TK': 'Turkish Airlines',
    'TP': 'TAP Air Portugal',
    'UA': 'United Airlines',
    'UL': 'SriLankan Airlines',
    'VA': 'Virgin Australia',
    'VN': 'Vietnam Airlines',
    'VS': 'Virgin Atlantic',
    'WY': 'Oman Air',
    'QZ': 'Indonesia AirAsia',
    'ID': 'Batik Air',
    'JT': 'Lion Air',
    'SJ': 'Sriwijaya Air',
    '3K': 'Jetstar Asia',
    'TR': 'Scoot',
    'FD': 'Thai AirAsia',
    'D7': 'AirAsia X',
}

def get_airline_name(code):
    """Get airline name from code, return code if not found"""
    return AIRLINE_NAMES.get(code, code)

@api_view(['GET'])
def search_airports(request):
    """
    Search for airports using Amadeus API
    Parameters: keyword (city name, airport name, or IATA code)
    """
    try:
        keyword = request.GET.get('keyword', '').strip()
        
        if not keyword or len(keyword) < 2:
            return Response({
                'success': False,
                'error': 'Please enter at least 2 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use Amadeus Airport & City Search API
        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType='AIRPORT,CITY'
        )
        
        airports = []
        for location in response.data:
            airport_data = {
                'code': location.get('iataCode', ''),
                'name': location.get('name', ''),
                'city': location.get('address', {}).get('cityName', ''),
                'country': location.get('address', {}).get('countryName', ''),
                'type': location.get('subType', '')
            }
            
            # Only include results with IATA code
            if airport_data['code']:
                airports.append(airport_data)
        
        return Response({
            'success': True,
            'airports': airports  # Return all results (no limit)
        })
        
    except ResponseError as error:
        return Response({
            'success': False,
            'error': 'Failed to search airports',
            'details': str(error)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            'success': False,
            'error': 'An error occurred while searching airports',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_popular_destinations(request):
    """
    Get popular travel destinations using Amadeus API
    Returns most traveled destinations based on flight search analytics
    """
    try:
        # Use Amadeus Travel Recommendations API
        response = amadeus.reference_data.recommended_locations.get()
        
        destinations = []
        for location in response.data[:8]:  # Limit to 8 destinations
            dest_data = {
                'code': location.get('iataCode', ''),
                'name': location.get('name', ''),
                'city': location.get('address', {}).get('cityName', ''),
                'country': location.get('address', {}).get('countryName', ''),
                'type': location.get('type', ''),
                'relevance': location.get('relevance', 0)
            }
            
            if dest_data['code']:
                destinations.append(dest_data)
        
        # If API doesn't return data, provide fallback popular destinations
        if not destinations:
            destinations = [
                {'code': 'PAR', 'city': 'Paris', 'country': 'France', 'name': 'Paris', 'image': 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&q=80'},
                {'code': 'LON', 'city': 'London', 'country': 'United Kingdom', 'name': 'London', 'image': 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800&q=80'},
                {'code': 'NYC', 'city': 'New York', 'country': 'United States', 'name': 'New York', 'image': 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80'},
                {'code': 'DXB', 'city': 'Dubai', 'country': 'United Arab Emirates', 'name': 'Dubai', 'image': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80'},
                {'code': 'TYO', 'city': 'Tokyo', 'country': 'Japan', 'name': 'Tokyo', 'image': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80'},
                {'code': 'BKK', 'city': 'Bangkok', 'country': 'Thailand', 'name': 'Bangkok', 'image': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80'},
                {'code': 'SIN', 'city': 'Singapore', 'country': 'Singapore', 'name': 'Singapore', 'image': 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80'},
                {'code': 'IST', 'city': 'Istanbul', 'country': 'Turkey', 'name': 'Istanbul', 'image': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80'}
            ]
        
        return Response({
            'success': True,
            'destinations': destinations
        })
        
    except ResponseError as error:
        # Return fallback destinations on API error
        fallback_destinations = [
            {'code': 'PAR', 'city': 'Paris', 'country': 'France', 'name': 'Paris', 'image': 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&q=80'},
            {'code': 'LON', 'city': 'London', 'country': 'United Kingdom', 'name': 'London', 'image': 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800&q=80'},
            {'code': 'NYC', 'city': 'New York', 'country': 'United States', 'name': 'New York', 'image': 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80'},
            {'code': 'DXB', 'city': 'Dubai', 'country': 'United Arab Emirates', 'name': 'Dubai', 'image': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80'},
            {'code': 'TYO', 'city': 'Tokyo', 'country': 'Japan', 'name': 'Tokyo', 'image': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80'},
            {'code': 'BKK', 'city': 'Bangkok', 'country': 'Thailand', 'name': 'Bangkok', 'image': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80'},
            {'code': 'SIN', 'city': 'Singapore', 'country': 'Singapore', 'name': 'Singapore', 'image': 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80'},
            {'code': 'IST', 'city': 'Istanbul', 'country': 'Turkey', 'name': 'Istanbul', 'image': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80'}
        ]
        return Response({
            'success': True,
            'destinations': fallback_destinations
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': 'An error occurred while fetching popular destinations',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def search_flights(request):
    """
    Search for flights using Amadeus API
    Parameters: origin, destination, departure_date, return_date (optional), adults
    """
    try:
        origin = request.GET.get('origin')
        destination = request.GET.get('destination')
        departure_date = request.GET.get('departure_date')
        return_date = request.GET.get('return_date')
        adults = request.GET.get('adults', 1)
        
        print(f"Search request: {origin} -> {destination}, Date: {departure_date}, Adults: {adults}")
        
        # Validate required parameters
        if not all([origin, destination, departure_date]):
            return Response(
                {
                    'success': False,
                    'error': 'Missing required parameters: origin, destination, departure_date',
                    'details': f'Received - origin: {origin}, destination: {destination}, departure_date: {departure_date}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search for flight offers with IDR currency
        search_params = {
            'originLocationCode': origin,
            'destinationLocationCode': destination,
            'departureDate': departure_date,
            'adults': adults,
            'currencyCode': 'IDR',  # Set currency to Indonesian Rupiah
            'max': 50  # Increased to get more flight options from different airlines
        }
        
        if return_date:
            search_params['returnDate'] = return_date
        
        print(f"Calling Amadeus API with params: {search_params}")
        
        response = amadeus.shopping.flight_offers_search.get(**search_params)
        
        print(f"Amadeus API returned {len(response.data)} offers")
        
        # Format the response for frontend
        flights = []
        for offer in response.data:
            for itinerary in offer['itineraries']:
                # Get all segments
                segments = itinerary['segments']
                
                # For direct flights or connecting flights, show the complete journey
                first_segment = segments[0]
                last_segment = segments[-1]
                
                # Determine if it's a direct or connecting flight
                is_direct = len(segments) == 1
                stops = len(segments) - 1
                
                # Build airline info (primary carrier is first segment)
                airline_code = first_segment['carrierCode']
                
                flight_info = {
                    'id': offer['id'],
                    'airline_code': airline_code,
                    'airline_name': get_airline_name(airline_code),
                    'flight_number': first_segment['number'],
                    'departure_airport': first_segment['departure']['iataCode'],
                    'departure_time': first_segment['departure']['at'],
                    'arrival_airport': last_segment['arrival']['iataCode'],
                    'arrival_time': last_segment['arrival']['at'],
                    'duration': itinerary['duration'],
                    'price': offer['price']['total'],
                    'currency': offer['price']['currency'],
                    'numberOfBookableSeats': offer.get('numberOfBookableSeats', 'N/A'),
                    'stops': stops,
                    'is_direct': is_direct,
                    'segments': [
                        {
                            'departure_airport': seg['departure']['iataCode'],
                            'arrival_airport': seg['arrival']['iataCode'],
                            'departure_time': seg['departure']['at'],
                            'arrival_time': seg['arrival']['at'],
                            'carrier': seg['carrierCode'],
                            'flight_number': seg['number']
                        } for seg in segments
                    ]
                }
                flights.append(flight_info)
        
        print(f"Returning {len(flights)} formatted flights")
        
        return Response({
            'success': True,
            'flights': flights,
            'count': len(flights)
        })
        
    except ResponseError as error:
        error_message = str(error)
        error_details = error.description if hasattr(error, 'description') else 'Amadeus API error'
        print(f"Amadeus API Error: {error_message} - {error_details}")
        return Response(
            {
                'success': False,
                'error': error_message,
                'details': error_details
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print(f"Unexpected error: {type(e).__name__} - {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {
                'success': False,
                'error': 'An error occurred',
                'details': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def create_booking(request):
    """
    Create a new booking
    Expected data: passenger_name, passport_number, flight details
    """
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['passenger_name', 'passport_number', 'airline_code', 
                          'departure_airport', 'arrival_airport', 'departure_time',
                          'arrival_time', 'price']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create booking
        booking = Booking.objects.create(
            passenger_name=data['passenger_name'],
            passport_number=data['passport_number'],
            airline_code=data['airline_code'],
            departure_airport=data['departure_airport'],
            arrival_airport=data['arrival_airport'],
            departure_time=data['departure_time'],
            arrival_time=data['arrival_time'],
            price=Decimal(str(data['price'])),
            currency=data.get('currency', 'USD'),
            trip_type=data.get('trip_type', 'one-way')
        )
        
        return Response({
            'success': True,
            'message': 'Booking created successfully',
            'booking_id': booking.id,
            'booking': {
                'id': booking.id,
                'passenger_name': booking.passenger_name,
                'passport_number': booking.passport_number,
                'airline_code': booking.airline_code,
                'departure_airport': booking.departure_airport,
                'arrival_airport': booking.arrival_airport,
                'departure_time': booking.departure_time,
                'arrival_time': booking.arrival_time,
                'price': str(booking.price),
                'currency': booking.currency
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to create booking', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_bookings(request):
    """
    Get all bookings
    """
    try:
        bookings = Booking.objects.all().order_by('-created_at')
        bookings_data = [{
            'id': booking.id,
            'passenger_name': booking.passenger_name,
            'passport_number': booking.passport_number,
            'airline_code': booking.airline_code,
            'departure_airport': booking.departure_airport,
            'arrival_airport': booking.arrival_airport,
            'departure_time': booking.departure_time,
            'arrival_time': booking.arrival_time,
            'price': str(booking.price),
            'currency': booking.currency,
            'created_at': booking.created_at
        } for booking in bookings]
        
        return Response({
            'success': True,
            'bookings': bookings_data,
            'count': len(bookings_data)
        })
    except Exception as e:
        return Response(
            {'error': 'Failed to fetch bookings', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )