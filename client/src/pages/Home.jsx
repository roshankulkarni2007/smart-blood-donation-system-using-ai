// src/pages/Home.jsx
import { useEffect, useState } from "react";

function Home() {
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [recommendedDonors, setRecommendedDonors] = useState([]);

  useEffect(() => {
    fetch("https://smart-blood-donation-system-using-ai.onrender.com/donors")
      .then((res) => res.json())
      .then((data) => {
        setDonors(data);
        setRecommendedDonors(data);
      })
      .catch((err) => console.log(err));
  }, []);

  const handleRecommendation = () => {
    const filtered = donors.filter((donor) => {
      const bloodMatch =
        donor.blood.toLowerCase() === bloodGroup.toLowerCase();

      const locationMatch =
        donor.location.toLowerCase() === location.toLowerCase();

      const availableMatch = donor.status === "Available";

      return bloodMatch && locationMatch && availableMatch;
    });

    const sorted = filtered.sort((a, b) => {
      return new Date(b.lastDonation) - new Date(a.lastDonation);
    });

    setRecommendedDonors(sorted);
  };

  return (
    <div style={{ padding: "30px", backgroundColor: "#fff5f5", minHeight: "100vh" }}>
      <h1
        style={{
          textAlign: "center",
          color: "#b91c1c",
          marginBottom: "10px"
        }}
      >
        Smart Blood Donation AI System
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#555",
          marginBottom: "30px"
        }}
      >
        Enter the blood group and location to get the best matching donor recommendations.
      </p>

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#ffffff",
          padding: "25px",
          borderRadius: "15px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ color: "#991b1b", marginBottom: "20px" }}>
          Find Best Donor
        </h2>

        <input
          type="text"
          placeholder="Enter Blood Group (Example: A+)"
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <input
          type="text"
          placeholder="Enter Location (Example: Bangalore)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <button
          onClick={handleRecommendation}
          style={{
            width: "100%",
            backgroundColor: "#dc2626",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Get AI Recommendation
        </button>
      </div>

      <h2
        style={{
          textAlign: "center",
          marginTop: "40px",
          color: "#991b1b"
        }}
      >
        Recommended Donors
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        {recommendedDonors.length > 0 ? (
          recommendedDonors.map((donor) => (
            <div
              key={donor.id}
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                borderLeft: "6px solid #dc2626"
              }}
            >
              <h3 style={{ color: "#b91c1c" }}>{donor.name}</h3>
              <p><strong>Age:</strong> {donor.age}</p>
              <p><strong>Blood Group:</strong> {donor.blood}</p>
              <p><strong>Location:</strong> {donor.location}</p>
              <p><strong>Status:</strong> {donor.status}</p>
              <p><strong>Last Donation:</strong> {donor.lastDonation}</p>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              gridColumn: "1 / -1",
              color: "gray",
              marginTop: "20px"
            }}
          >
            No matching donors found
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;