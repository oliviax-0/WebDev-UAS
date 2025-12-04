import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BookingPage.css";

function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flight, departureFlight, returnFlight, searchParams } =
    location.state || {};

  // Get number of passengers from search params
  const numPassengers = searchParams?.passengers || 1;

  // Initialize form data with array of passengers
  const [formData, setFormData] = useState({
    passengers: Array(numPassengers)
      .fill(null)
      .map(() => ({
        passengerName: "",
        passportNumber: "",
      })),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Support both old (single flight) and new (round trip) format
  const isRoundTrip = departureFlight && returnFlight;
  const singleFlight = flight;

  if (!flight && !departureFlight) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <h1>No Flight Selected</h1>
          <p>Please select a flight from the search results.</p>
          <button onClick={() => navigate("/")} className="back-button">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const handlePassengerChange = (index, field, value) => {
    setFormData((prev) => {
      const newPassengers = [...prev.passengers];
      newPassengers[index] = {
        ...newPassengers[index],
        [field]: value,
      };
      return { ...prev, passengers: newPassengers };
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate all passengers have filled in their info
      const invalidPassenger = formData.passengers.find(
        (p) => !p.passengerName || !p.passportNumber
      );

      if (invalidPassenger) {
        setError("Please fill in all passenger details");
        setLoading(false);
        return;
      }

      // Prepare booking data for round trip or one-way
      if (isRoundTrip) {
        // For round trip, create bookings for each passenger on both flights
        const departureBookings = formData.passengers.map((passenger) => ({
          passenger_name: passenger.passengerName,
          passport_number: passenger.passportNumber,
          airline_code: departureFlight.airline_code,
          departure_airport: departureFlight.departure_airport,
          arrival_airport: departureFlight.arrival_airport,
          departure_time: departureFlight.departure_time,
          arrival_time: departureFlight.arrival_time,
          price: departureFlight.price,
          currency: departureFlight.currency,
          trip_type: "round-trip-departure",
        }));

        const returnBookings = formData.passengers.map((passenger) => ({
          passenger_name: passenger.passengerName,
          passport_number: passenger.passportNumber,
          airline_code: returnFlight.airline_code,
          departure_airport: returnFlight.departure_airport,
          arrival_airport: returnFlight.arrival_airport,
          departure_time: returnFlight.departure_time,
          arrival_time: returnFlight.arrival_time,
          price: returnFlight.price,
          currency: returnFlight.currency,
          trip_type: "round-trip-return",
        }));

        // Submit all bookings
        const allBookings = [...departureBookings, ...returnBookings];
        const responses = await Promise.all(
          allBookings.map((booking) =>
            axios.post("http://localhost:8000/api/bookings/", booking)
          )
        );

        if (responses.every((res) => res.data.success)) {
          // Save to localStorage for MyTrips page
          const bookingId = `BK${Date.now()}`;
          const tripData = {
            bookingId,
            tripType: "round-trip",
            departure_airport: departureFlight.departure_airport,
            arrival_airport: departureFlight.arrival_airport,
            departure_time: departureFlight.departure_time,
            arrival_time: departureFlight.arrival_time,
            airline_code: departureFlight.airline_code,
            airline_name: departureFlight.airline_name,
            totalPrice:
              parseFloat(departureFlight.price) +
              parseFloat(returnFlight.price),
            currency: departureFlight.currency,
            passengers: formData.passengers.length,
            passengerNames: formData.passengers.map((p) => p.passengerName),
            bookedAt: new Date().toISOString(),
            returnFlight: {
              departure_airport: returnFlight.departure_airport,
              arrival_airport: returnFlight.arrival_airport,
              departure_time: returnFlight.departure_time,
              arrival_time: returnFlight.arrival_time,
            },
          };

          const existingTrips = JSON.parse(
            localStorage.getItem("myTrips") || "[]"
          );
          existingTrips.push(tripData);
          localStorage.setItem("myTrips", JSON.stringify(existingTrips));

          setSuccess(true);
          setTimeout(() => {
            navigate("/my-trips");
          }, 3000);
        }
      } else {
        // One-way bookings for each passenger
        const bookings = formData.passengers.map((passenger) => ({
          passenger_name: passenger.passengerName,
          passport_number: passenger.passportNumber,
          airline_code: singleFlight.airline_code,
          departure_airport: singleFlight.departure_airport,
          arrival_airport: singleFlight.arrival_airport,
          departure_time: singleFlight.departure_time,
          arrival_time: singleFlight.arrival_time,
          price: singleFlight.price,
          currency: singleFlight.currency,
          trip_type: searchParams?.tripType || "one-way",
        }));

        const responses = await Promise.all(
          bookings.map((booking) =>
            axios.post("http://localhost:8000/api/bookings/", booking)
          )
        );

        if (responses.every((res) => res.data.success)) {
          // Save to localStorage for MyTrips page
          const bookingId = `BK${Date.now()}`;
          const tripData = {
            bookingId,
            tripType: searchParams?.tripType || "one-way",
            departure_airport: singleFlight.departure_airport,
            arrival_airport: singleFlight.arrival_airport,
            departure_time: singleFlight.departure_time,
            arrival_time: singleFlight.arrival_time,
            airline_code: singleFlight.airline_code,
            airline_name: singleFlight.airline_name,
            totalPrice:
              parseFloat(singleFlight.price) * formData.passengers.length,
            currency: singleFlight.currency,
            passengers: formData.passengers.length,
            passengerNames: formData.passengers.map((p) => p.passengerName),
            bookedAt: new Date().toISOString(),
          };

          const existingTrips = JSON.parse(
            localStorage.getItem("myTrips") || "[]"
          );
          existingTrips.push(tripData);
          localStorage.setItem("myTrips", JSON.stringify(existingTrips));

          setSuccess(true);
          setTimeout(() => {
            navigate("/my-trips");
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(
        err.response?.data?.details ||
          err.response?.data?.error ||
          "Failed to create booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price, currency) => {
    const numPrice = parseFloat(price);
    if (currency === "IDR") {
      return `Rp ${numPrice.toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      })}`;
    }
    return `${currency} ${numPrice.toFixed(2)}`;
  };

  if (success) {
    const totalPassengers = formData.passengers.length;
    const totalPrice = isRoundTrip
      ? (parseFloat(departureFlight.price) + parseFloat(returnFlight.price)) *
        totalPassengers
      : parseFloat(singleFlight.price) * totalPassengers;
    const currency = isRoundTrip
      ? departureFlight.currency
      : singleFlight.currency;

    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>Booking Completed!</h1>
            <p className="success-subtitle">
              Your flight reservation has been successfully confirmed.
            </p>

            <div className="booking-summary-card">
              <h3>Booking Summary</h3>
              <div className="summary-row">
                <span className="summary-label">Number of Passengers:</span>
                <span className="summary-value">{totalPassengers}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Route:</span>
                <span className="summary-value">
                  {isRoundTrip
                    ? `${departureFlight.departure_airport} ⇄ ${departureFlight.arrival_airport}`
                    : `${singleFlight.departure_airport} → ${singleFlight.arrival_airport}`}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Trip Type:</span>
                <span className="summary-value">
                  {isRoundTrip ? "Round Trip" : "One Way"}
                </span>
              </div>
              <div className="summary-row total-row">
                <span className="summary-label">Total Amount:</span>
                <span className="summary-value price">
                  {formatPrice(totalPrice, currency)}
                </span>
              </div>
            </div>

            <div className="payment-section">
              <h3>Continue to Payment</h3>
              <p className="payment-info">
                Please proceed with the payment to confirm your booking.
              </p>
              <button
                className="payment-button"
                onClick={() => {
                  // Here you can navigate to payment page or payment gateway
                  alert("Redirecting to payment gateway...");
                  navigate("/");
                }}
              >
                Proceed to Payment
              </button>
            </div>

            <p className="redirect-info">
              You will be redirected to the payment page shortly...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <header className="booking-header">
        <h1>Complete Your Booking</h1>
        <button onClick={() => navigate(-1)} className="back-button-header">
          ← Back
        </button>
      </header>

      <div className="booking-container">
        <div className="flight-summary">
          <h2>Flight Details</h2>

          {isRoundTrip ? (
            // Round Trip - Show both flights
            <>
              <div className="flight-details-card">
                <h3 className="flight-type-title">Departure Flight</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Airline:</span>
                    <span className="value">
                      {departureFlight.airline_name ||
                        departureFlight.airline_code}{" "}
                      ({departureFlight.airline_code}) - Flight{" "}
                      {departureFlight.flight_number}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Route:</span>
                    <span className="value">
                      {departureFlight.departure_airport} →{" "}
                      {departureFlight.arrival_airport}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Departure:</span>
                    <span className="value">
                      {formatDateTime(departureFlight.departure_time)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Arrival:</span>
                    <span className="value">
                      {formatDateTime(departureFlight.arrival_time)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Price:</span>
                    <span className="value">
                      {formatPrice(
                        departureFlight.price,
                        departureFlight.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flight-details-card">
                <h3 className="flight-type-title">Return Flight</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Airline:</span>
                    <span className="value">
                      {returnFlight.airline_name || returnFlight.airline_code} (
                      {returnFlight.airline_code}) - Flight{" "}
                      {returnFlight.flight_number}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Route:</span>
                    <span className="value">
                      {returnFlight.departure_airport} →{" "}
                      {returnFlight.arrival_airport}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Departure:</span>
                    <span className="value">
                      {formatDateTime(returnFlight.departure_time)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Arrival:</span>
                    <span className="value">
                      {formatDateTime(returnFlight.arrival_time)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Price:</span>
                    <span className="value">
                      {formatPrice(returnFlight.price, returnFlight.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="total-price-section">
                <div className="summary-item highlight">
                  <span className="label">Total Price (Both Flights):</span>
                  <span className="value price">
                    {formatPrice(
                      (
                        parseFloat(departureFlight.price) +
                        parseFloat(returnFlight.price)
                      ).toString(),
                      departureFlight.currency
                    )}
                  </span>
                </div>
              </div>
            </>
          ) : (
            // One-way - Show single flight
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Airline:</span>
                <span className="value">
                  {singleFlight.airline_name || singleFlight.airline_code} (
                  {singleFlight.airline_code}) - Flight{" "}
                  {singleFlight.flight_number}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Route:</span>
                <span className="value">
                  {singleFlight.departure_airport} →{" "}
                  {singleFlight.arrival_airport}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Departure:</span>
                <span className="value">
                  {formatDateTime(singleFlight.departure_time)}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Arrival:</span>
                <span className="value">
                  {formatDateTime(singleFlight.arrival_time)}
                </span>
              </div>
              <div className="summary-item highlight">
                <span className="label">Total Price:</span>
                <span className="value price">
                  {formatPrice(singleFlight.price, singleFlight.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <h2>Passenger Information</h2>

          {formData.passengers.map((passenger, index) => (
            <div key={index} className="passenger-section">
              <h3>Passenger {index + 1}</h3>

              <div className="form-group">
                <label htmlFor={`passengerName-${index}`}>
                  Passenger Name: *
                </label>
                <input
                  type="text"
                  id={`passengerName-${index}`}
                  value={passenger.passengerName}
                  onChange={(e) =>
                    handlePassengerChange(
                      index,
                      "passengerName",
                      e.target.value
                    )
                  }
                  placeholder="Enter full name as on passport"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor={`passportNumber-${index}`}>
                  Passport Number: *
                </label>
                <input
                  type="text"
                  id={`passportNumber-${index}`}
                  value={passenger.passportNumber}
                  onChange={(e) =>
                    handlePassengerChange(
                      index,
                      "passportNumber",
                      e.target.value
                    )
                  }
                  placeholder="Enter passport number"
                  className="form-control"
                  required
                />
              </div>
            </div>
          ))}

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="back-button"
            >
              Back to Results
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Processing..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingPage;
