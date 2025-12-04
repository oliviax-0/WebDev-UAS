import { useState, useEffect, useRef } from "react";
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
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: "Economy",
  });
  const [originDisplay, setOriginDisplay] = useState("");
  const [destinationDisplay, setDestinationDisplay] = useState("");
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
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const passengerDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        passengerDropdownRef.current &&
        !passengerDropdownRef.current.contains(event.target)
      ) {
        setShowPassengerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setOriginDisplay(value);

    // Extract code if user is typing, otherwise use the value as-is for search
    // If the value contains parentheses (like "Jakarta (CGK)"), extract just what's typed
    const searchValue = value.includes("(")
      ? value.split("(")[0].trim()
      : value;
    setFormData((prev) => ({ ...prev, origin: searchValue.toUpperCase() }));

    if (value.length >= 2) {
      setSearchingOrigin(true);
      const suggestions = await searchAirports(searchValue);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(true);
      setSearchingOrigin(false);
    } else {
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationChange = async (e) => {
    const value = e.target.value;
    setDestinationDisplay(value);

    // Extract code if user is typing, otherwise use the value as-is for search
    const searchValue = value.includes("(")
      ? value.split("(")[0].trim()
      : value;
    setFormData((prev) => ({
      ...prev,
      destination: searchValue.toUpperCase(),
    }));

    if (value.length >= 2) {
      setSearchingDestination(true);
      const suggestions = await searchAirports(searchValue);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
      setSearchingDestination(false);
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  const selectOrigin = (airport) => {
    const displayText = `${airport.city} (${airport.code})`;
    setFormData((prev) => ({ ...prev, origin: airport.code }));
    setOriginDisplay(displayText);
    setShowOriginSuggestions(false);
  };

  const selectDestination = (airport) => {
    const displayText = `${airport.city} (${airport.code})`;
    setFormData((prev) => ({ ...prev, destination: airport.code }));
    setDestinationDisplay(displayText);
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
    // Swap display names too
    const tempDisplay = originDisplay;
    setOriginDisplay(destinationDisplay);
    setDestinationDisplay(tempDisplay);
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
          adults: formData.adults,
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
          adults: formData.adults,
        };

        // Search return flights
        const returnParams = {
          origin: formData.destination.toUpperCase(),
          destination: formData.origin.toUpperCase(),
          departure_date: formatDate(formData.returnDate),
          adults: formData.adults,
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
          adults: formData.adults,
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
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">✈</span>
            <span className="logo-text">SkyBooker</span>
          </div>
        </div>
        <nav className="nav-menu">
          <a href="#" className="nav-link active">
            <span className="nav-icon">🛫</span>
            Flights
          </a>
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/my-trips");
            }}
          >
            <span className="nav-icon">📋</span>
            My Trips
          </a>
        </nav>
        <div className="header-right">
          <button className="login-btn">Sign In</button>
        </div>
      </header>

      <div className="hero-section">
        <div className="hero-content">
          <p className="hero-tagline">Search, Compare & Book</p>
          <h1 className="hero-title">
            Find Your Perfect <span className="flying-text">Flight</span>
          </h1>
          <p className="hero-subtitle">
            Compare prices from 100+ airlines and travel agents to get the best
            deals
          </p>
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
              <div className="passenger-selector" ref={passengerDropdownRef}>
                <button
                  type="button"
                  className="passenger-trigger"
                  onClick={() =>
                    setShowPassengerDropdown(!showPassengerDropdown)
                  }
                >
                  <span className="passenger-icon">👤</span>
                  <span className="passenger-text">
                    {formData.adults + formData.children + formData.infants}{" "}
                    Passenger
                    {formData.adults + formData.children + formData.infants > 1
                      ? "s"
                      : ""}
                    , {formData.travelClass}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {showPassengerDropdown && (
                  <div className="passenger-dropdown">
                    <div className="passenger-row">
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            adults: Math.max(1, prev.adults - 1),
                          }))
                        }
                        disabled={formData.adults <= 1}
                      >
                        −
                      </button>
                      <div className="passenger-info">
                        <span className="passenger-count">
                          {formData.adults}
                        </span>
                        <span className="passenger-label">
                          Adult (12yrs and above)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            adults: Math.min(9, prev.adults + 1),
                          }))
                        }
                        disabled={formData.adults >= 9}
                      >
                        +
                      </button>
                    </div>

                    <div className="passenger-row">
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            children: Math.max(0, prev.children - 1),
                          }))
                        }
                        disabled={formData.children <= 0}
                      >
                        −
                      </button>
                      <div className="passenger-info">
                        <span className="passenger-count">
                          {formData.children}
                        </span>
                        <span className="passenger-label">
                          Children (2-11yrs)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            children: Math.min(9, prev.children + 1),
                          }))
                        }
                        disabled={formData.children >= 9}
                      >
                        +
                      </button>
                    </div>

                    <div className="passenger-row">
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            infants: Math.max(0, prev.infants - 1),
                          }))
                        }
                        disabled={formData.infants <= 0}
                      >
                        −
                      </button>
                      <div className="passenger-info">
                        <span className="passenger-count">
                          {formData.infants}
                        </span>
                        <span className="passenger-label">
                          Infants (below 2yrs)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            infants: Math.min(9, prev.infants + 1),
                          }))
                        }
                        disabled={formData.infants >= 9}
                      >
                        +
                      </button>
                    </div>

                    <div className="cabin-class-section">
                      <div className="cabin-class-grid">
                        <button
                          type="button"
                          className={`cabin-btn ${
                            formData.travelClass === "Economy" ? "active" : ""
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              travelClass: "Economy",
                            }))
                          }
                        >
                          Economy
                        </button>
                        <button
                          type="button"
                          className={`cabin-btn ${
                            formData.travelClass === "Premium Economy"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              travelClass: "Premium Economy",
                            }))
                          }
                        >
                          Premium economy
                        </button>
                        <button
                          type="button"
                          className={`cabin-btn ${
                            formData.travelClass === "Business" ? "active" : ""
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              travelClass: "Business",
                            }))
                          }
                        >
                          Business
                        </button>
                        <button
                          type="button"
                          className={`cabin-btn ${
                            formData.travelClass === "First" ? "active" : ""
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              travelClass: "First",
                            }))
                          }
                        >
                          First
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="search-form-modern">
            <div className="location-row">
              <div className="input-wrapper from-input">
                <label className="input-label">FROM</label>
                <div className="location-display">
                  <span className="location-icon">✈</span>
                  <input
                    type="text"
                    name="origin"
                    value={originDisplay}
                    onChange={handleOriginChange}
                    onFocus={() =>
                      originDisplay.length >= 2 &&
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
                      {originSuggestions.map((airport, idx) => (
                        <div
                          key={`origin-${airport.code}-${idx}`}
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
                  <span className="location-icon">📍</span>
                  <input
                    type="text"
                    name="destination"
                    value={destinationDisplay}
                    onChange={handleDestinationChange}
                    onFocus={() =>
                      destinationDisplay.length >= 2 &&
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
                        {destinationSuggestions.map((airport, idx) => (
                          <div
                            key={`dest-${airport.code}-${idx}`}
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
            <div className="section-title-wrapper">
              <h2>🌍 Trending Destinations</h2>
              <p className="section-subtitle">
                Explore our most popular flight routes this month
              </p>
            </div>
            <a href="#" className="view-all-link">
              View all destinations →
            </a>
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
                    <div className="destination-badge">Popular</div>
                  </div>
                )}
                <div className="destination-content">
                  <div className="destination-info">
                    <h3 className="destination-city">{destination.city}</h3>
                    <p className="destination-country">{destination.country}</p>
                  </div>
                  <div className="destination-action">
                    <span className="destination-code">{destination.code}</span>
                    <span className="destination-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Best Price Guarantee</h3>
            <p>Find a lower price? We'll refund the difference</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Booking</h3>
            <p>Your data is protected with industry-standard encryption</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Confirmation</h3>
            <p>Get your e-ticket delivered to your inbox immediately</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎧</div>
            <h3>24/7 Support</h3>
            <p>Our travel experts are here to help anytime</p>
          </div>
        </div>

        {/* Footer - Traveloka Style */}
        <footer className="site-footer">
          <div className="footer-container">
            {/* Logo & Partners Section */}
            <div className="footer-section footer-brand-section">
              <div className="footer-logo">
                <span className="logo-icon">✈</span>
                <span className="logo-text">SkyBooker</span>
              </div>
              <div className="partner-badges">
                <span className="badge">IATA Member</span>
                <span className="badge">Verified</span>
              </div>

              <h4 className="footer-title">Payment Partners</h4>
              <div className="payment-partners">
                <div className="payment-icon">💳 Visa</div>
                <div className="payment-icon">💳 Mastercard</div>
                <div className="payment-icon">💳 JCB</div>
                <div className="payment-icon">💳 BCA</div>
                <div className="payment-icon">💳 Mandiri</div>
                <div className="payment-icon">💳 BNI</div>
                <div className="payment-icon">💳 GoPay</div>
                <div className="payment-icon">💳 OVO</div>
              </div>
            </div>

            {/* About Section */}
            <div className="footer-section">
              <h4 className="footer-title">About SkyBooker</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">How to Book</a>
                </li>
                <li>
                  <a href="#">Contact Us</a>
                </li>
                <li>
                  <a href="#">Help Center</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">About Us</a>
                </li>
              </ul>
            </div>

            {/* Products Section */}
            <div className="footer-section">
              <h4 className="footer-title">Products</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">Flights</a>
                </li>
                <li>
                  <a href="#">Airport Transfer</a>
                </li>
                <li>
                  <a href="#">Travel Insurance</a>
                </li>
                <li>
                  <a href="#">Gift Voucher</a>
                </li>
              </ul>
            </div>

            {/* Others Section */}
            <div className="footer-section">
              <h4 className="footer-title">Others</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">Privacy Notice</a>
                </li>
                <li>
                  <a href="#">Terms & Conditions</a>
                </li>
                <li>
                  <a href="#">Refund Policy</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
              </ul>
            </div>

            {/* Follow Us Section */}
            <div className="footer-section">
              <h4 className="footer-title">Follow us on</h4>
              <div className="social-links">
                <a href="#" className="social-link">
                  <span>📘</span> Facebook
                </a>
                <a href="#" className="social-link">
                  <span>📸</span> Instagram
                </a>
                <a href="#" className="social-link">
                  <span>🎵</span> TikTok
                </a>
                <a href="#" className="social-link">
                  <span>▶️</span> Youtube
                </a>
                <a href="#" className="social-link">
                  <span>✖️</span> Twitter
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="footer-bottom">
            <p>© 2025 SkyBooker. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default SearchPage;
