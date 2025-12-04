import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ResultsPage.css";

// Airline logos using public APIs
const getAirlineLogo = (airlineCode) => {
  // Use a reliable airline logo API
  return `https://pics.avs.io/60/60/${airlineCode}.png`;
};

// Airline name mapping for common codes
const airlineNames = {
  A3: "Aegean Airlines",
  AA: "American Airlines",
  AC: "Air Canada",
  AF: "Air France",
  AI: "Air India",
  AK: "AirAsia",
  AY: "Finnair",
  AZ: "ITA Airways",
  BA: "British Airways",
  BR: "EVA Air",
  CA: "Air China",
  CI: "China Airlines",
  CX: "Cathay Pacific",
  CZ: "China Southern",
  DE: "Condor",
  DL: "Delta Air Lines",
  EK: "Emirates",
  ET: "Ethiopian Airlines",
  EY: "Etihad Airways",
  FY: "Firefly",
  GA: "Garuda Indonesia",
  IB: "Iberia",
  JL: "Japan Airlines",
  JQ: "Jetstar",
  KE: "Korean Air",
  KL: "KLM Royal Dutch Airlines",
  KQ: "Kenya Airways",
  LA: "LATAM Airlines",
  LH: "Lufthansa",
  LX: "Swiss International Air Lines",
  MH: "Malaysia Airlines",
  MS: "EgyptAir",
  MU: "China Eastern",
  NH: "All Nippon Airways",
  NZ: "Air New Zealand",
  OS: "Austrian Airlines",
  OZ: "Asiana Airlines",
  PC: "Pegasus Airlines",
  PG: "Bangkok Airways",
  PR: "Philippine Airlines",
  QF: "Qantas",
  QR: "Qatar Airways",
  SA: "South African Airways",
  SK: "Scandinavian Airlines",
  SN: "Brussels Airlines",
  SQ: "Singapore Airlines",
  SU: "Aeroflot",
  SV: "Saudia",
  TG: "Thai Airways",
  TK: "Turkish Airlines",
  TP: "TAP Air Portugal",
  TR: "Scoot",
  UA: "United Airlines",
  UX: "Air Europa",
  VN: "Vietnam Airlines",
  VS: "Virgin Atlantic",
  WN: "Southwest Airlines",
  WY: "Oman Air",
};

