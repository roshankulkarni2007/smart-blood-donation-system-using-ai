const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5050;
const DEFAULT_CLIENT_URLS = [
  "https://smart-blood-donation-system-using-7ry8ykwew-roshan-s-projects8.vercel.app",
  "http://localhost:5173"
];
const CLIENT_URLS = (process.env.CLIENT_URL || DEFAULT_CLIENT_URLS.join(","))
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const JWT_SECRET = process.env.JWT_SECRET || "smart-blood-demo-secret";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "roshankulkarni122@gmail.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Roshan@2007";
const DB_NAME = process.env.DB_NAME || "smart-blood-donation";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || "Smart Blood Donation <no-reply@smartblood.local>";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
let mongoDatabase = null;

app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || CLIENT_URLS.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

const BLOOD_COMPATIBILITY = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"]
};

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);

const db = {
  donors: [
    {
      id: "DNR-1001",
      name: "Roshan",
      age: 22,
      gender: "Male",
      bloodGroup: "O+",
      phone: "+91 98765 10001",
      email: "roshan.donor@example.com",
      address: "Indiranagar, Bengaluru",
      city: "Bengaluru",
      latitude: 12.9719,
      longitude: 77.6412,
      lastDonationDate: daysAgo(102),
      healthConditions: "None",
      weight: 72,
      availabilityStatus: "Available",
      unavailableUntil: null,
      emergencyContact: "+91 98765 90001",
      preferredArea: "East Bengaluru",
      emergencyAvailable: true,
      consentToShare: true,
      donationsCount: 8,
      rewardBadge: "Gold Lifesaver",
      verified: true,
      createdAt: daysAgo(370)
    },
    {
      id: "DNR-1002",
      name: "Roopesh",
      age: 24,
      gender: "Female",
      bloodGroup: "A+",
      phone: "+91 98765 10002",
      email: "lakshmitha.donor@example.com",
      address: "Mysuru Road, Bengaluru",
      city: "Bengaluru",
      latitude: 12.925,
      longitude: 77.5468,
      lastDonationDate: daysAgo(130),
      healthConditions: "None",
      weight: 61,
      availabilityStatus: "Available",
      unavailableUntil: null,
      emergencyContact: "+91 98765 90002",
      preferredArea: "South Bengaluru",
      emergencyAvailable: true,
      consentToShare: true,
      donationsCount: 5,
      rewardBadge: "Silver Lifesaver",
      verified: true,
      createdAt: daysAgo(260)
    },
    {
      id: "DNR-1003",
      name: "Lakshmitha",
      age: 28,
      gender: "Male",
      bloodGroup: "B-",
      phone: "+91 98765 10003",
      email: "aditya.donor@example.com",
      address: "Kuvempu Nagar, Mysuru",
      city: "Mysuru",
      latitude: 12.2958,
      longitude: 76.6394,
      lastDonationDate: daysAgo(63),
      healthConditions: "None",
      weight: 79,
      availabilityStatus: "Busy",
      unavailableUntil: daysAgo(-2),
      emergencyContact: "+91 98765 90003",
      preferredArea: "Mysuru city",
      emergencyAvailable: false,
      consentToShare: true,
      donationsCount: 3,
      rewardBadge: "Bronze Lifesaver",
      verified: true,
      createdAt: daysAgo(180)
    },
    {
      id: "DNR-1004",
      name: "Aditya",
      age: 31,
      gender: "Female",
      bloodGroup: "AB+",
      phone: "+91 98765 10004",
      email: "meera.donor@example.com",
      address: "Anna Nagar, Chennai",
      city: "Chennai",
      latitude: 13.085,
      longitude: 80.2101,
      lastDonationDate: daysAgo(96),
      healthConditions: "None",
      weight: 66,
      availabilityStatus: "Available",
      unavailableUntil: null,
      emergencyContact: "+91 98765 90004",
      preferredArea: "Central Chennai",
      emergencyAvailable: true,
      consentToShare: true,
      donationsCount: 11,
      rewardBadge: "Platinum Lifesaver",
      verified: true,
      createdAt: daysAgo(520)
    },
    {
      id: "DNR-1005",
      name: "Donor Volunteer",
      age: 20,
      gender: "Male",
      bloodGroup: "O-",
      phone: "+91 98765 10005",
      email: "imran.donor@example.com",
      address: "Gachibowli, Hyderabad",
      city: "Hyderabad",
      latitude: 17.4401,
      longitude: 78.3489,
      lastDonationDate: daysAgo(28),
      healthConditions: "Recovered from fever recently",
      weight: 69,
      availabilityStatus: "Temporarily unavailable",
      unavailableUntil: daysAgo(-12),
      emergencyContact: "+91 98765 90005",
      preferredArea: "West Hyderabad",
      emergencyAvailable: true,
      consentToShare: false,
      donationsCount: 2,
      rewardBadge: "Community Helper",
      verified: true,
      createdAt: daysAgo(90)
    }
  ],
  requests: [
    {
      id: "REQ-2201",
      patientName: "Ananya S",
      bloodGroupNeeded: "O+",
      hospitalName: "St. John Medical Centre",
      hospitalContact: "+91 80220 65000",
      doctorVerification: "Dr. Kavya Rao, Reg: KMC-21459",
      emergencyLevel: "Critical",
      location: "Bengaluru",
      latitude: 12.9345,
      longitude: 77.6205,
      unitsRequired: 2,
      status: "Verified",
      verificationScore: 96,
      spamRisk: "Low",
      consentUnlocked: false,
      assignedDonors: ["DNR-1001", "DNR-1002"],
      createdAt: new Date(Date.now() - 1000 * 60 * 33).toISOString()
    },
    {
      id: "REQ-2202",
      patientName: "Ravi Menon",
      bloodGroupNeeded: "B-",
      hospitalName: "Apollo Hospital Mysuru",
      hospitalContact: "+91 82140 04000",
      doctorVerification: "Dr. Prakash M, ICU reference 771",
      emergencyLevel: "High",
      location: "Mysuru",
      latitude: 12.3072,
      longitude: 76.6497,
      unitsRequired: 1,
      status: "Pending Verification",
      verificationScore: 78,
      spamRisk: "Medium",
      consentUnlocked: false,
      assignedDonors: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString()
    }
  ],
  hospitals: [
    { id: "HSP-301", name: "St. John Medical Centre", city: "Bengaluru", verified: true, contact: "+91 80220 65000" },
    { id: "HSP-302", name: "Apollo Hospital Mysuru", city: "Mysuru", verified: true, contact: "+91 82140 04000" },
    { id: "HSP-303", name: "Aster CMI Hospital", city: "Bengaluru", verified: true, contact: "+91 80434 20100" }
  ],
  admins: [
    {
      id: "ADM-1",
      name: "Project Admin",
      email: ADMIN_EMAIL,
      role: "admin",
      passwordHash: hashPassword(ADMIN_PASSWORD)
    }
  ],
  notifications: [
    { id: "NOT-1", type: "Emergency Alert", message: "O+ donors alerted near Bengaluru.", channel: "SMS", status: "Sent" },
    { id: "NOT-2", type: "Eligibility Reminder", message: "12 donors become eligible this week.", channel: "Email", status: "Queued" }
  ],
  donationHistory: [
    { id: "HIS-1", donorId: "DNR-1001", hospitalName: "Aster CMI Hospital", date: daysAgo(102), units: 1 },
    { id: "HIS-2", donorId: "DNR-1002", hospitalName: "St. John Medical Centre", date: daysAgo(130), units: 1 },
    { id: "HIS-3", donorId: "DNR-1004", hospitalName: "MIOT International", date: daysAgo(96), units: 1 }
  ]
};

