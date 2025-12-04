from django.db import models

# Create your models here.
class Booking(models.Model):
    passenger_name = models.CharField(max_length=200)
    passport_number = models.CharField(max_length=50)
    airline_code = models.CharField(max_length=10)
    departure_airport = models.CharField(max_length=10)
    arrival_airport = models.CharField(max_length=10)
    departure_time = models.CharField(max_length=50)
    arrival_time = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    trip_type = models.CharField(max_length=20, default='one-way')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.passenger_name} - {self.airline_code} - {self.departure_airport} to {self.arrival_airport}"
