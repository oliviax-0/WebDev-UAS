import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./SearchPage.css";

function SearchPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: null,
    returnDate: null,
    tripType: "round-trip",
    passengers: 2,
    travelClass: "Economy",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [datePrices, setDatePrices] = useState({});
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const [popularDestinations, setPopularDestinations] = useState([]);

  // Fetch popular destinations on component mount
  useEffect(() => {
    const fetchPopularDestinations = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/popular-destinations/"
        );
        if (response.data.success) {
          setPopularDestinations(response.data.destinations);
        }
      } catch (error) {
        console.error("Error fetching popular destinations:", error);
      }
    };

    fetchPopularDestinations();
  }, []);

  // Handle destination card click
  const handleDestinationClick = (destination) => {
    setFormData((prev) => ({
      ...prev,
      destination: destination.code,
    }));
    // Scroll to search form
    document
      .querySelector(".search-card")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Search airports using Amadeus API
  const searchAirports = async (keyword) => {
    if (!keyword || keyword.length < 2) return [];

    try {
      const response = await axios.get("http://localhost:8000/api/airports/", {
        params: { keyword },
      });

      if (response.data.success) {
        return response.data.airports;
      }
      return [];
    } catch (error) {
      console.error("Airport search error:", error);
      return [];
    }
  };

  const handleOriginChange = async (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, origin: value }));

    if (value.length >= 2) {
      setSearchingOrigin(true);
      const suggestions = await searchAirports(value);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(true);
      setSearchingOrigin(false);
    } else {
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationChange = async (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, destination: value }));

    if (value.length >= 2) {
      setSearchingDestination(true);
      const suggestions = await searchAirports(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
      setSearchingDestination(false);
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  const selectOrigin = (airport) => {
    setFormData((prev) => ({ ...prev, origin: airport.code }));
    setShowOriginSuggestions(false);
  };

  const selectDestination = (airport) => {
    setFormData((prev) => ({ ...prev, destination: airport.code }));
    setShowDestinationSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleTripTypeChange = (tripType) => {
    setFormData((prev) => ({
      ...prev,
      tripType,
      returnDate: tripType === "one-way" ? "" : prev.returnDate,
    }));
  };

  const swapLocations = () => {
    setFormData((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  // Format dates to YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Render custom day content with prices
  const renderDayContents = (day, date) => {
    const dateKey = formatDate(date);
    const price = datePrices[dateKey];

    return (
      <div className="custom-day">
        <div className="day-number">{day}</div>
        {price && <div className="day-price">{price}</div>}
      </div>
    );
  };

  // Fetch flight prices for a month
  const fetchMonthPrices = async (date, isReturn = false) => {
    if (!formData.origin || !formData.destination) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const prices = {};

    // Fetch prices for each day in the month (simplified - in real app, use a batch API)
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(new Date(d));

      try {
        const params = {
          origin: isReturn
            ? formData.destination.toUpperCase()
            : formData.origin.toUpperCase(),
          destination: isReturn
            ? formData.origin.toUpperCase()
            : formData.destination.toUpperCase(),
          departure_date: dateStr,
          adults: formData.passengers,
        };

        const response = await axios.get("http://localhost:8000/api/search/", {
          params,
        });

        if (response.data.success && response.data.flights.length > 0) {
          const lowestPrice = Math.min(
            ...response.data.flights.map((f) => parseFloat(f.price))
          );
          prices[dateStr] = Math.floor(lowestPrice / 1000); // Show in thousands
        }
      } catch (err) {
        // Ignore errors for individual dates
        console.log(`No data for ${dateStr}`);
      }
    }

    setDatePrices((prev) => ({ ...prev, ...prices }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (
        !formData.origin ||
        !formData.destination ||
        !formData.departureDate
      ) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (formData.tripType === "round-trip" && !formData.returnDate) {
        setError("Please select a return date for round trip");
        setLoading(false);
        return;
      }

      // For round trip, make two separate API calls
      if (formData.tripType === "round-trip" && formData.returnDate) {
        // Search departure flights
        const departureParams = {
          origin: formData.origin.toUpperCase(),
          destination: formData.destination.toUpperCase(),
          departure_date: formatDate(formData.departureDate),
          adults: formData.passengers,
        };

        // Search return flights
        const returnParams = {
          origin: formData.destination.toUpperCase(),
          destination: formData.origin.toUpperCase(),
          departure_date: formatDate(formData.returnDate),
          adults: formData.passengers,
        };

        const [departureResponse, returnResponse] = await Promise.all([
          axios.get("http://localhost:8000/api/search/", {
            params: departureParams,
          }),
          axios.get("http://localhost:8000/api/search/", {
            params: returnParams,
          }),
        ]);

        if (departureResponse.data.success && returnResponse.data.success) {
          navigate("/results", {
            state: {
              flights: departureResponse.data.flights,
              returnFlights: returnResponse.data.flights,
              searchParams: formData,
            },
          });
        } else {
          setError("No flights found. Please try different search criteria.");
        }
      } else {
        // One way trip - single API call
        const params = {
          origin: formData.origin.toUpperCase(),
          destination: formData.destination.toUpperCase(),
          departure_date: formatDate(formData.departureDate),
          adults: formData.passengers,
        };

        const response = await axios.get("http://localhost:8000/api/search/", {
          params,
        });

        if (response.data.success) {
          navigate("/results", {
            state: {
              flights: response.data.flights,
              searchParams: formData,
            },
          });
        } else {
          setError("No flights found. Please try different search criteria.");
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(
        err.response?.data?.details ||
          err.response?.data?.error ||
          "Failed to search flights. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <header className="header">
        <div className="logo">FlyHigh</div>
        <nav className="nav-menu">
          <a href="#" className="nav-link">
            Flight Schedule
          </a>
          <a href="#" className="nav-link">
            Manage Booking
          </a>
        </nav>
      </header>

      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Hey Buddy! where are you <span className="flying-text">Flying</span>{" "}
            to?
          </h1>
        </div>

        <div className="search-card">
          <div className="trip-options">
            <button
              type="button"
              className={`trip-btn ${
                formData.tripType === "round-trip" ? "active" : ""
              }`}
              onClick={() => handleTripTypeChange("round-trip")}
            >
              Round Trip
            </button>
            <button
              type="button"
              className={`trip-btn ${
                formData.tripType === "one-way" ? "active" : ""
              }`}
              onClick={() => handleTripTypeChange("one-way")}
            >
              One Way
            </button>

            <div className="trip-details">
              <div className="detail-item">
                <span className="detail-icon">👤</span>
                <select
                  value={formData.passengers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passengers: parseInt(e.target.value),
                    })
                  }
                  className="detail-select"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <option key={num} value={num}>
                      {num < 10 && "0"}
                      {num} Passenger{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="detail-item">
                <span className="detail-icon">💺</span>
                <select
                  value={formData.travelClass}
                  onChange={(e) =>
                    setFormData({ ...formData, travelClass: e.target.value })
                  }
                  className="detail-select"
                >
                  <option value="Economy">Economy Class</option>
                  <option value="Business">Business Class</option>
                  <option value="First">First Class</option>
                </select>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="search-form-modern">
            <div className="location-row">
              <div className="input-wrapper from-input">
                <label className="input-label">FROM</label>
                <div className="location-display">
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleOriginChange}
                    onFocus={() =>
                      formData.origin.length >= 2 &&
                      setShowOriginSuggestions(true)
                    }
                    placeholder="City or Airport (e.g., Paris, JFK, London)"
                    className="location-input"
                    required
                    autoComplete="off"
                  />
                  <span className="location-details">
                    Search airports worldwide
                  </span>
                  {searchingOrigin && (
                    <div className="airport-suggestions">
                      <div className="suggestion-loading">Searching...</div>
                    </div>
                  )}
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="airport-suggestions">
                      {originSuggestions.map((airport) => (
                        <div
                          key={airport.code}
                          className="suggestion-item"
                          onClick={() => selectOrigin(airport)}
                        >
                          <div className="suggestion-code">{airport.code}</div>
                          <div className="suggestion-details">
                            <div className="suggestion-city">
                              {airport.city}
                              {airport.country && `, ${airport.country}`}
                            </div>
                            <div className="suggestion-name">
                              {airport.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="swap-button"
                onClick={swapLocations}
                title="Swap locations"
              >
                ⇄
              </button>

              <div className="input-wrapper to-input">
                <label className="input-label">TO</label>
                <div className="location-display">
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleDestinationChange}
                    onFocus={() =>
                      formData.destination.length >= 2 &&
                      setShowDestinationSuggestions(true)
                    }
                    placeholder="City or Airport (e.g., Tokyo, CDG, Dubai)"
                    className="location-input"
                    required
                    autoComplete="off"
                  />
                  <span className="location-details">
                    Search airports worldwide
                  </span>
                  {searchingDestination && (
                    <div className="airport-suggestions">
                      <div className="suggestion-loading">Searching...</div>
                    </div>
                  )}
                  {showDestinationSuggestions &&
                    destinationSuggestions.length > 0 && (
                      <div className="airport-suggestions">
                        {destinationSuggestions.map((airport) => (
                          <div
                            key={airport.code}
                            className="suggestion-item"
                            onClick={() => selectDestination(airport)}
                          >
                            <div className="suggestion-code">
                              {airport.code}
                            </div>
                            <div className="suggestion-details">
                              <div className="suggestion-city">
                                {airport.city}
                                {airport.country && `, ${airport.country}`}
                              </div>
                              <div className="suggestion-name">
                                {airport.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="date-row">
              <div className="input-wrapper">
                <label className="input-label">DEPARTURE</label>
                <div className="date-display">
                  <DatePicker
                    selected={formData.departureDate}
                    onChange={(date) =>
                      setFormData({ ...formData, departureDate: date })
                    }
                    minDate={new Date()}
                    startDate={formData.departureDate}
                    openToDate={formData.departureDate || new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select departure date"
                    className="date-input"
                    monthsShown={2}
                    calendarStartDay={1}
                    renderDayContents={renderDayContents}
                    onMonthChange={(date) => fetchMonthPrices(date, false)}
                    required
                  />
                  <div className="date-navigation">
                    <button
                      type="button"
                      className="date-nav-btn"
                      onClick={() => {
                        const date = formData.departureDate || new Date();
                        const prevDate = new Date(date);
                        prevDate.setDate(prevDate.getDate() - 1);
                        if (prevDate >= new Date()) {
                          setFormData({ ...formData, departureDate: prevDate });
                        }
                      }}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className="date-nav-btn"
                      onClick={() => {
                        const date = formData.departureDate || new Date();
                        const nextDate = new Date(date);
                        nextDate.setDate(nextDate.getDate() + 1);
                        setFormData({ ...formData, departureDate: nextDate });
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {formData.tripType === "round-trip" && (
                <div className="input-wrapper">
                  <label className="input-label">RETURN</label>
                  <div className="date-display">
                    <DatePicker
                      selected={formData.returnDate}
                      onChange={(date) =>
                        setFormData({ ...formData, returnDate: date })
                      }
                      minDate={formData.departureDate || new Date()}
                      startDate={formData.departureDate}
                      endDate={formData.returnDate}
                      openToDate={
                        formData.returnDate ||
                        formData.departureDate ||
                        new Date()
                      }
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select return date"
                      className="date-input"
                      monthsShown={2}
                      calendarStartDay={1}
                      renderDayContents={renderDayContents}
                      onMonthChange={(date) => fetchMonthPrices(date, true)}
                      required
                    />
                    <div className="date-navigation">
                      <button
                        type="button"
                        className="date-nav-btn"
                        onClick={() => {
                          const date =
                            formData.returnDate ||
                            formData.departureDate ||
                            new Date();
                          const prevDate = new Date(date);
                          prevDate.setDate(prevDate.getDate() - 1);
                          const minDate = formData.departureDate || new Date();
                          if (prevDate >= minDate) {
                            setFormData({ ...formData, returnDate: prevDate });
                          }
                        }}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="date-nav-btn"
                        onClick={() => {
                          const date =
                            formData.returnDate ||
                            formData.departureDate ||
                            new Date();
                          const nextDate = new Date(date);
                          nextDate.setDate(nextDate.getDate() + 1);
                          setFormData({ ...formData, returnDate: nextDate });
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button
              type="submit"
              className="search-button-modern"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Searching...
                </>
              ) : (
                <>
                  Search Flights
                  <span className="search-arrow">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="popular-destinations">
          <div className="section-header">
            <h2>Popular Destinations</h2>
            <p className="section-subtitle">
              Discover the world's most visited cities
            </p>
          </div>
          <div className="destinations-grid">
            {popularDestinations.map((destination, index) => (
              <div
                key={index}
                className="destination-card"
                onClick={() => handleDestinationClick(destination)}
              >
                {destination.image && (
                  <div className="destination-image">
                    <img src={destination.image} alt={destination.city} />
                    <div className="destination-overlay"></div>
                  </div>
                )}
                <div className="destination-content">
                  <h3 className="destination-city">{destination.city}</h3>
                  <p className="destination-country">{destination.country}</p>
                  <div className="destination-code">{destination.code}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
