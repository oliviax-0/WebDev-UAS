from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_flights, name='search_flights'),
    path('airports/', views.search_airports, name='search_airports'),
    path('popular-destinations/', views.get_popular_destinations, name='popular_destinations'),
    path('bookings/', views.create_booking, name='create_booking'),
    path('bookings/list/', views.get_bookings, name='get_bookings'),
]