function hashPassword(password) {
  return crypto.createHash("sha256").update(`${password}:${JWT_SECRET}`).digest("hex");
}

function signToken(payload) {
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(encoded).digest("base64url");
  if (signature !== expected) return null;
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  return payload.exp > Date.now() ? payload : null;
}

function requireRole(role) {
  return (req, res, next) => {
    const payload = verifyToken((req.headers.authorization || "").replace("Bearer ", ""));
    if (!payload || (role && payload.role !== role) || payload.email !== ADMIN_EMAIL) {
      return res.status(401).json({ message: "Protected API. Login with a valid role token." });
    }
    req.user = payload;
    return next();
  };
}

function requireDonor(req, res, next) {
  const payload = verifyToken((req.headers.authorization || "").replace("Bearer ", ""));
  if (!payload || payload.role !== "donor") {
    return res.status(401).json({ message: "Donor login required." });
  }
  req.user = payload;
  return next();
}

function daysSince(dateString) {
  if (!dateString) return 999;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
}

function distanceKm(a, b) {
  if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return a.city === b.location ? 5 : 80;
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 10) / 10;
}

function eligibility(donor) {
  const minGap = donor.gender === "Female" ? 120 : 90;
  const ageOk = Number(donor.age) >= 18 && Number(donor.age) <= 60;
  const weightOk = Number(donor.weight) >= 50;
  const healthOk = !/fever|anemia|cardiac|infection|pregnant|recent surgery/i.test(donor.healthConditions || "");
  const waitDays = Math.max(0, minGap - daysSince(donor.lastDonationDate));
  return {
    eligible: ageOk && weightOk && healthOk && waitDays === 0,
    waitDays,
    reasons: [
      !ageOk && "Age must be between 18 and 60",
      !weightOk && "Weight must be at least 50 kg",
      !healthOk && "Health condition requires medical clearance",
      waitDays > 0 && `${waitDays} waiting days remaining`
    ].filter(Boolean)
  };
}

