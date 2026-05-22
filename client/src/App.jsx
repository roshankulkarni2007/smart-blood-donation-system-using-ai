import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5050/api").replace(/\/$/, "");
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const availabilityStates = ["Available", "Busy", "Temporarily unavailable"];

function useApi(path, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}${path}`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}

async function postJson(path, body, token) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Request failed");
  return json;
}

function GoogleLoginButton({ label = "Continue with Google", onSuccess, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await onSuccess(response.credential);
          } catch (error) {
            onError(error.message);
          }
        }
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 280
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.head.appendChild(script);
  }, [onError, onSuccess]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className="helper-text">Google login will appear after VITE_GOOGLE_CLIENT_ID is configured.</p>;
  }

  return (
    <div className="google-login">
      <span>{label}</span>
      <div ref={buttonRef}></div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="app-shell">
      <Navbar theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<DonorRegistration />} />
          <Route path="/donor-dashboard" element={<DonorDashboard />} />
          <Route path="/blood-request" element={<BloodRequest />} />
          <Route path="/ai-recommendations" element={<Recommendations />} />
          <Route path="/tracker" element={<EmergencyTracker />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <ChatAssistant />
    </div>
  );
}

function Navbar({ theme, setTheme, language, setLanguage }) {
  const links = [
    ["/", "Home"],
    ["/register", "Donor Registration"],
    ["/blood-request", "Blood Request"],
    ["/ai-recommendations", "AI Match"],
    ["/tracker", "Tracker"],
    ["/donor-dashboard", "Dashboard"],
    ["/admin", "Admin"],
    ["/about", "About"],
    ["/contact", "Contact"]
  ];

  return (
    <header className="navbar">
      <Link to="/" className="brand" aria-label="Smart Blood home">
        <span className="brand-mark">+</span>
        <span>Smart Blood AI</span>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="nav-actions">
        <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language">
          <option>English</option>
          <option>Hindi</option>
          <option>Kannada</option>
        </select>
        <button className="icon-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle theme">
          {theme === "light" ? "◐" : "☀"}
        </button>
      </div>
    </header>
  );
}

function Home() {
  const { data: dashboard } = useApi("/dashboard", {});

  return (
    <section className="page">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI assisted verified emergency response</p>
          <h1>Smart Blood Donation System Using AI</h1>
          <p>
            A full-stack healthcare platform that ranks donors by compatibility, location, availability, eligibility,
            verification status, and emergency priority while protecting donor contact details until a request is genuine.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/blood-request">Create Emergency Request</Link>
            <Link className="secondary-button" to="/ai-recommendations">Find AI Donors</Link>
          </div>
        </div>
        <div className="hero-visual" aria-label="Emergency donor network visualization">
          <div className="pulse-ring"></div>
          <div className="map-grid">
            {["Hospital", "O+ Donor", "A+ Donor", "Verified", "Ambulance", "Admin"].map((item, index) => (
              <span key={item} className={`map-pin pin-${index}`}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <StatsGrid dashboard={dashboard} />

      <div className="feature-grid">
        {[
          ["AI ranking", "Scores donors using blood compatibility, live availability, distance, donation gap, consent, and emergency level."],
          ["Fake request control", "Hospital contacts, doctor references, suspicious text checks, and admin verification keep contacts locked until approved."],
          ["Privacy by design", "Phone and email fields never appear in public donor lists; verified requests must unlock contact through consent."],
          ["Real-time readiness", "Availability updates refresh donor state, emergency override can include busy donors who opted into urgent alerts."],
          ["Health safety", "Age, weight, health notes, and donation gap rules prevent unsafe repeated donations."]
        ].map(([title, text]) => (
          <article className="feature-card" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatsGrid({ dashboard }) {
  const cards = [
    ["Total donors", dashboard.totalDonors || 0],
    ["Active donors", dashboard.activeDonors || 0],
    ["Emergency requests", dashboard.emergencyRequests || 0],
    ["Nearby donors", dashboard.nearbyDonors || 0]
  ];

  return (
    <div className="stats-grid">
      {cards.map(([label, value]) => (
        <article className="stat-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );
}

function About() {
  return (
    <section className="page two-column">
      <div>
        <p className="eyebrow">Reviewer oriented system design</p>
        <h1>Built around real emergency constraints</h1>
        <p className="large-text">
          The project demonstrates how hospitals, donors, receivers, and admins interact in a controlled workflow. It
          answers the hard questions reviewers usually ask: authenticity, privacy, availability, prioritization, and safe
          repeat donation.
        </p>
      </div>
      <div className="timeline">
        {[
          ["1", "Receiver submits hospital verified request."],
          ["2", "System assigns verification score and spam risk."],
          ["3", "AI ranks eligible compatible donors nearby."],
          ["4", "Admin verifies request before contact unlock."],
          ["5", "Donor accepts or rejects based on consent and availability."]
        ].map(([step, text]) => (
          <div className="timeline-item" key={step}>
            <span>{step}</span>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonorRegistration() {
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "O+",
    phone: "",
    email: "",
    address: "",
    city: "Bengaluru",
    lastDonationDate: "",
    healthConditions: "None",
    weight: "",
    availabilityStatus: "Available",
    emergencyContact: "",
    preferredArea: "",
    consentToShare: true,
    password: ""
  });

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await postJson("/donors", form);
      setMessage(result.message);
      setForm((current) => ({ ...current, name: "", phone: "", email: "", address: "", emergencyContact: "", password: "" }));
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="page">
      <PageHeader eyebrow="Donor onboarding" title="Register as a verified blood donor" text="Capture eligibility, consent, emergency preference, and preferred donation area in one structured profile." />
      <form className="form-grid" onSubmit={submit}>
        <Input label="Name" name="name" value={form.name} onChange={update} required />
        <Input label="Age" name="age" value={form.age} onChange={update} type="number" required />
        <Select label="Gender" name="gender" value={form.gender} onChange={update} options={["Male", "Female", "Other"]} />
        <Select label="Blood group" name="bloodGroup" value={form.bloodGroup} onChange={update} options={bloodGroups} />
        <Input label="Phone number" name="phone" value={form.phone} onChange={update} required />
        <Input label="Email" name="email" value={form.email} onChange={update} type="email" required />
        <Input label="Create password" name="password" value={form.password} onChange={update} type="password" required />
        <Input label="Address" name="address" value={form.address} onChange={update} />
        <Input label="City" name="city" value={form.city} onChange={update} required />
        <Input label="Last donation date" name="lastDonationDate" value={form.lastDonationDate} onChange={update} type="date" required />
        <Input label="Health conditions" name="healthConditions" value={form.healthConditions} onChange={update} />
        <Input label="Weight (kg)" name="weight" value={form.weight} onChange={update} type="number" required />
        <Select label="Availability status" name="availabilityStatus" value={form.availabilityStatus} onChange={update} options={availabilityStates} />
        <Input label="Emergency contact" name="emergencyContact" value={form.emergencyContact} onChange={update} />
        <Input label="Preferred donation area" name="preferredArea" value={form.preferredArea} onChange={update} />
        <label className="checkbox-row">
          <input type="checkbox" name="consentToShare" checked={form.consentToShare} onChange={update} />
          Consent to share contact after verified request
        </label>
        <button className="primary-button form-submit" type="submit">Register Donor</button>
      </form>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function DonorDashboard() {
  const [token, setToken] = useState(localStorage.getItem("smartBloodDonorToken") || "");
  const [donor, setDonor] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", code: "" });
  const [message, setMessage] = useState("");
  const { data: donors, reload } = useApi("/donors", []);
  const { data: dashboard } = useApi("/dashboard", {});
  const [filter, setFilter] = useState({ bloodGroup: "", city: "", availability: "", eligibility: false });

  const filteredDonors = useMemo(() => donors.filter((donor) => {
    const bloodOk = !filter.bloodGroup || donor.bloodGroup === filter.bloodGroup;
    const cityOk = !filter.city || donor.city.toLowerCase().includes(filter.city.toLowerCase());
    const availabilityOk = !filter.availability || donor.availabilityStatus === filter.availability;
    const eligibilityOk = !filter.eligibility || donor.eligibility?.eligible;
    return bloodOk && cityOk && availabilityOk && eligibilityOk;
  }), [donors, filter]);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/donor-auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Donor login required");
      setDonor(json);
    } catch (error) {
      setMessage(error.message);
      setToken("");
      localStorage.removeItem("smartBloodDonorToken");
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const donorLogin = async (event) => {
    event.preventDefault();
    try {
      const result = await postJson("/donor-auth/login", loginForm);
      localStorage.setItem("smartBloodDonorToken", result.token);
      setToken(result.token);
      setDonor(result.donor);
      setMessage("Donor login successful.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const sendCode = async () => {
    try {
      const result = await postJson("/donor-auth/request-code", { email: loginForm.email });
      setMessage(`${result.message} Demo code: ${result.demoEmailCode}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const verifyCode = async () => {
    try {
      const result = await postJson("/donor-auth/verify-code", { email: loginForm.email, code: loginForm.code });
      localStorage.setItem("smartBloodDonorToken", result.token);
      setToken(result.token);
      setDonor(result.donor);
      setMessage("Email code verified. Donor dashboard unlocked.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const googleLogin = useCallback(async (credential) => {
    const result = await postJson("/auth/google", { credential });
    if (result.role !== "donor") throw new Error("Use the Admin page for admin Google login.");
    localStorage.setItem("smartBloodDonorToken", result.token);
    setToken(result.token);
    setDonor(result.donor);
    setMessage("Google login successful.");
  }, []);

  const updateAvailability = async (availabilityStatus) => {
    const response = await fetch(`${API_URL}/donor-auth/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ availabilityStatus })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.message || "Availability update failed");
      return;
    }
    setDonor(json.donor);
    setMessage(json.message);
    reload();
  };

  return (
    <section className="page">
      <PageHeader eyebrow="Donor dashboard" title="Donor availability and analytics" text="Review live donor numbers, login as a registered donor, and update your own availability in real time." />
      <StatsGrid dashboard={dashboard} />
      {!token ? (
        <div className="login-grid">
          <form className="form-grid single" onSubmit={donorLogin}>
            <h2>Donor login</h2>
            <Input label="Registered email" name="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} type="email" required />
            <Input label="Password" name="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} type="password" required />
            <button className="primary-button form-submit" type="submit">Login with Password</button>
          </form>
          <div className="form-grid single">
            <h2>Email code login</h2>
            <Input label="Registered email" name="codeEmail" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} type="email" />
            <button className="secondary-button" onClick={sendCode}>Send Verification Code</button>
            <Input label="Verification code" name="code" value={loginForm.code} onChange={(event) => setLoginForm({ ...loginForm, code: event.target.value })} />
            <button className="primary-button" onClick={verifyCode}>Verify Code</button>
          </div>
          <div className="form-grid single">
            <h2>Google login</h2>
            <GoogleLoginButton label="Use a registered Google email" onSuccess={googleLogin} onError={setMessage} />
          </div>
        </div>
      ) : (
        <div className="inline-panel donor-profile">
          <div>
            <h2>{donor?.name}</h2>
            <p><span className="blood-pill">{donor?.bloodGroup}</span> {donor?.city} · {donor?.verificationStatus || (donor?.verified ? "Verified" : "Pending")}</p>
            <p>Current availability: <strong>{donor?.availabilityStatus}</strong></p>
          </div>
          <button className="primary-button" onClick={() => updateAvailability("Available")}>I am Available</button>
          <button className="secondary-button" onClick={() => updateAvailability("Temporarily unavailable")}>I am Unavailable</button>
          <button className="secondary-button" onClick={() => { localStorage.removeItem("smartBloodDonorToken"); setToken(""); setDonor(null); }}>Logout</button>
        </div>
      )}
      <div className="toolbar">
        <Select label="Blood group" name="bloodGroup" value={filter.bloodGroup} onChange={(event) => setFilter({ ...filter, bloodGroup: event.target.value })} options={["", ...bloodGroups]} />
        <Input label="City" name="city" value={filter.city} onChange={(event) => setFilter({ ...filter, city: event.target.value })} />
        <Select label="Availability" name="availability" value={filter.availability} onChange={(event) => setFilter({ ...filter, availability: event.target.value })} options={["", ...availabilityStates]} />
        <label className="checkbox-row compact"><input type="checkbox" checked={filter.eligibility} onChange={(event) => setFilter({ ...filter, eligibility: event.target.checked })} /> Eligible only</label>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr><th>Donor</th><th>Blood</th><th>City</th><th>Status</th><th>Eligibility</th><th>Badge</th></tr>
          </thead>
          <tbody>
            {filteredDonors.map((donor) => (
              <tr key={donor.id}>
                <td>{donor.name}<small>{donor.id}</small></td>
                <td><span className="blood-pill">{donor.bloodGroup}</span></td>
                <td>{donor.city}</td>
                <td>{donor.availabilityStatus}</td>
                <td>{donor.eligibility?.eligible ? "Eligible" : `Wait ${donor.eligibility?.waitDays || 0} days`}</td>
                <td>{donor.rewardBadge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function BloodRequest() {
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    patientName: "",
    bloodGroupNeeded: "O+",
    hospitalName: "",
    hospitalContact: "",
    doctorVerification: "",
    emergencyLevel: "High",
    location: "Bengaluru",
    unitsRequired: 1,
    latitude: 12.9716,
    longitude: 77.5946
  });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await postJson("/requests", form);
      setMessage(`${result.message}. Status: ${result.request.status}, spam risk: ${result.request.spamRisk}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="page">
      <PageHeader eyebrow="Verified emergency request" title="Submit a hospital-backed blood request" text="The system scores authenticity before any donor phone or email can be unlocked." />
      <form className="form-grid" onSubmit={submit}>
        <Input label="Patient name" name="patientName" value={form.patientName} onChange={(event) => setForm({ ...form, patientName: event.target.value })} required />
        <Select label="Blood group needed" name="bloodGroupNeeded" value={form.bloodGroupNeeded} onChange={(event) => setForm({ ...form, bloodGroupNeeded: event.target.value })} options={bloodGroups} />
        <Input label="Hospital name" name="hospitalName" value={form.hospitalName} onChange={(event) => setForm({ ...form, hospitalName: event.target.value })} required />
        <Input label="Hospital contact number" name="hospitalContact" value={form.hospitalContact} onChange={(event) => setForm({ ...form, hospitalContact: event.target.value })} required />
        <Input label="Doctor or authority verification" name="doctorVerification" value={form.doctorVerification} onChange={(event) => setForm({ ...form, doctorVerification: event.target.value })} required />
        <Select label="Emergency level" name="emergencyLevel" value={form.emergencyLevel} onChange={(event) => setForm({ ...form, emergencyLevel: event.target.value })} options={["Low", "Medium", "High", "Critical"]} />
        <Input label="Location" name="location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        <Input label="Units required" name="unitsRequired" type="number" value={form.unitsRequired} onChange={(event) => setForm({ ...form, unitsRequired: event.target.value })} />
        <button className="primary-button form-submit" type="submit">Verify and Submit Request</button>
      </form>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function Recommendations() {
  const [query, setQuery] = useState({ bloodGroupNeeded: "O+", location: "Bengaluru", emergencyLevel: "Critical" });
  const [result, setResult] = useState({ recommendations: [] });
  const [unlocked, setUnlocked] = useState("");

  const load = async () => {
    const params = new URLSearchParams(query);
    const response = await fetch(`${API_URL}/recommendations?${params}`);
    setResult(await response.json());
  };

  useEffect(() => {
    let active = true;
    const loadInitialRecommendations = async () => {
      const params = new URLSearchParams({
        bloodGroupNeeded: "O+",
        location: "Bengaluru",
        emergencyLevel: "Critical"
      });
      const response = await fetch(`${API_URL}/recommendations?${params}`);
      const json = await response.json();
      if (active) setResult(json);
    };

    loadInitialRecommendations();
    return () => {
      active = false;
    };
  }, []);

  const unlock = async (donorId) => {
    try {
      const requests = await fetch(`${API_URL}/requests`).then((response) => response.json());
      const verified = requests.find((request) => request.status === "Verified");
      const result = await postJson(`/requests/${verified.id}/unlock-contact`, { donorId });
      setUnlocked(`${result.contact.name}: ${result.contact.phone}, ${result.contact.email}`);
    } catch (error) {
      setUnlocked(error.message);
    }
  };

  return (
    <section className="page">
      <PageHeader eyebrow="AI donor recommendation" title="Rank currently available donors" text="The scoring model now only recommends verified donors who are marked Available, then ranks them by compatibility, distance, eligibility, consent, and emergency priority." />
      <div className="toolbar">
        <Select label="Needed blood" name="bloodGroupNeeded" value={query.bloodGroupNeeded} onChange={(event) => setQuery({ ...query, bloodGroupNeeded: event.target.value })} options={bloodGroups} />
        <Input label="Location" name="location" value={query.location} onChange={(event) => setQuery({ ...query, location: event.target.value })} />
        <Select label="Emergency level" name="emergencyLevel" value={query.emergencyLevel} onChange={(event) => setQuery({ ...query, emergencyLevel: event.target.value })} options={["Low", "Medium", "High", "Critical"]} />
        <button className="primary-button" onClick={load}>Run AI Match</button>
      </div>
      <div className="recommendation-grid">
        {result.recommendations.map((donor) => (
          <article className="donor-card" key={donor.id}>
            <h3>{donor.name}</h3>
            <p><span className="blood-pill">{donor.bloodGroup}</span> {donor.city} · {donor.distanceKm} km</p>
            <p>{donor.eligibility.eligible ? "Eligible" : `Not eligible yet, ${donor.eligibility.waitDays} days remaining`}</p>
            <ul>{donor.matchReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            <button className="secondary-button" onClick={() => unlock(donor.id)}>Unlock Contact</button>
          </article>
        ))}
      </div>
      {unlocked && <p className="notice">{unlocked}</p>}
    </section>
  );
}

function EmergencyTracker() {
  const { data: requests } = useApi("/requests?includeUnverified=true", []);
  const { data: alerts } = useApi("/emergency-alerts", []);

  return (
    <section className="page">
      <PageHeader eyebrow="Live request tracking" title="Emergency status and donor alerts" text="Requests move through pending, verified, rejected, and contact-unlocked states with emergency donor alert counts." />
      <div className="feature-grid">
        {alerts.map((alert) => (
          <article className="feature-card" key={alert.requestId}>
            <h3>{alert.bloodGroupNeeded} needed in {alert.location}</h3>
            <p>{alert.alertedDonors} nearby emergency donors alerted. Current status: {alert.status}.</p>
          </article>
        ))}
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Request</th><th>Hospital</th><th>Level</th><th>Verification</th><th>Risk</th><th>Status</th></tr></thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.patientName}<small>{request.bloodGroupNeeded}</small></td>
                <td>{request.hospitalName}</td>
                <td>{request.emergencyLevel}</td>
                <td>{request.status === "Verified" ? "Verified" : "Not verified"}</td>
                <td>{request.spamRisk}</td>
                <td>{request.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminDashboard() {
  const { data: dashboard } = useApi("/dashboard", {});
  const [token, setToken] = useState(localStorage.getItem("smartBloodToken") || "");
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem("smartBloodAdminEmail") || "");
  const [submissions, setSubmissions] = useState({ requests: [], donors: [] });
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState("");

  const loadSubmissions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/admin/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Admin login required");
      setSubmissions(json);
    } catch (error) {
      setMessage(error.message);
      setToken("");
      localStorage.removeItem("smartBloodToken");
    }
  }, [token]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const login = async (form) => {
    const result = await postJson("/auth/login", form);
    localStorage.setItem("smartBloodToken", result.token);
    localStorage.setItem("smartBloodAdminEmail", result.user.email);
    setToken(result.token);
    setAdminEmail(result.user.email);
    setMessage("Admin login verified. Full details are now unlocked.");
  };

  const googleLogin = useCallback(async (credential) => {
    const result = await postJson("/auth/google", { credential });
    if (result.role !== "admin") throw new Error("Only the admin Google account can access this portal.");
    localStorage.setItem("smartBloodToken", result.token);
    localStorage.setItem("smartBloodAdminEmail", result.user.email);
    setToken(result.token);
    setAdminEmail(result.user.email);
    setMessage("Admin Google login verified. Full details are now unlocked.");
  }, []);

  const logout = () => {
    localStorage.removeItem("smartBloodToken");
    localStorage.removeItem("smartBloodAdminEmail");
    setToken("");
    setAdminEmail("");
    setSubmissions({ requests: [], donors: [] });
  };

  const setNote = (id, value) => {
    setNotes((current) => ({ ...current, [id]: value }));
  };

  const verifyItem = async (type, id, approved) => {
    try {
      const path = type === "request" ? `/requests/${id}/verify` : `/donors/${id}/verify`;
      const defaultNote = approved ? "Verified by admin." : "Verification failed. Details are incomplete or not valid.";
      const response = await fetch(`${API_URL}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approved, note: notes[id] || defaultNote })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Action failed");
      setMessage(json.message);
      await loadSubmissions();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!token) {
    return (
      <section className="page narrow">
        <PageHeader eyebrow="Private admin portal" title="Admin login" text="Only roshankulkarni122@gmail.com can unlock verification controls and full submission details." />
        <AdminLoginForm onLogin={login} onGoogleLogin={googleLogin} />
        {message && <p className="notice">{message}</p>}
      </section>
    );
  }

  return (
    <section className="page">
      <PageHeader eyebrow="Private admin portal" title="Verify requests and donor registrations" text={`Signed in as ${adminEmail || "admin"}. Full details and verification actions are visible only after admin login.`} />
      <StatsGrid dashboard={dashboard} />
      <div className="inline-panel">
        <button className="secondary-button" onClick={loadSubmissions}>Refresh Submissions</button>
        <button className="secondary-button" onClick={logout}>Logout</button>
      </div>

      <div className="admin-section">
        <h2>Blood requests</h2>
        <div className="admin-grid">
          {submissions.requests.map((request) => (
            <article className="admin-card" key={request.id}>
              <div className="admin-card-header">
                <h3>{request.patientName}</h3>
                <span className="blood-pill">{request.bloodGroupNeeded}</span>
              </div>
              <DetailGrid items={[
                ["Request ID", request.id],
                ["Hospital", request.hospitalName],
                ["Hospital contact", request.hospitalContact],
                ["Doctor verification", request.doctorVerification],
                ["Emergency level", request.emergencyLevel],
                ["Location", request.location],
                ["Units", request.unitsRequired],
                ["Score", request.verificationScore],
                ["Spam risk", request.spamRisk],
                ["Status", request.status],
                ["Submitted", new Date(request.createdAt).toLocaleString()],
                ["Admin comment", request.adminNote || "No comment"]
              ]} />
              <AdminDecision id={request.id} notes={notes} setNote={setNote} onVerify={(approved) => verifyItem("request", request.id, approved)} />
            </article>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>Donor registrations</h2>
        <div className="admin-grid">
          {submissions.donors.map((donor) => (
            <article className="admin-card" key={donor.id}>
              <div className="admin-card-header">
                <h3>{donor.name}</h3>
                <span className="blood-pill">{donor.bloodGroup}</span>
              </div>
              <DetailGrid items={[
                ["Donor ID", donor.id],
                ["Age", donor.age],
                ["Gender", donor.gender],
                ["Phone", donor.phone],
                ["Email", donor.email],
                ["Address", donor.address],
                ["City", donor.city],
                ["Weight", `${donor.weight} kg`],
                ["Last donation", donor.lastDonationDate],
                ["Health conditions", donor.healthConditions],
                ["Availability", donor.availabilityStatus],
                ["Emergency contact", donor.emergencyContact],
                ["Preferred area", donor.preferredArea],
                ["Consent", donor.consentToShare ? "Yes" : "No"],
                ["Status", donor.verificationStatus || (donor.verified ? "Verified" : "Pending")],
                ["Admin comment", donor.adminNote || "No comment"]
              ]} />
              <AdminDecision id={donor.id} notes={notes} setNote={setNote} onVerify={(approved) => verifyItem("donor", donor.id, approved)} />
            </article>
          ))}
        </div>
      </div>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function AdminLoginForm({ onLogin, onGoogleLogin }) {
  const [form, setForm] = useState({ email: "roshankulkarni122@gmail.com", password: "" });
  const [message, setMessage] = useState("");

  const login = async (event) => {
    event.preventDefault();
    try {
      await onLogin(form);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <form className="form-grid single" onSubmit={login}>
      <Input label="Admin email" name="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <Input label="Password" name="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      <button className="primary-button form-submit" type="submit">Login as Admin</button>
      <GoogleLoginButton label="Use admin Google account" onSuccess={onGoogleLogin} onError={setMessage} />
      {message && <p className="notice">{message}</p>}
    </form>
  );
}

function DetailGrid({ items }) {
  return (
    <dl className="detail-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || "Not provided"}</dd>
        </div>
      ))}
    </dl>
  );
}

function AdminDecision({ id, notes, setNote, onVerify }) {
  return (
    <div className="admin-decision">
      <label className="field">
        <span>Admin comment</span>
        <textarea value={notes[id] || ""} onChange={(event) => setNote(id, event.target.value)} placeholder="Write reason for approval or failure" />
      </label>
      <div className="action-cell">
        <button onClick={() => onVerify(true)}>Mark Verified</button>
        <button onClick={() => onVerify(false)}>Verification Failed</button>
      </div>
    </div>
  );
}

function LoginRegister() {
  const [form, setForm] = useState({ email: "roshankulkarni122@gmail.com", password: "" });
  const [message, setMessage] = useState("");

  const login = async (event) => {
    event.preventDefault();
    try {
      const result = await postJson("/auth/login", form);
      localStorage.setItem("smartBloodToken", result.token);
      localStorage.setItem("smartBloodAdminEmail", result.user.email);
      setMessage("Admin login verified. Open the Admin page to manage submissions.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const googleLogin = useCallback(async (credential) => {
    const result = await postJson("/auth/google", { credential });
    if (result.role !== "admin") throw new Error("Only the admin Google account can access this page.");
    localStorage.setItem("smartBloodToken", result.token);
    localStorage.setItem("smartBloodAdminEmail", result.user.email);
    setMessage("Admin Google login verified. Open the Admin page to manage submissions.");
  }, []);

  return (
    <section className="page narrow">
      <PageHeader eyebrow="Private admin login" title="Admin access" text="Only roshankulkarni122@gmail.com can access the admin portal." />
      <form className="form-grid single" onSubmit={login}>
        <Input label="Email" name="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Input label="Password" name="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <button className="primary-button form-submit" type="submit">Login</button>
        <GoogleLoginButton label="Use admin Google account" onSuccess={googleLogin} onError={setMessage} />
      </form>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function Contact() {
  return (
    <section className="page two-column">
      <div>
        <PageHeader eyebrow="Hospital integration support" title="Contact and integration readiness" text="Use this page as a project demo endpoint for hospitals, blood banks, NGOs, and reviewers." />
        <div className="contact-list">
          <p><strong>Email:</strong> support@smartblood.ai</p>
          <p><strong>Emergency desk:</strong> +91 90000 11111</p>
          <p><strong>API base:</strong> {API_URL}</p>
        </div>
      </div>
      <div className="feature-card">
        <h3>Integration checklist</h3>
        <p>Hospital registry, SMS gateway, email provider, map provider, MongoDB Atlas, and deployment environment variables can be attached without changing UI flows.</p>
      </div>
    </section>
  );
}

function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: "ai", text: "Ask me about eligibility, compatibility, fake request prevention, or donor privacy." }]);
  const [message, setMessage] = useState("");

  const localReply = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("compat")) return "Blood compatibility means the requested blood group must safely receive blood from the donor group. For example, O- is the universal red-cell donor and AB+ can receive from all groups.";
    if (lowerText.includes("eligible") || lowerText.includes("donate")) return "A donor is eligible when age, weight, health condition, and the minimum donation gap are safe. The app checks waiting days after the last donation automatically.";
    if (lowerText.includes("fake") || lowerText.includes("verify")) return "Fake requests are reduced using hospital name, hospital phone, doctor or authority reference, emergency level, spam-risk scoring, and admin approval before contact sharing.";
    if (lowerText.includes("privacy") || lowerText.includes("contact")) return "Donor phone and email stay hidden until a blood request is verified and the donor has consented to contact sharing.";
    if (lowerText.includes("emergency")) return "Emergency requests are prioritized by urgency level, location, compatible blood group, donor availability, and eligibility. Critical requests can use emergency override for opted-in donors.";
    return "I can help with donor eligibility, blood compatibility, emergency request submission, fake request prevention, donor privacy, and admin verification.";
  };

  const send = async () => {
    if (!message.trim()) return;
    const outgoing = message;
    const next = [...messages, { from: "user", text: message }];
    setMessages(next);
    setMessage("");
    try {
      const result = await postJson("/chat", { message: outgoing });
      setMessages([...next, { from: "ai", text: result.reply }]);
    } catch {
      setMessages([...next, { from: "ai", text: localReply(outgoing) }]);
    }
  };

  return (
    <div className={`chat ${open ? "open" : ""}`}>
      <button className="chat-toggle" onClick={() => setOpen(!open)}>AI</button>
      {open && (
        <div className="chat-panel">
          <h3>AI Chat Assistant</h3>
          <div className="chat-log">
            {messages.map((item, index) => <p key={`${item.from}-${index}`} className={item.from}>{item.text}</p>)}
          </div>
          <div className="chat-input">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send();
              }}
              placeholder="Ask a question"
            />
            <button onClick={send}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeader({ eyebrow, title, text }) {
  return (
    <div className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>
        {options.map((option) => <option key={option} value={option}>{option || "Any"}</option>)}
      </select>
    </label>
  );
}

export default App;
