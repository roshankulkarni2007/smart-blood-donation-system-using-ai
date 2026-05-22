import { useState } from "react";
import { API_URL } from "../config";

function Requests() {
  const [form, setForm] = useState({
    patient: "",
    blood: "A+",
    urgency: "Low",
    hospital: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`${API_URL}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setForm({
          patient: "",
          blood: "A+",
          urgency: "Low",
          hospital: ""
        });
      })
      .catch((err) => console.log("Error submitting request:", err));
  };

  return (
    <div
      style={{
        padding: "30px",
        minHeight: "100vh",
        background: "#fee2e2"
      }}
    >
      <h1 style={{ textAlign: "center", color: "#991b1b" }}>
        Blood Request Form
      </h1>

      <div
        style={{
          background: "white",
          maxWidth: "500px",
          margin: "30px auto",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
        }}
      >
        <label>Patient Name</label>
        <input
          type="text"
          name="patient"
          placeholder="Enter patient name"
          value={form.patient}
          onChange={handleChange}
        />

        <label>Blood Group Needed</label>
        <select name="blood" value={form.blood} onChange={handleChange}>
          <option>A+</option>
          <option>B+</option>
          <option>O+</option>
          <option>AB+</option>
        </select>

        <label>Urgency Level</label>
        <select name="urgency" value={form.urgency} onChange={handleChange}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Emergency</option>
        </select>

        <label>Hospital Name</label>
        <input
          type="text"
          name="hospital"
          placeholder="Enter hospital name"
          value={form.hospital}
          onChange={handleChange}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            marginTop: "15px"
          }}
        >
          Submit Request
        </button>
      </div>
    </div>
  );
}

export default Requests;