function verificationScore(request) {
  let score = 30;
  if (request.patientName && request.patientName.length > 2) score += 10;
  if (BLOOD_COMPATIBILITY[request.bloodGroupNeeded]) score += 10;
  if (/hospital|medical|clinic|centre|center/i.test(request.hospitalName || "")) score += 15;
  if (/dr\.|doctor|reg|icu|ward|authority/i.test(request.doctorVerification || "")) score += 20;
  if (/^\+?\d[\d\s-]{8,}$/.test(request.hospitalContact || "")) score += 10;
  if (["Critical", "High"].includes(request.emergencyLevel)) score += 5;
  return Math.min(100, score);
}

function spamRisk(score, request) {
  if (score < 55 || /(test|fake|spam|unknown)/i.test(JSON.stringify(request))) return "High";
  if (score < 80) return "Medium";
  return "Low";
}

function donorRecommendation(donor, request, options = {}) {
  const compatible = (BLOOD_COMPATIBILITY[request.bloodGroupNeeded] || []).includes(donor.bloodGroup);
  const donorEligibility = eligibility(donor);
  const distance = distanceKm(donor, request);
  const available = donor.availabilityStatus === "Available";
  const emergencyOverride = options.emergencyOverride && donor.emergencyAvailable;
  let score = 0;

  if (compatible) score += 30;
  if (available || emergencyOverride) score += 20;
  if (donorEligibility.eligible) score += 20;
  score += Math.max(0, 15 - Math.min(distance, 60) / 4);
  score += Math.min(10, daysSince(donor.lastDonationDate) / 20);
  if (request.emergencyLevel === "Critical") score += 5;
  if (donor.verified && donor.consentToShare) score += 5;
  if (!compatible) score = 0;
  if (!available && !emergencyOverride) score -= 20;
  if (!donorEligibility.eligible) score -= 15;

  return {
    ...donor,
    phone: undefined,
    email: undefined,
    distanceKm: distance,
    eligibility: donorEligibility,
    recommendationScore: Math.max(0, Math.round(score)),
    matchReasons: [
      compatible ? "Compatible blood group" : "Incompatible blood group",
      available ? "Currently available" : emergencyOverride ? "Emergency override enabled" : "Unavailable",
      donorEligibility.eligible ? "Donation gap and health checks passed" : "Eligibility restriction active",
      `${distance} km from request location`,
      donor.consentToShare ? "Consent ready" : "Consent pending"
    ]
  };
}

