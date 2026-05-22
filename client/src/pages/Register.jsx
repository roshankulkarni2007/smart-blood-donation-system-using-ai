import { useState } from "react";

function Register() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [blood, setBlood] = useState("");
  const [location, setLocation] = useState("");
  const [lastDonation, setLastDonation] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newDonor = {
      name,
      age,
      blood,
      location,
      status: "Available",
      lastDonation
    };

    try {
      const response = await fetch("https://smart-blood-donation-system-using-ai.onrender.com/donors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newDonor)
      });

      const data = await response.json();
      console.log(data);

      alert("Donor registered successfully!");

      setName("");
      setAge("");
      setBlood("");
      setLocation("");
      setLastDonation("");
    } catch (error) {
      console.log(error);
      alert("Error registering donor");
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "30px",
        backgroundColor: "#fef2f2",
        borderRadius: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
      }}
    >
      <h1 style={{ textAlign: "center", color: "#b91c1c" }}>
        Register as Donor
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px"
        }}
      >
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <input
          type="number"
          placeholder="Enter Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <input
          type="text"
          placeholder="Enter Blood Group"
          value={blood}
          onChange={(e) => setBlood(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <input
          type="text"
          placeholder="Enter Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <input
          type="date"
          value={lastDonation}
          onChange={(e) => setLastDonation(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#dc2626",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Register Donor
        </button>
      </form>
    </div>
  );
}

export default Register;