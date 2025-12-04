import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyTripsPage.css";

function MyTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("all"); // all, upcoming, completed

  useEffect(() => {
    // Load trips from localStorage
    const savedTrips = localStorage.getItem("myTrips");
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    }
  }, []);

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

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const getFlightStatus = (departureTime) => {
    const now = new Date();
    const departure = new Date(departureTime);
    if (departure < now) {
      return "completed";
    }
    return "upcoming";
  };

  const filteredTrips = trips.filter((trip) => {
    if (filter === "all") return true;
    const status = getFlightStatus(trip.departure_time);
    return status === filter;
  });

  const deleteTrip = (bookingId) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      const updatedTrips = trips.filter((trip) => trip.bookingId !== bookingId);
      setTrips(updatedTrips);
      localStorage.setItem("myTrips", JSON.stringify(updatedTrips));
    }
  };

  return (
    <div className="mytrips-page">
      <header className="mytrips-header">
        <div className="header-left">
          <button onClick={() => navigate("/")} className="back-btn">
            ← Back to Search
          </button>
        </div>
        <div className="header-center">
          <h1>
            <span className="header-icon">📋</span>
            My Trips
          </h1>
        </div>
        <div className="header-right">
          <span className="trip-count">{trips.length} Booking(s)</span>
        </div>
      </header>

      <div className="mytrips-container">
        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Trips
          </button>
          <button
            className={`filter-tab ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <div className="no-trips">
            <div className="no-trips-icon">✈️</div>
            <h2>No trips found</h2>
            <p>
              {filter === "all"
                ? "You haven't made any bookings yet."
                : `No ${filter} trips found.`}
            </p>
            <button
              onClick={() => navigate("/")}
              className="search-flights-btn"
            >
              Search Flights
            </button>
          </div>
        ) : (
          <div className="trips-list">
            {filteredTrips.map((trip, index) => (
              <div
                key={trip.bookingId || index}
                className={`trip-card ${getFlightStatus(trip.departure_time)}`}
              >
                <div className="trip-status-badge">
                  {getFlightStatus(trip.departure_time) === "upcoming"
                    ? "✈️ Upcoming"
                    : "✅ Completed"}
                </div>

                <div className="trip-header">
                  <div className="booking-id">
                    <span className="id-label">Booking ID:</span>
                    <span className="id-value">{trip.bookingId}</span>
                  </div>
                  <div className="trip-type-badge">
                    {trip.tripType === "round-trip" ? "Round Trip" : "One Way"}
                  </div>
                </div>

                <div className="trip-route">
                  <div className="route-point">
                    <span className="airport-code">
                      {trip.departure_airport}
                    </span>
                    <span className="airport-label">From</span>
                  </div>
                  <div className="route-line">
                    <span className="plane-icon">✈</span>
                    <div className="line"></div>
                  </div>
                  <div className="route-point">
                    <span className="airport-code">{trip.arrival_airport}</span>
                    <span className="airport-label">To</span>
                  </div>
                </div>

                <div className="trip-details">
                  <div className="detail-item">
                    <span className="detail-icon">🛫</span>
                    <div className="detail-info">
                      <span className="detail-label">Departure</span>
                      <span className="detail-value">
                        {formatDateTime(trip.departure_time)}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🛬</span>
                    <div className="detail-info">
                      <span className="detail-label">Arrival</span>
                      <span className="detail-value">
                        {formatDateTime(trip.arrival_time)}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🎫</span>
                    <div className="detail-info">
                      <span className="detail-label">Airline</span>
                      <span className="detail-value">
                        {trip.airline_name || trip.airline_code}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">👥</span>
                    <div className="detail-info">
                      <span className="detail-label">Passengers</span>
                      <span className="detail-value">
                        {trip.passengers} person(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="trip-footer">
                  <div className="trip-price">
                    <span className="price-label">Total Price</span>
                    <span className="price-value">
                      {formatPrice(trip.totalPrice, trip.currency)}
                    </span>
                  </div>
                  <div className="trip-actions">
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deleteTrip(trip.bookingId)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Passenger Names */}
                <div className="passenger-list">
                  <span className="passenger-label">Passengers:</span>
                  <div className="passenger-names">
                    {trip.passengerNames?.map((name, idx) => (
                      <span key={idx} className="passenger-name">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTripsPage;