function publicDonor(donor) {
  return {
    ...donor,
    phone: undefined,
    email: undefined,
    emergencyContact: undefined,
    passwordHash: undefined,
    verificationCode: undefined,
    verificationCodeExpires: undefined,
    eligibility: eligibility(donor)
  };
}

function privateDonor(donor) {
  return {
    ...donor,
    passwordHash: undefined,
    verificationCode: undefined,
    verificationCodeExpires: undefined,
    eligibility: eligibility(donor)
  };
}

function emailConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

async function sendVerificationEmail(to, code) {
  if (!emailConfigured()) {
    return { sent: false, reason: "SMTP email is not configured." };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Smart Blood Donation verification code",
    text: `Your Smart Blood Donation verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#231f20">
        <h2>Smart Blood Donation verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:3px">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });

  return { sent: true };
}

function sanitizeRecord(record) {
  if (!record) return record;
  const { _id, ...rest } = record;
  return rest;
}

function collection(name) {
  return mongoDatabase.collection(name);
}

async function findAll(name) {
  if (!mongoDatabase) return db[name];
  return collection(name).find({}, { projection: { _id: 0 } }).toArray();
}

async function findOne(name, query) {
  if (!mongoDatabase) return db[name].find((item) => Object.entries(query).every(([key, value]) => item[key] === value));
  return sanitizeRecord(await collection(name).findOne(query, { projection: { _id: 0 } }));
}

async function insertOne(name, record, { front = false } = {}) {
  if (!mongoDatabase) {
    if (front) db[name].unshift(record);
    else db[name].push(record);
    return record;
  }
  await collection(name).insertOne(record);
  return record;
}

async function updateOne(name, id, updates) {
  if (!mongoDatabase) {
    const record = db[name].find((item) => item.id === id);
    if (!record) return null;
    Object.assign(record, updates);
    return record;
  }
  const updatedAt = new Date().toISOString();
  await collection(name).updateOne({ id }, { $set: { ...updates, updatedAt } });
  return findOne(name, { id });
}

async function updateByQuery(name, query, updates) {
  if (!mongoDatabase) {
    const record = db[name].find((item) => Object.entries(query).every(([key, value]) => item[key] === value));
    if (!record) return null;
    Object.assign(record, updates);
    return record;
  }
  const updatedAt = new Date().toISOString();
  await collection(name).updateOne(query, { $set: { ...updates, updatedAt } });
  return findOne(name, query);
}

async function countsByCollection() {
  if (!mongoDatabase) return Object.keys(db).map((name) => ({ name, count: db[name].length }));
  return Promise.all(Object.keys(db).map(async (name) => ({ name, count: await collection(name).countDocuments() })));
}

async function initDatabase() {
  if (!process.env.MONGO_URI) return;

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  mongoDatabase = client.db(DB_NAME);

  await Promise.all(Object.keys(db).map(async (name) => {
    const existing = await collection(name).countDocuments();
    if (existing === 0) await collection(name).insertMany(db[name]);
  }));

  const admin = await findOne("admins", { email: ADMIN_EMAIL });
  if (!admin) {
    await insertOne("admins", {
      id: "ADM-1",
      name: "Project Admin",
      email: ADMIN_EMAIL,
      role: "admin",
      passwordHash: hashPassword(ADMIN_PASSWORD)
    });
  } else if (admin.passwordHash !== hashPassword(ADMIN_PASSWORD)) {
    await collection("admins").updateOne(
      { email: ADMIN_EMAIL },
      { $set: { passwordHash: hashPassword(ADMIN_PASSWORD), role: "admin", updatedAt: new Date().toISOString() } }
    );
  }
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get("/", asyncRoute(async (req, res) => {
  res.json({
    name: "Smart Blood Donation System Using AI",
    status: "running",
    mode: mongoDatabase ? "MongoDB permanent cloud storage" : "in-memory demo database",
    collections: Object.keys(db)
  });
}));

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Smart Blood Donation API Server",
    timestamp: new Date().toISOString(),
    port: PORT,
    database: mongoDatabase ? "MongoDB connected" : "In-memory demo database"
  });
});

app.get("/api/docs", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}/api`;

  res.json({
    name: "Smart Blood Donation System Using AI API",
    baseUrl,
    auth: {
      login: "POST /auth/login",
      adminEmail: ADMIN_EMAIL
    },
    endpoints: [
      { method: "GET", path: "/health", purpose: "Check API server status" },
      { method: "GET", path: "/dashboard", purpose: "Dashboard statistics and trends" },
      { method: "POST", path: "/auth/google", purpose: "Login with a verified Google account" },
      { method: "GET", path: "/donors", purpose: "List donors with filters" },
      { method: "POST", path: "/donors", purpose: "Register a new donor" },
      { method: "POST", path: "/donor-auth/login", purpose: "Donor login with registered email and password" },
      { method: "POST", path: "/donor-auth/request-code", purpose: "Generate donor email verification code" },
      { method: "POST", path: "/donor-auth/verify-code", purpose: "Login donor with email verification code" },
      { method: "GET", path: "/donor-auth/me", purpose: "Protected donor profile" },
      { method: "PATCH", path: "/donor-auth/availability", purpose: "Protected donor availability update" },
      { method: "PATCH", path: "/donors/:id/availability", purpose: "Update donor availability and location" },
      { method: "POST", path: "/requests", purpose: "Create verified blood request workflow" },
      { method: "GET", path: "/requests", purpose: "Track blood requests" },
      { method: "GET", path: "/recommendations", purpose: "AI ranked donor recommendations" },
      { method: "GET", path: "/emergency-alerts", purpose: "Emergency alert queue" },
      { method: "POST", path: "/requests/:id/unlock-contact", purpose: "Unlock donor contact after verification and consent" },
      { method: "POST", path: "/chat", purpose: "AI chat assistant response" },
      { method: "PATCH", path: "/requests/:id/verify", purpose: "Admin request approval or rejection" },
      { method: "GET", path: "/admin/analytics", purpose: "Protected admin analytics" },
      { method: "GET", path: "/admin/submissions", purpose: "Protected full donor and request details" }
    ],
    mongodbCollections: ["donors", "requests", "hospitals", "admins", "notifications", "donationHistory"]
  });
});

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const { password } = req.body;
  const admin = await findOne("admins", { email });
  if (!admin) return res.status(401).json({ message: "Invalid login credentials" });
  if (admin.email !== ADMIN_EMAIL || admin.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: "Only the project admin email can access this portal." });
  }
  res.json({ token: signToken({ id: admin.id, role: admin.role, email: admin.email }), user: { name: admin.name, role: admin.role, email: admin.email } });
}));

