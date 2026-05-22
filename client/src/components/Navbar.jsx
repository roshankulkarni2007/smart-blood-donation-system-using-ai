// src/components/Navbar.jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        background: "#991b1b",
        padding: "15px",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}
    >
      <ul
        style={{
          display: "flex",
          listStyle: "none",
          gap: "25px",
          margin: 0,
          padding: 0,
          color: "white",
          alignItems: "center"
        }}
      >
        <li>
          <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/donors" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>
            Donors
          </Link>
        </li>
        <li>
          <Link to="/requests" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>
            Requests
          </Link>
        </li>
        <li>
          <Link to="/register" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>
            Register
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;