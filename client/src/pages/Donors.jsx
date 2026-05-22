import { useEffect, useState } from "react";
import { API_URL } from "../config";

function Donors() {
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/donors`)
      .then((res) => res.json())
      .then((data) => setDonors(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ textAlign: "center", color: "#b91c1c" }}>
        Available Donors
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "30px"
        }}
      >
        {donors.map((donor) => (
          <div
            key={donor.id}
            style={{
              background: "#fef2f2",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
            }}
          >
            <h2 style={{ color: "#991b1b" }}>{donor.name}</h2>
            <p>Age: {donor.age}</p>
            <p>Blood Group: {donor.bloodGroup}</p>
            <p>Location: {donor.city}</p>
            <p>Status: {donor.availabilityStatus}</p>
            <p>Last Donation: {donor.lastDonationDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Donors;