app.post("/api/auth/google", asyncRoute(async (req, res) => {
  if (!googleClient) {
    return res.status(503).json({ message: "Google login is not configured yet." });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: req.body.credential,
    audience: GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  const email = String(payload.email || "").toLowerCase();
  if (!email || !payload.email_verified) {
    return res.status(401).json({ message: "Google email is not verified." });
  }

  if (email === ADMIN_EMAIL) {
    const token = signToken({ id: "ADM-1", role: "admin", email });
    return res.json({ token, role: "admin", user: { name: payload.name || "Project Admin", role: "admin", email } });
  }

  const donor = await findOne("donors", { email });
  if (!donor) {
    return res.status(404).json({ message: "No donor registration found for this Google email. Please register first." });
  }

  const token = signToken({ id: donor.id, role: "donor", email: donor.email });
  res.json({ token, role: "donor", donor: privateDonor(donor) });
}));

app.post("/api/donor-auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const { password } = req.body;
  const donor = await findOne("donors", { email });
  const passwordHash = donor?.passwordHash || hashPassword("donor123");
  if (!donor || passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: "Invalid donor email or password." });
  }
  const token = signToken({ id: donor.id, role: "donor", email: donor.email });
  res.json({ token, donor: privateDonor(donor) });
}));

app.post("/api/donor-auth/request-code", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const donor = await findOne("donors", { email });
  if (!donor) return res.status(404).json({ message: "No donor registration found for this email." });

  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  await updateOne("donors", donor.id, {
    verificationCode,
    verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });

  const emailResult = await sendVerificationEmail(donor.email, verificationCode);
  if (emailResult.sent) {
    return res.json({ message: "Verification code sent to your registered email." });
  }

  res.json({
    message: "Verification code generated. Email is not configured yet, so this demo shows the code on screen.",
    demoEmailCode: verificationCode
  });
}));

