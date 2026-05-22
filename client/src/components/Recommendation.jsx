import { useEffect, useState } from "react";

function Recommendation({ bloodNeeded = "A+", urgency = "High", userLocation = "Bangalore" }) {
  const [recommendedDonor, setRecommendedDonor] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/donors")
      .then((res) => res.json())
      .then((donors) => {
        // 1. Filter only available donors
        let filtered = donors.filter((d) => d.status === "Available" && d.blood === bloodNeeded);

        // 2. Sort by simple AI logic:
        // - Exact location match first
        // - Then urgency: High > Medium > Low
        // - Then last donation date (if exists, earlier is better)

        filtered.sort((a, b) => {
          // location match
          const locA = a.location === userLocation ? 0 : 1;
          const locB = b.location === userLocation ? 0 : 1;

          if (locA !== locB) return locA - locB;

          // urgency weighting (High = 0, Medium = 1, Low = 2)
          const urgencyMap = { Emergency: 0, High: 1, Medium: 2, Low: 3 };
          const urgencyA = urgencyMap[urgency] || 2;
          const urgencyB = urgencyMap[urgency] || 2;
          if (urgencyA !== urgencyB) return urgencyA - urgencyB;

          // last donation date (assume earlier date is better)
          const dateA = a.lastDonation ? new Date(a.lastDonation) : new Date(0);
          const dateB = b.lastDonation ? new Date(b.lastDonation) : new Date(0);
          return dateA - dateB;
        });

        setRecommendedDonor(filtered[0] || null);
      })
      .catch((err) => console.log("Error fetching donors:", err));
  }, [bloodNeeded, urgency, userLocation]);

  if (!recommendedDonor) {
    return (
      <div style={{ padding: "20px", background: "#fee2e2", borderRadius: "12px", textAlign: "center", marginTop: "20px" }}>
        <h3 style={{ color: "#991b1b" }}>No suitable donor found!</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", background: "#d1fae5", borderRadius: "12px", textAlign: "center", marginTop: "20px" }}>
      <h3 style={{ color: "#047857" }}>Recommended Donor (AI)</h3>
      <p>Name: {recommendedDonor.name}</p>
      <p>Blood Group: {recommendedDonor.blood}</p>
      <p>Status: {recommendedDonor.status}</p>
      <p>Location: {recommendedDonor.location}</p>
      {recommendedDonor.lastDonation && <p>Last Donation: {recommendedDonor.lastDonation}</p>}
      <button
        style={{ background: "#047857", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px" }}
      >
        Contact Donor
      </button>
    </div>
  );
}

export default Recommendation;