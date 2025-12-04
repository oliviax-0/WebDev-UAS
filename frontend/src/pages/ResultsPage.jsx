import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ResultsPage.css";

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flights, searchParams, returnFlights } = location.state || {
    flights: [],
    searchParams: {},
    returnFlights: [],
  };

  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState(null);
  const [showReturnFlights, setShowReturnFlights] = useState(false);

  const handleSelectFlight = (flight) => {
    // For round trip, first select departure, then show return flights
    if (searchParams.tripType === "round-trip" && !selectedDepartureFlight) {
      setSelectedDepartureFlight(flight);
      setShowReturnFlights(true);
      // Scroll to return flights section
      setTimeout(() => {
        document
          .getElementById("return-flights")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (
      searchParams.tripType === "round-trip" &&
      selectedDepartureFlight
    ) {
      // Navigate to booking with both flights
      navigate("/booking", {
        state: {
          departureFlight: selectedDepartureFlight,
          returnFlight: flight,
          searchParams,
        },
      });
    } else {
      // One way trip
      navigate("/booking", {
        state: {
          flight,
          searchParams,
        },
      });
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (duration) => {
    // Duration format: PT2H30M
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;

    const hours = match[1] ? match[1].replace("H", "h ") : "";
    const minutes = match[2] ? match[2].replace("M", "m") : "";
    return hours + minutes;
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

  if (!flights || flights.length === 0) {
    return (
      <div className="results-page">
        <div className="results-container">
          <h1>No Flights Found</h1>
          <p>
            No flights match your search criteria. Please try again with
            different parameters.
          </p>
          <button onClick={() => navigate("/")} className="back-button">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="header-content">
          <h1>
            {showReturnFlights
              ? "Select Return Flight"
              : "Select Departure Flight"}
          </h1>
          <p>
            {showReturnFlights
              ? `Return: ${searchParams.destination} → ${searchParams.origin}`
              : `Departure: ${searchParams.origin} → ${searchParams.destination}`}
          </p>
        </div>
        <button onClick={() => navigate("/")} className="back-button-small">
          ← Back to Search
        </button>
      </header>

      <div className="results-container">
        {showReturnFlights && selectedDepartureFlight && (
          <div className="selected-flight-banner">
            <div>
              <strong>✓ Departure Flight Selected</strong>
              <br />
              {selectedDepartureFlight.airline_name} -
              {formatDateTime(selectedDepartureFlight.departure_time)}
            </div>
            <button
              onClick={() => {
                setSelectedDepartureFlight(null);
                setShowReturnFlights(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="change-flight-button"
            >
              ← Change Departure Flight
            </button>
          </div>
        )}

        {!showReturnFlights && (
          <div className="flights-list">
            {flights.map((flight, index) => (
              <div key={index} className="flight-card">
                <div className="flight-header">
                  <div className="airline-info">
                    <span className="airline-name">
                      {flight.airline_name || flight.airline_code}
                    </span>
                    <span className="airline-code">
                      ({flight.airline_code})
                    </span>
                    <span className="flight-number">
                      Flight {flight.flight_number}
                    </span>
                  </div>
                  <div className="price-info">
                    <span className="price">
                      {formatPrice(flight.price, flight.currency)}
                    </span>
                  </div>
                </div>

                <div className="flight-details">
                  <div className="route-info">
                    <div className="departure">
                      <div className="airport-code">
                        {flight.departure_airport}
                      </div>
                      <div className="time">
                        {formatDateTime(flight.departure_time)}
                      </div>
                    </div>

                    <div className="flight-path">
                      <div className="duration">
                        {formatDuration(flight.duration)}
                      </div>
                      <div className="arrow">→</div>
                      {flight.stops > 0 && (
                        <div className="stops-info">
                          {flight.stops} {flight.stops === 1 ? "stop" : "stops"}
                        </div>
                      )}
                    </div>

                    <div className="arrival">
                      <div className="airport-code">
                        {flight.arrival_airport}
                      </div>
                      <div className="time">
                        {formatDateTime(flight.arrival_time)}
                      </div>
                    </div>
                  </div>

                  {flight.numberOfBookableSeats !== "N/A" && (
                    <div className="seats-info">
                      {flight.numberOfBookableSeats} seats available
                    </div>
                  )}

                  {flight.stops > 0 && flight.segments && (
                    <div className="connection-details">
                      <strong>Connection details:</strong>
                      {flight.segments.map((seg, idx) => (
                        <div key={idx} className="segment-info">
                          {seg.departure_airport} → {seg.arrival_airport}
                          {idx < flight.segments.length - 1 && " ✈ "}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectFlight(flight)}
                  className="select-button"
                >
                  {searchParams.tripType === "round-trip" && !showReturnFlights
                    ? "Select Departure →"
                    : "Select Flight"}
                </button>
              </div>
            ))}
          </div>
        )}

        {showReturnFlights && returnFlights && returnFlights.length > 0 && (
          <div
            id="return-flights"
            className="flights-list return-flights-section"
          >
            <h2 className="section-title">Return Flights</h2>
            {returnFlights.map((flight, index) => (
              <div key={index} className="flight-card">
                <div className="flight-header">
                  <div className="airline-info">
                    <span className="airline-name">
                      {flight.airline_name || flight.airline_code}
                    </span>
                    <span className="airline-code">
                      ({flight.airline_code})
                    </span>
                    <span className="flight-number">
                      Flight {flight.flight_number}
                    </span>
                  </div>
                  <div className="price-info">
                    <span className="price">
                      {formatPrice(flight.price, flight.currency)}
                    </span>
                  </div>
                </div>

                <div className="flight-details">
                  <div className="route-info">
                    <div className="departure">
                      <div className="airport-code">
                        {flight.departure_airport}
                      </div>
                      <div className="time">
                        {formatDateTime(flight.departure_time)}
                      </div>
                    </div>

                    <div className="flight-path">
                      <div className="duration">
                        {formatDuration(flight.duration)}
                      </div>
                      <div className="arrow">→</div>
                      {flight.stops > 0 && (
                        <div className="stops-info">
                          {flight.stops} {flight.stops === 1 ? "stop" : "stops"}
                        </div>
                      )}
                    </div>

                    <div className="arrival">
                      <div className="airport-code">
                        {flight.arrival_airport}
                      </div>
                      <div className="time">
                        {formatDateTime(flight.arrival_time)}
                      </div>
                    </div>
                  </div>

                  {flight.numberOfBookableSeats !== "N/A" && (
                    <div className="seats-info">
                      {flight.numberOfBookableSeats} seats available
                    </div>
                  )}

                  {flight.stops > 0 && flight.segments && (
                    <div className="connection-details">
                      <strong>Connection details:</strong>
                      {flight.segments.map((seg, idx) => (
                        <div key={idx} className="segment-info">
                          {seg.departure_airport} → {seg.arrival_airport}
                          {idx < flight.segments.length - 1 && " ✈ "}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectFlight(flight)}
                  className="select-button"
                >
                  Select Return Flight →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;