app.post("/api/donor-auth/verify-code", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const code = String(req.body.code || "");
  const donor = await findOne("donors", { email });
  if (!donor || donor.verificationCode !== code || new Date(donor.verificationCodeExpires || 0) < new Date()) {
    return res.status(401).json({ message: "Invalid or expired verification code." });
  }
  await updateOne("donors", donor.id, { verificationCode: "", verificationCodeExpires: "" });
  const token = signToken({ id: donor.id, role: "donor", email: donor.email });
  res.json({ token, donor: privateDonor(donor) });
}));

app.get("/api/donor-auth/me", requireDonor, asyncRoute(async (req, res) => {
  const donor = await findOne("donors", { id: req.user.id });
  if (!donor) return res.status(404).json({ message: "Donor not found." });
  res.json(privateDonor(donor));
}));

app.patch("/api/donor-auth/availability", requireDonor, asyncRoute(async (req, res) => {
  const status = req.body.availabilityStatus === "Available" ? "Available" : "Temporarily unavailable";
  const donor = await updateOne("donors", req.user.id, {
    availabilityStatus: status,
    unavailableUntil: status === "Available" ? null : req.body.unavailableUntil || null
  });
  if (!donor) return res.status(404).json({ message: "Donor not found." });
  res.json({ message: `You are now marked as ${status}.`, donor: privateDonor(donor) });
}));