const getAirlineName = (code, providedName) => {
  if (providedName && providedName !== code) return providedName;
  return airlineNames[code] || code;
};

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Safe destructuring with fallbacks
  const stateData = location.state || {};
  const flights = stateData.flights || [];
  const searchParams = stateData.searchParams || {};
  const returnFlights = stateData.returnFlights || [];

  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState(null);
  const [showReturnFlights, setShowReturnFlights] = useState(false);
  const [sortBy, setSortBy] = useState("best");
  const [filters, setFilters] = useState({
    stops: [],
    airlines: [],
  });
  const [timeFilters, setTimeFilters] = useState({
    departureStart: 0,
    departureEnd: 24,
    arrivalStart: 0,
    arrivalEnd: 24,
  });
  const [currentFlights, setCurrentFlights] = useState(flights);
  const [currentDepartureDate, setCurrentDepartureDate] = useState(
    searchParams.departureDate || null
  );
  const [isLoadingNewDate, setIsLoadingNewDate] = useState(false);

  // Sync currentFlights when flights from location.state changes
  useEffect(() => {
    if (flights && flights.length > 0) {
      setCurrentFlights(flights);
    }
  }, [flights]);

  // Get unique airlines from flights
  const airlines = useMemo(() => {
    if (!currentFlights || !Array.isArray(currentFlights)) return [];
    const airlineSet = new Set();
    currentFlights.forEach((f) =>
      airlineSet.add(f.airline_name || f.airline_code)
    );
    return Array.from(airlineSet);
  }, [currentFlights]);

  // Helper function - defined before useMemo that uses it
  const parseDuration = (duration) => {
    if (!duration) return 0;
    const match = duration.match(/PT(\d+)H?(\d+)?M?/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    return hours * 60 + minutes;
  };

  // Get hour from time string (handles both "14:30" and "2025-12-20T14:30:00" formats)
  const getHourFromTime = (timeStr) => {
    if (!timeStr) return 0;

    // If it's an ISO datetime string (contains 'T'), extract time part
    if (timeStr.includes("T")) {
      const timePart = timeStr.split("T")[1];
      if (timePart) {
        const parts = timePart.split(":");
        return parseInt(parts[0]) || 0;
      }
    }

    // Otherwise, assume it's just time (HH:MM format)
    const parts = timeStr.split(":");
    return parseInt(parts[0]) || 0;
  };

  // Format hour to time string (e.g., 14 -> "2:00PM")
  const formatHourToTime = (hour) => {
    if (hour === 0 || hour === 24) return "12:00AM";
    if (hour === 12) return "12:00PM";
    if (hour < 12) return `${hour}:00AM`;
    return `${hour - 12}:00PM`;
  };

  // Sort and filter flights
  const sortedFlights = useMemo(() => {
    if (!currentFlights || !Array.isArray(currentFlights)) return [];
    let result = [...currentFlights];

    // Apply stop filters
    if (filters.stops.length > 0) {
      result = result.filter((f) => {
        if (filters.stops.includes("direct") && f.stops === 0) return true;
        if (filters.stops.includes("1stop") && f.stops === 1) return true;
        if (filters.stops.includes("2stops") && f.stops >= 2) return true;
        return false;
      });
    }

    // Apply airline filters
    if (filters.airlines.length > 0) {
      result = result.filter((f) =>
        filters.airlines.includes(f.airline_name || f.airline_code)
      );
    }

    // Apply time filters (only if user has changed from default 0-24 range)
    const isTimeFilterActive =
      timeFilters.departureStart > 0 ||
      timeFilters.departureEnd < 24 ||
      timeFilters.arrivalStart > 0 ||
      timeFilters.arrivalEnd < 24;

    if (isTimeFilterActive) {
      result = result.filter((f) => {
        const depHour = getHourFromTime(f.departure_time);
        const arrHour = getHourFromTime(f.arrival_time);

        const depInRange =
          depHour >= timeFilters.departureStart &&
          depHour <= timeFilters.departureEnd;
        const arrInRange =
          arrHour >= timeFilters.arrivalStart &&
          arrHour <= timeFilters.arrivalEnd;

        return depInRange && arrInRange;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "cheapest":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "fastest":
        result.sort((a, b) => {
          const durationA = parseDuration(a.duration);
          const durationB = parseDuration(b.duration);
          return durationA - durationB;
        });
        break;
      case "best":
      default:
        // Best is a combination of price and duration
        result.sort((a, b) => {
          const scoreA =
            parseFloat(a.price) * 0.7 + parseDuration(a.duration) * 100 * 0.3;
          const scoreB =
            parseFloat(b.price) * 0.7 + parseDuration(b.duration) * 100 * 0.3;
          return scoreA - scoreB;
        });
    }

    return result;
  }, [currentFlights, sortBy, filters, timeFilters]);

  const handleSelectFlight = (flight) => {
    if (searchParams.tripType === "round-trip" && !selectedDepartureFlight) {
      setSelectedDepartureFlight(flight);
      setShowReturnFlights(true);
      setTimeout(() => {
        document
          .getElementById("return-flights")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (
      searchParams.tripType === "round-trip" &&
      selectedDepartureFlight
    ) {
      navigate("/booking", {
        state: {
          departureFlight: selectedDepartureFlight,
          returnFlight: flight,
          searchParams,
        },
      });
    } else {
      navigate("/booking", {
        state: {
          flight,
          searchParams,
        },
      });
    }
  };

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase()
      .replace(" ", "");
  };

  const formatDuration = (duration) => {
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

  // Generate date tabs (5 days around current departure date)
  const generateDateTabs = () => {
    const dateToUse = currentDepartureDate || searchParams.departureDate;
    if (!dateToUse) return [];
    const baseDate = new Date(dateToUse);
    const tabs = [];
    for (let i = -2; i <= 2; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      tabs.push({
        date: date,
        dateStr: dateStr,
        label: date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        }),
        isSelected:
          dateStr === currentDepartureDate ||
          (i === 0 && !currentDepartureDate),
      });
    }
    return tabs;
  };

  const dateTabs = generateDateTabs();

  // Handle date tab click - fetch flights for new date
  const handleDateChange = async (newDate) => {
    const formattedDate = newDate.toISOString().split("T")[0];

    setIsLoadingNewDate(true);

    try {
      const params = {
        origin: searchParams.origin?.toUpperCase(),
        destination: searchParams.destination?.toUpperCase(),
        departure_date: formattedDate,
        adults: searchParams.adults || 1,
      };

      const response = await axios.get("http://localhost:8000/api/search/", {
        params,
      });

      if (response.data.success) {
        // Update the flights with new data
        setCurrentFlights(response.data.flights);
        setCurrentDepartureDate(formattedDate);

        // Update navigation state for consistency
        navigate("/results", {
          state: {
            flights: response.data.flights,
            searchParams: {
              ...searchParams,
              departureDate: formattedDate,
            },
            returnFlights: returnFlights,
          },
          replace: true,
        });
      }
    } catch (error) {
      console.error("Error fetching flights for new date:", error);
    } finally {
      setIsLoadingNewDate(false);
    }
  };

  // Get stats for sort tabs
  const getStats = () => {
    if (currentFlights.length === 0)
      return { cheapest: {}, fastest: {}, best: {} };

    const sorted = [...currentFlights].sort(
      (a, b) => parseFloat(a.price) - parseFloat(b.price)
    );
    const cheapest = sorted[0];

    const sortedByDuration = [...currentFlights].sort(
      (a, b) => parseDuration(a.duration) - parseDuration(b.duration)
    );
    const fastest = sortedByDuration[0];

    return {
      cheapest: {
        price: cheapest?.price,
        currency: cheapest?.currency,
        duration: cheapest?.duration,
      },
      fastest: {
        price: fastest?.price,
        currency: fastest?.currency,
        duration: fastest?.duration,
      },
      best: {
        price: fastest?.price,
        currency: fastest?.currency,
        duration: fastest?.duration,
      },
    };
  };

  const stats = getStats();

  const toggleFilter = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const clearFilters = (type) => {
    setFilters((prev) => ({ ...prev, [type]: [] }));
  };

  if (!flights || flights.length === 0) {
    return (
      <div className="results-page">
        <div className="no-results">
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
      {/* Search Header */}
      <header className="search-header">
        <div className="search-summary">
          <div className="route-summary">
            <span className="route-icon">✈</span>
            <span>{searchParams.origin || "N/A"}</span>
          </div>
          <button className="swap-btn">⇄</button>
          <div className="route-summary">
            <span className="route-icon">📍</span>
            <span>{searchParams.destination || "N/A"}</span>
          </div>
          <div className="date-summary">
            <span className="date-icon">📅</span>
            <span>
              {searchParams.departureDate
                ? new Date(searchParams.departureDate).toLocaleDateString(
                    "en-US",
                    { weekday: "short", day: "numeric", month: "short" }
                  )
                : "Select date"}
            </span>
            {searchParams.tripType === "round-trip" && (
              <span className="add-return">Add return</span>
            )}
          </div>
          <div className="passenger-summary">
            <span className="pax-icon">👤</span>
            <span>{searchParams.adults || 1}</span>
          </div>
          <div className="class-summary">
            <span>{searchParams.travelClass || "Economy"}</span>
          </div>
          <button className="search-btn" onClick={() => navigate("/")}>
            Search
          </button>
        </div>
      </header>

      <div className="results-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filter-section">
            <div className="filter-header">
              <h3>Recommended</h3>
              <button
                className="clear-btn"
                onClick={() => clearFilters("recommended")}
              >
                Clear
              </button>
            </div>
            <label className="filter-checkbox">
              <input type="checkbox" />
              <span>Checked baggage included</span>
            </label>
          </div>

          <div className="filter-section">
            <div className="filter-header">
              <h3>Airlines</h3>
              <label className="toggle-switch">
                <span>Select all airlines</span>
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
            {airlines.map((airline, idx) => (
              <label key={idx} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.airlines.includes(airline)}
                  onChange={() => toggleFilter("airlines", airline)}
                />
                <span>{airline}</span>
              </label>
            ))}
            {airlines.length > 3 && (
              <button className="show-more-btn">
                Show all {airlines.length} airlines
              </button>
            )}
          </div>

          <div className="filter-section">
            <div className="filter-header">
              <h3>Stops</h3>
              <button
                className="clear-btn"
                onClick={() => clearFilters("stops")}
              >
                Clear
              </button>
            </div>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.stops.includes("direct")}
                onChange={() => toggleFilter("stops", "direct")}
              />
              <span>Direct</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.stops.includes("1stop")}
                onChange={() => toggleFilter("stops", "1stop")}
              />
              <span>1 Stop</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.stops.includes("2stops")}
                onChange={() => toggleFilter("stops", "2stops")}
              />
              <span>2 Stops+</span>
            </label>
          </div>

          <div className="filter-section">
            <div className="filter-header">
              <h3>Times</h3>
              <button
                className="clear-btn"
                onClick={() =>
                  setTimeFilters({
                    departureStart: 0,
                    departureEnd: 24,
                    arrivalStart: 0,
                    arrivalEnd: 24,
                  })
                }
              >
                Clear
              </button>
            </div>
            <div className="time-filter">
              <span className="time-label">
                Departure {formatHourToTime(timeFilters.departureStart)} -{" "}
                {formatHourToTime(timeFilters.departureEnd)}
              </span>
              <div className="time-slider dual-slider">
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={timeFilters.departureStart}
                  onChange={(e) =>
                    setTimeFilters((prev) => ({
                      ...prev,
                      departureStart: Math.min(
                        parseInt(e.target.value),
                        prev.departureEnd - 1
                      ),
                    }))
                  }
                  className="slider-input slider-start"
                />
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={timeFilters.departureEnd}
                  onChange={(e) =>
                    setTimeFilters((prev) => ({
                      ...prev,
                      departureEnd: Math.max(
                        parseInt(e.target.value),
                        prev.departureStart + 1
                      ),
                    }))
                  }
                  className="slider-input slider-end"
                />
              </div>
              <div className="time-range">
                <span>12:00AM</span>
                <span>11:59PM</span>
              </div>
            </div>
            <div className="time-filter">
              <span className="time-label">
                Arrival {formatHourToTime(timeFilters.arrivalStart)} -{" "}
                {formatHourToTime(timeFilters.arrivalEnd)}
              </span>
              <div className="time-slider dual-slider">
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={timeFilters.arrivalStart}
                  onChange={(e) =>
                    setTimeFilters((prev) => ({
                      ...prev,
                      arrivalStart: Math.min(
                        parseInt(e.target.value),
                        prev.arrivalEnd - 1
                      ),
                    }))
                  }
                  className="slider-input slider-start"
                />
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={timeFilters.arrivalEnd}
                  onChange={(e) =>
                    setTimeFilters((prev) => ({
                      ...prev,
                      arrivalEnd: Math.max(
                        parseInt(e.target.value),
                        prev.arrivalStart + 1
                      ),
                    }))
                  }
                  className="slider-input slider-end"
                />
              </div>
              <div className="time-range">
                <span>12:00AM</span>
                <span>11:59PM</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="results-main">
          {/* Date Tabs */}
          <div className="date-tabs">
            {dateTabs.map((tab, idx) => (
              <button
                key={idx}
                className={`date-tab ${tab.isSelected ? "active" : ""}`}
                onClick={() => !tab.isSelected && handleDateChange(tab.date)}
              >
                <span className="tab-date">{tab.label}</span>
                <span className="tab-price">
                  {stats.cheapest.price
                    ? `From ${formatPrice(
                        stats.cheapest.price,
                        stats.cheapest.currency
                      )}`
                    : ""}
                </span>
              </button>
            ))}
          </div>

          {/* Results Header */}
          <div className="results-info">
            <h2>
              Flights from {searchParams.origin} to {searchParams.destination}
            </h2>
            <p>Average price per person. The price includes taxes and fees.</p>
          </div>

          {/* Sort Tabs */}
          <div className="sort-tabs">
            <button
              className={`sort-tab ${sortBy === "cheapest" ? "active" : ""}`}
              onClick={() => setSortBy("cheapest")}
            >
              <span className="sort-label">Cheapest</span>
              <span className="sort-value">
                {stats.cheapest.price &&
                  formatPrice(
                    stats.cheapest.price,
                    stats.cheapest.currency
                  )}{" "}
                •{" "}
                {stats.cheapest.duration &&
                  formatDuration(stats.cheapest.duration)}
              </span>
            </button>
            <button
              className={`sort-tab ${sortBy === "best" ? "active" : ""}`}
              onClick={() => setSortBy("best")}
            >
              <span className="sort-label">Best overall</span>
              <span className="sort-value best-value">
                {stats.best.price &&
                  formatPrice(stats.best.price, stats.best.currency)}{" "}
                • {stats.best.duration && formatDuration(stats.best.duration)}
              </span>
            </button>
            <button
              className={`sort-tab ${sortBy === "fastest" ? "active" : ""}`}
              onClick={() => setSortBy("fastest")}
            >
              <span className="sort-label">Fastest</span>
              <span className="sort-value">
                {stats.fastest.price &&
                  formatPrice(stats.fastest.price, stats.fastest.currency)}{" "}
                •{" "}
                {stats.fastest.duration &&
                  formatDuration(stats.fastest.duration)}
              </span>
            </button>
            <div className="sort-dropdown">
              <span>Sort by</span>
              <span className="dropdown-icon">▼</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="quick-filters">
            <button className="quick-filter active">Fastest</button>
            <button className="quick-filter">Best</button>
            <button className="quick-filter">Cheapest direct</button>
          </div>

          {showReturnFlights && selectedDepartureFlight && (
            <div className="selected-flight-banner">
              <div>
                <strong>✓ Departure Flight Selected</strong>
                <span>
                  {selectedDepartureFlight.airline_name} -{" "}
                  {formatTime(selectedDepartureFlight.departure_time)}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedDepartureFlight(null);
                  setShowReturnFlights(false);
                }}
                className="change-btn"
              >
                ← Change
              </button>
            </div>
          )}

          {/* Flight Cards */}
          {isLoadingNewDate && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Searching flights for new date...</p>
            </div>
          )}
          <div
            className="flights-list"
            id={showReturnFlights ? "return-flights" : ""}
            style={{ opacity: isLoadingNewDate ? 0.5 : 1 }}
          >
            {(showReturnFlights ? returnFlights : sortedFlights).length === 0 &&
              !isLoadingNewDate && (
                <div className="no-flights-message">
                  <p>No flights found matching your filters.</p>
                  <p>Try adjusting your search criteria or filters.</p>
                </div>
              )}
            {(showReturnFlights ? returnFlights : sortedFlights).map(
              (flight, index) => (
                <div
                  key={index}
                  className="flight-card"
                  onClick={() => handleSelectFlight(flight)}
                >
                  <div className="flight-content">
                    <div className="airline-section">
                      <img
                        src={getAirlineLogo(flight.airline_code)}
                        alt={getAirlineName(
                          flight.airline_code,
                          flight.airline_name
                        )}
                        className="airline-logo"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div
                        className="airline-logo-fallback"
                        style={{ display: "none" }}
                      >
                        {(flight.airline_name || flight.airline_code).charAt(0)}
                      </div>
                      <div className="airline-details">
                        <span className="airline-name">
                          {getAirlineName(
                            flight.airline_code,
                            flight.airline_name
                          )}
                        </span>
                        <div className="amenities">
                          <span className="amenity cabin">🧳 Cabin bag</span>
                          <span className="amenity checked">
                            💼 Checked baggage
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flight-times">
                      <div className="time-block departure">
                        <span className="time">
                          {formatTime(flight.departure_time)}
                        </span>
                        <span className="airport">
                          {flight.departure_airport}
                        </span>
                      </div>

                      <div className="flight-duration">
                        <span className="duration-text">
                          {formatDuration(flight.duration)}
                        </span>
                        <div className="duration-line">
                          <span className="line"></span>
                          <span className="arrow">→</span>
                        </div>
                        {flight.stops === 0 ? (
                          <span className="direct-text">Direct</span>
                        ) : (
                          <span className="stops-text">
                            {flight.stops} stop
                          </span>
                        )}
                      </div>

                      <div className="time-block arrival">
                        <span className="time">
                          {formatTime(flight.arrival_time)}
                        </span>
                        <span className="airport">
                          {flight.arrival_airport}
                        </span>
                      </div>
                    </div>

                    <div className="price-section">
                      <div className="discount-info">
                        <span className="discount-badge">Rp 70,570 OFF</span>
                        <span className="original-price">
                          Rp{" "}
                          {(parseFloat(flight.price) * 1.05).toLocaleString(
                            "id-ID",
                            { maximumFractionDigits: 0 }
                          )}
                        </span>
                      </div>
                      <div className="final-price">
                        <span className="currency">Rp</span>
                        <span className="amount">
                          {parseFloat(flight.price).toLocaleString("id-ID", {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <button className="expand-btn">▼</button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ResultsPage;
