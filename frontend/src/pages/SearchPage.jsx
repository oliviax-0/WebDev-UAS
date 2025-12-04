import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SearchPage.css";

function SearchPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    tripType: "round-trip",
    passengers: 2,
    travelClass: "Economy",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      const params = {
        origin: formData.origin.toUpperCase(),
        destination: formData.destination.toUpperCase(),
        departure_date: formData.departureDate,
        adults: formData.passengers,
      };

      if (formData.tripType === "round-trip" && formData.returnDate) {
        params.return_date = formData.returnDate;
      }

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
      </header>

      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Hey Buddy! Where are you Flying to?</h1>
          <p className="hero-subtitle">
            Find the best flight deals for your next adventure
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
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="City or Airport"
                  className="location-input"
                  required
                />
                <span className="input-icon">✈️</span>
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
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="City or Airport"
                  className="location-input"
                  required
                />
                <span className="input-icon">📍</span>
              </div>
            </div>

            <div className="date-row">
              <div className="input-wrapper">
                <label className="input-label">DEPARTURE</label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="date-input"
                  required
                />
              </div>

              {formData.tripType === "round-trip" && (
                <div className="input-wrapper">
                  <label className="input-label">RETURN</label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    min={
                      formData.departureDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="date-input"
                    required
                  />
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
                  <span className="search-icon">🔍</span>
                  Search Flights
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