app.get("/api/dashboard", asyncRoute(async (req, res) => {
  const donors = await findAll("donors");
  const requests = await findAll("requests");
  const donationHistory = await findAll("donationHistory");
  const verifiedDonors = donors.filter((donor) => donor.verified);
  const verifiedRequests = requests.filter((request) => request.status === "Verified");
  const activeDonors = verifiedDonors.filter((d) => d.availabilityStatus === "Available").length;
  const emergencyRequests = verifiedRequests.filter((r) => ["Critical", "High"].includes(r.emergencyLevel)).length;
  const bloodStats = verifiedDonors.reduce((acc, donor) => {
    acc[donor.bloodGroup] = (acc[donor.bloodGroup] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalDonors: verifiedDonors.length,
    activeDonors,
    emergencyRequests,
    nearbyDonors: activeDonors,
    bloodStats,
    donationTrends: [
      { month: "Jan", donations: 18 },
      { month: "Feb", donations: 24 },
      { month: "Mar", donations: 31 },
      { month: "Apr", donations: 27 },
      { month: "May", donations: 36 }
    ],
    recentDonations: donationHistory,
    requestTracking: verifiedRequests
  });
}));

app.get("/api/donors", asyncRoute(async (req, res) => {
  const { bloodGroup, city, availability, eligibility: eligibleOnly, emergencyAvailable, includeUnverified } = req.query;
  let donors = await findAll("donors");
  if (includeUnverified !== "true") donors = donors.filter((donor) => donor.verified);
  donors = donors.map(publicDonor);
  if (bloodGroup) donors = donors.filter((d) => d.bloodGroup === bloodGroup);
  if (city) donors = donors.filter((d) => d.city.toLowerCase().includes(city.toLowerCase()));
  if (availability) donors = donors.filter((d) => d.availabilityStatus === availability);
  if (eligibleOnly === "true") donors = donors.filter((d) => d.eligibility.eligible);
  if (emergencyAvailable === "true") donors = donors.filter((d) => d.emergencyAvailable);
  res.json(donors);
}));

app.post("/api/donors", asyncRoute(async (req, res) => {
  const required = ["name", "age", "gender", "bloodGroup", "phone", "email", "city", "lastDonationDate", "weight", "password"];
  const missing = required.filter((field) => !req.body[field]);
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  const email = String(req.body.email).toLowerCase();
  const existingDonor = await findOne("donors", { email });
  if (existingDonor) return res.status(409).json({ message: "This email is already registered. Please login from the donor dashboard." });
  const donor = {
    ...req.body,
    id: `DNR-${Date.now()}`,
    email,
    password: undefined,
    passwordHash: hashPassword(req.body.password),
    age: Number(req.body.age),
    weight: Number(req.body.weight),
    availabilityStatus: req.body.availabilityStatus || "Available",
    emergencyAvailable: req.body.emergencyAvailable !== false,
    consentToShare: Boolean(req.body.consentToShare),
    verified: false,
    verificationStatus: "Pending",
    adminNote: "",
    donationsCount: 0,
    rewardBadge: "New Donor",
    createdAt: new Date().toISOString()
  };
  await insertOne("donors", donor);
  res.status(201).json({ message: "Donor registered successfully. Admin verification pending.", donor: publicDonor(donor) });
}));

app.patch("/api/donors/:id/availability", requireDonor, asyncRoute(async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ message: "You can update only your own donor availability." });
  const existing = await findOne("donors", { id: req.params.id });
  if (!existing) return res.status(404).json({ message: "Donor not found" });
  const donor = await updateOne("donors", req.params.id, {
    availabilityStatus: req.body.availabilityStatus || existing.availabilityStatus,
    unavailableUntil: req.body.unavailableUntil || null,
    latitude: Number(req.body.latitude || existing.latitude),
    longitude: Number(req.body.longitude || existing.longitude),
    city: req.body.city || existing.city,
    emergencyAvailable: req.body.emergencyAvailable ?? existing.emergencyAvailable
  });
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  res.json({ message: "Availability updated in real time", donor: publicDonor(donor) });
}));

app.post("/api/requests", asyncRoute(async (req, res) => {
  const score = verificationScore(req.body);
  const risk = spamRisk(score, req.body);
  const request = {
    ...req.body,
    id: `REQ-${Date.now()}`,
    status: risk === "High" ? "Flagged for Review" : "Pending Verification",
    verificationScore: score,
    spamRisk: risk,
    adminNote: "",
    consentUnlocked: false,
    assignedDonors: [],
    createdAt: new Date().toISOString()
  };
  await insertOne("requests", request, { front: true });
  res.status(201).json({ message: "Blood request submitted for verification", request });
}));

app.get("/api/requests", asyncRoute(async (req, res) => {
  const { includeUnverified } = req.query;
  const requests = await findAll("requests");
  const sortedRequests = requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (includeUnverified === "true") return res.json(sortedRequests);
  return res.json(sortedRequests.filter((request) => request.status === "Verified"));
}));

