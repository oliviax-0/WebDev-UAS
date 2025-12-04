import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BookingPage.css";

function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flight, searchParams } = location.state || {};

  const [formData, setFormData] = useState({
    passengerName: "",
    passportNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!flight) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate form
      if (!formData.passengerName || !formData.passportNumber) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Prepare booking data
      const bookingData = {
        passenger_name: formData.passengerName,
        passport_number: formData.passportNumber,
        airline_code: flight.airline_code,
        departure_airport: flight.departure_airport,
        arrival_airport: flight.arrival_airport,
        departure_time: flight.departure_time,
        arrival_time: flight.arrival_time,
        price: flight.price,
        currency: flight.currency,
        trip_type: searchParams?.tripType || "one-way",
      };

      // Submit booking to Django backend
      const response = await axios.post(
        "http://localhost:8000/api/bookings/",
        bookingData
      );

      if (response.data.success) {
        setSuccess(true);
        // Show success message and redirect after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
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
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>Booking Confirmed!</h1>
            <p>Your flight has been successfully booked.</p>
            <p>
              Passenger: <strong>{formData.passengerName}</strong>
            </p>
            <p>Redirecting to home page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1>Complete Your Booking</h1>

        <div className="flight-summary">
          <h2>Flight Details</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Airline:</span>
              <span className="value">
                {flight.airline_name || flight.airline_code} (
                {flight.airline_code}) - Flight {flight.flight_number}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Route:</span>
              <span className="value">
                {flight.departure_airport} → {flight.arrival_airport}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Departure:</span>
              <span className="value">
                {formatDateTime(flight.departure_time)}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Arrival:</span>
              <span className="value">
                {formatDateTime(flight.arrival_time)}
              </span>
            </div>
            <div className="summary-item highlight">
              <span className="label">Total Price:</span>
              <span className="value price">
                {formatPrice(flight.price, flight.currency)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <h2>Passenger Information</h2>

          <div className="form-group">
            <label htmlFor="passengerName">Passenger Name: *</label>
            <input
              type="text"
              id="passengerName"
              name="passengerName"
              value={formData.passengerName}
              onChange={handleChange}
              placeholder="Enter full name as on passport"
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="passportNumber">Passport Number: *</label>
            <input
              type="text"
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              placeholder="Enter passport number"
              className="form-control"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              type="button"
              onClick={() => navigate("/results", { state: location.state })}
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
