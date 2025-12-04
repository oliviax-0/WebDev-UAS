import { useLocation, useNavigate } from "react-router-dom";
import "./ResultsPage.css";

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flights, searchParams } = location.state || {
    flights: [],
    searchParams: {},
  };

  const handleSelectFlight = (flight) => {
    // Navigate to booking page with selected flight data
    navigate("/booking", {
      state: {
        flight,
        searchParams,
      },
    });
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
      <div className="results-container">
        <div className="results-header">
          <h1>Available Flights</h1>
          <p>
            Found {flights.length} flights from {searchParams.origin} to{" "}
            {searchParams.destination}
          </p>
          <button onClick={() => navigate("/")} className="back-button-small">
            ← New Search
          </button>
        </div>

        <div className="flights-list">
          {flights.map((flight, index) => (
            <div key={index} className="flight-card">
              <div className="flight-header">
                <div className="airline-info">
                  <span className="airline-name">
                    {flight.airline_name || flight.airline_code}
                  </span>
                  <span className="airline-code">({flight.airline_code})</span>
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
                    <div className="airport-code">{flight.arrival_airport}</div>
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
                Select Flight
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