app.get("/api/recommendations", asyncRoute(async (req, res) => {
  const request = {
    bloodGroupNeeded: req.query.bloodGroupNeeded || "O+",
    emergencyLevel: req.query.emergencyLevel || "High",
    location: req.query.location || "Bengaluru",
    latitude: Number(req.query.latitude) || 12.9716,
    longitude: Number(req.query.longitude) || 77.5946
  };
  const donors = await findAll("donors");
  const recommendations = donors
    .filter((donor) => donor.verified && donor.availabilityStatus === "Available")
    .map((donor) => donorRecommendation(donor, request, { emergencyOverride: false }))
    .filter((donor) => donor.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
  res.json({ request, recommendations });
}));

app.get("/api/emergency-alerts", asyncRoute(async (req, res) => {
  const requests = await findAll("requests");
  const donors = await findAll("donors");
  const alerts = requests
    .filter((request) => request.status === "Verified" && ["Critical", "High"].includes(request.emergencyLevel))
    .map((request) => ({
      requestId: request.id,
      patientName: request.patientName,
      bloodGroupNeeded: request.bloodGroupNeeded,
      location: request.location,
      status: request.status,
      alertedDonors: donors.filter((d) => d.availabilityStatus === "Available" && d.emergencyAvailable).length
    }));
  res.json(alerts);
}));

app.patch("/api/requests/:id/verify", requireRole("admin"), asyncRoute(async (req, res) => {
  const request = await updateOne("requests", req.params.id, {
    status: req.body.approved ? "Verified" : "Verification Failed",
    adminNote: req.body.note || "",
    verifiedBy: req.user.email,
    verifiedAt: new Date().toISOString()
  });
  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json({ message: "Verification workflow updated", request });
}));

app.patch("/api/donors/:id/verify", requireRole("admin"), asyncRoute(async (req, res) => {
  const donor = await updateOne("donors", req.params.id, {
    verified: Boolean(req.body.approved),
    verificationStatus: req.body.approved ? "Verified" : "Verification Failed",
    adminNote: req.body.note || "",
    verifiedBy: req.user.email,
    verifiedAt: new Date().toISOString()
  });
  if (!donor) return res.status(404).json({ message: "Donor not found" });
  res.json({ message: "Donor verification updated", donor: publicDonor(donor) });
}));

app.post("/api/requests/:id/unlock-contact", asyncRoute(async (req, res) => {
  const request = await findOne("requests", { id: req.params.id });
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.status !== "Verified") return res.status(403).json({ message: "Contact sharing requires verified emergency request." });
  const donor = await findOne("donors", { id: req.body.donorId });
  if (!donor || !donor.consentToShare) return res.status(403).json({ message: "Donor contact is locked until donor consent is available." });
  const assignedDonors = request.assignedDonors || [];
  if (!assignedDonors.includes(donor.id)) assignedDonors.push(donor.id);
  await updateOne("requests", request.id, { consentUnlocked: true, assignedDonors });
  res.json({
    message: "Verified request. Donor contact unlocked securely.",
    contact: { name: donor.name, phone: donor.phone, email: donor.email, preferredArea: donor.preferredArea }
  });
}));

app.post("/api/chat", (req, res) => {
  const text = (req.body.message || "").toLowerCase();
  let reply = "I can help with donor eligibility, compatibility, emergency requests, verification, privacy, and dashboards.";
  if (text.includes("compat")) reply = "For a patient, compatible donors depend on the recipient group. O- is universal red-cell donor, AB+ can receive from all groups, and the recommendation API applies exact compatibility rules.";
  if (text.includes("eligible") || text.includes("donate")) reply = "Donors must usually be 18 to 60, at least 50 kg, medically fit, and must respect a minimum donation gap. The system calculates remaining waiting days automatically.";
  if (text.includes("fake") || text.includes("verify")) reply = "Requests are scored using hospital name, hospital contact, doctor or authority reference, emergency level, and suspicious text checks. Low-confidence requests stay locked for admin review.";
  if (text.includes("privacy") || text.includes("contact")) reply = "Phone and email stay hidden until the request is verified and the donor has consented to contact sharing.";
  res.json({ reply });
});

app.get("/api/admin/submissions", requireRole("admin"), asyncRoute(async (req, res) => {
  const donors = await findAll("donors");
  const requests = await findAll("requests");
  res.json({
    admin: req.user.email,
    donors: donors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    requests: requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
}));

app.get("/api/admin/analytics", requireRole("admin"), asyncRoute(async (req, res) => {
  const requests = await findAll("requests");
  const notifications = await findAll("notifications");
  res.json({
    collections: await countsByCollection(),
    fakeRequestPrevention: ["verification score", "spam risk labels", "admin approval", "locked contacts"],
    emergencyEscalations: requests.filter((r) => r.emergencyLevel === "Critical").length,
    notifications
  });
}));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Server error. Please try again." });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Smart Blood Donation API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });
