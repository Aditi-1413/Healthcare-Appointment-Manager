import { useState, useMemo, useEffect } from "react";


/* ---------------------------------------------------------------------- */
/*  API layer                                                              */
/* ---------------------------------------------------------------------- */

const API_BASE = "http://localhost:5000/api";

// Paths below match appointmentRoutes.js / authRoutes.js exactly (verbs,
// paths, and auth requirements). appointmentController.js itself wasn't
// shared, so the request bodies and response shapes are inferred from the
// route/controller names — adjust the field names in PatientView/DoctorView
// below if your controller expects something different.
const ENDPOINTS = {
  me: "/auth/me", // GET — validates the token, returns { user }
  myAppointments: "/appointments/my", // GET — patient's own appointments
  doctorAppointments: "/appointments/doctor", // GET — logged-in doctor's own appointments
  hold: "/appointments/hold", // POST { doctorId, startTime } — reserves a slot
  confirm: (id) => `/appointments/${id}/confirm`, // POST — confirms a held appointment
  cancel: (id) => `/appointments/${id}/cancel`, // POST — cancels an appointment
};

async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned a non-JSON response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

/* ---------------------------------------------------------------------- */
/*  Inline icons (no external icon package required)                       */
/* ---------------------------------------------------------------------- */

function Icon({ children, size = 18, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

const Activity = (props) => (
  <Icon {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>
);
const LayoutDashboard = (props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Icon>
);
const CalendarCheck = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 16l2 2 4-4" />
  </Icon>
);
const Stethoscope = (props) => (
  <Icon {...props}>
    <path d="M4.5 3v6a4.5 4.5 0 0 0 9 0V3" />
    <path d="M13.5 9v2a6 6 0 0 1-12 0V9" />
    <circle cx="19.5" cy="15" r="2.5" />
    <path d="M13.5 13v-1" />
    <path d="M17.3 15h-3.8" />
  </Icon>
);
const Users = (props) => (
  <Icon {...props}>
    <circle cx="9" cy="7" r="4" />
    <path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
    <path d="M16 3.5a4 4 0 0 1 0 7.6" />
    <path d="M22 21v-2a5 5 0 0 0-3.5-4.8" />
  </Icon>
);
const Settings = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
  </Icon>
);
const LogOut = (props) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);
const Search = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);
const Check = (props) => (
  <Icon {...props}><polyline points="20 6 9 17 4 12" /></Icon>
);
const ChevronRight = (props) => (
  <Icon {...props}><polyline points="9 18 15 12 9 6" /></Icon>
);
const Clock = (props) => (
  <Icon {...props}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></Icon>
);
const CalendarDays = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);
const AlertCircle = (props) => (
  <Icon {...props}><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12.5" /><line x1="12" y1="16" x2="12" y2="16" /></Icon>
);

/* ---------------------------------------------------------------------- */
/*  Formatting helpers (backend sends full ISO datetimes)                  */
/* ---------------------------------------------------------------------- */

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const STATUS_META = {
  HELD: { label: "Held", cls: "status-held" },
  CONFIRMED: { label: "Confirmed", cls: "status-confirmed" },
  COMPLETED: { label: "Completed", cls: "status-completed" },
  CANCELLED: { label: "Cancelled", cls: "status-cancelled" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || "Unknown", cls: "status-held" };
  return <span className={`status-badge ${meta.cls}`}>{meta.label}</span>;
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

/* ---------------------------------------------------------------------- */
/*  Auth screen (login / patient registration)                             */
/* ---------------------------------------------------------------------- */

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "", password: "", firstName: "", lastName: "", phone: "", dateOfBirth: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data =
        mode === "login"
          ? await apiFetch("/auth/login", {
              method: "POST",
              body: { email: form.email, password: form.password },
            })
          : await apiFetch("/auth/register", {
              method: "POST",
              body: {
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                dateOfBirth: form.dateOfBirth || null,
              },
            });
      onAuth(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-icon"><Activity size={19} /></div>
          <div className="brand-name" style={{ color: "var(--text)" }}>
            MedTime Plus<span style={{ color: "var(--muted)" }}>Appointment manager</span>
          </div>
        </div>

        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          {mode === "login" ? "Sign in to continue" : "Register as a patient"}
        </p>

        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={16} aria-hidden="true" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <div className="wizard-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="firstName">First name</label>
                  <input id="firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label htmlFor="lastName">Last name</label>
                  <input id="lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="wizard-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="dateOfBirth">Date of birth</label>
                  <input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>

          <button className="btn-primary book-btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? <Spinner /> : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="switch-mode">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Patient view                                                           */
/* ---------------------------------------------------------------------- */

function PatientView({ token, user }) {
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  const [specialty, setSpecialty] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsNote, setSlotsNote] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [apptsLoading, setApptsLoading] = useState(true);
  const [apptsError, setApptsError] = useState("");

  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [toast, setToast] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadDoctors(); loadAppointments(); }, []);

  async function loadDoctors() {
    setDoctorsLoading(true);
    setDoctorsError("");
    try {
      const data = await apiFetch("/doctors", { token });
      setDoctors(data.doctors || []);
    } catch (err) {
      setDoctorsError(err.message);
    } finally {
      setDoctorsLoading(false);
    }
  }

  async function loadAppointments() {
    setApptsLoading(true);
    setApptsError("");
    try {
      const data = await apiFetch(ENDPOINTS.myAppointments, { token });
      setAppointments(data.appointments || (Array.isArray(data) ? data : []));
    } catch (err) {
      setApptsError(err.message);
    } finally {
      setApptsLoading(false);
    }
  }

  const specialties = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.specialization).filter(Boolean))),
    [doctors]
  );
  const doctorOptions = doctors.filter((d) => d.specialization === specialty);

  useEffect(() => {
    if (!doctorId || !date) { setSlots([]); setSlotsNote(""); return; }
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      setSlotsNote("");
      setSelectedSlot(null);
      try {
        const data = await apiFetch(`/doctors/${doctorId}/slots?date=${date}`, { token });
        if (cancelled) return;
        setSlots(data.slots || []);
        if ((data.slots || []).length === 0 && data.message) setSlotsNote(data.message);
      } catch (err) {
        if (!cancelled) setSlotsNote(err.message);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [doctorId, date]);

  const canBook = specialty && doctorId && date && selectedSlot && !booking;

  const handleBook = async () => {
    if (!canBook) return;
    setBooking(true);
    setBookError("");
    try {
      // Step 1: reserve the slot (creates a HELD appointment).
      const holdData = await apiFetch(ENDPOINTS.hold, {
        method: "POST",
        token,
        body: { doctorId: Number(doctorId), startTime: selectedSlot.startTime },
      });
      const appointmentId = holdData.appointment?.id ?? holdData.id;
      if (!appointmentId) {
        throw new Error("Slot was held but no appointment id was returned — check the /appointments/hold response shape.");
      }

      // Step 2: confirm it right away.
      await apiFetch(ENDPOINTS.confirm(appointmentId), { method: "POST", token });

      setToast(`Appointment confirmed for ${formatDate(selectedSlot.startTime)} at ${formatTime(selectedSlot.startTime)}.`);
      setSpecialty(""); setDoctorId(""); setDate(""); setSlots([]); setSelectedSlot(null);
      await loadAppointments();
      window.setTimeout(() => setToast(""), 5000);
    } catch (err) {
      setBookError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await apiFetch(ENDPOINTS.cancel(id), { method: "POST", token });
      setConfirmingCancel(null);
      await loadAppointments();
    } catch (err) {
      setApptsError(err.message);
    }
  };

  const upcoming = appointments.filter((a) => a.status !== "CANCELLED");

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Welcome back, {user.firstName}</h1>
          <p>You have {upcoming.length} upcoming appointment{upcoming.length === 1 ? "" : "s"}.</p>
        </div>
      </header>

      <section className="card booking-card" aria-labelledby="booking-heading">
        <div className="card-head">
          <CalendarCheck size={20} aria-hidden="true" />
          <h2 id="booking-heading">Book an appointment</h2>
        </div>

        {doctorsError && (
          <div className="error-banner" role="alert"><AlertCircle size={16} aria-hidden="true" /> Couldn't load doctors: {doctorsError}</div>
        )}
        {bookError && (
          <div className="error-banner" role="alert"><AlertCircle size={16} aria-hidden="true" /> {bookError}</div>
        )}
        {toast && (
          <div className="success-banner" role="status"><Check size={16} aria-hidden="true" /> {toast}</div>
        )}

        {doctorsLoading ? (
          <p className="muted"><Spinner /> Loading doctors…</p>
        ) : (
          <>
            <div className="wizard-row">
              <div className="field">
                <label htmlFor="specialty">Department / specialty</label>
                <select
                  id="specialty"
                  value={specialty}
                  onChange={(e) => { setSpecialty(e.target.value); setDoctorId(""); setDate(""); setSlots([]); }}
                >
                  <option value="">Select a specialty</option>
                  {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="field">
                <label htmlFor="doctor">Available doctor</label>
                <select
                  id="doctor"
                  value={doctorId}
                  onChange={(e) => { setDoctorId(e.target.value); setDate(""); setSlots([]); }}
                  disabled={!specialty}
                >
                  <option value="">{specialty ? "Select a doctor" : "Choose a specialty first"}</option>
                  {doctorOptions.map((d) => (
                    <option key={d.id} value={d.id}>Dr. {d.user.firstName} {d.user.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="date">Date</label>
                <input
                  id="date" type="date" min={today} value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!doctorId}
                />
              </div>
            </div>

            {doctorId && date && (
              <div className="slot-picker">
                <span className="slot-picker-label"><Clock size={15} aria-hidden="true" /> Choose a time slot</span>

                {slotsLoading ? (
                  <p className="muted"><Spinner /> Loading availability…</p>
                ) : slots.length === 0 ? (
                  <p className="muted">{slotsNote || "No slots available for this date."}</p>
                ) : (
                  <div className="slot-grid" role="group" aria-label="Available time slots">
                    {slots.map((slot) => {
                      const selected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          type="button"
                          key={slot.startTime}
                          className={`slot ${selected ? "slot-selected" : ""} ${!slot.available ? "slot-booked" : ""}`}
                          disabled={!slot.available}
                          aria-pressed={selected}
                          aria-label={`${formatTime(slot.startTime)}${!slot.available ? ", unavailable" : ""}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button type="button" className="btn-primary book-btn" disabled={!canBook} onClick={handleBook}>
              {booking ? <Spinner /> : <>Confirm appointment <ChevronRight size={16} aria-hidden="true" /></>}
            </button>
          </>
        )}
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className="section-head"><h2 id="upcoming-heading">Upcoming appointments</h2></div>

        {apptsError && (
          <div className="error-banner" role="alert"><AlertCircle size={16} aria-hidden="true" /> Couldn't load appointments: {apptsError}</div>
        )}

        {apptsLoading ? (
          <p className="muted"><Spinner /> Loading appointments…</p>
        ) : upcoming.length === 0 ? (
          <div className="empty-state">No appointments booked yet. Use the form above to schedule one.</div>
        ) : (
          <div className="appt-grid">
            {upcoming.map((a) => (
              <article className="appt-card" key={a.id}>
                <div className="appt-card-top">
                  <div className="doc-avatar" aria-hidden="true"><Stethoscope size={18} /></div>
                  <div>
                    <h3>Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}</h3>
                    <p className="muted">{a.doctor?.specialization}</p>
                  </div>
                  <div style={{ marginLeft: "auto" }}><StatusBadge status={a.status} /></div>
                </div>
                <div className="appt-meta">
                  <span><CalendarDays size={14} aria-hidden="true" /> {formatDate(a.startTime)}</span>
                  <span><Clock size={14} aria-hidden="true" /> {formatTime(a.startTime)}</span>
                </div>

                {confirmingCancel === a.id ? (
                  <div className="appt-actions confirm-row">
                    <span>Cancel this appointment?</span>
                    <button className="btn-danger-solid" onClick={() => handleCancel(a.id)}>Yes, cancel</button>
                    <button className="btn-ghost" onClick={() => setConfirmingCancel(null)}>Keep it</button>
                  </div>
                ) : (
                  <div className="appt-actions">
                    <button className="btn-secondary" title="Reschedule isn't wired to an endpoint yet">Reschedule</button>
                    <button className="btn-danger" onClick={() => setConfirmingCancel(a.id)}>Cancel</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  Doctor / provider view                                                 */
/* ---------------------------------------------------------------------- */

function DoctorView({ token, user }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorsCount, setDoctorsCount] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => { loadSchedule(); loadDoctorsCount(); /* eslint-disable-next-line */ }, [date]);

  async function loadSchedule() {
    setLoading(true);
    setError("");
    try {
      // /appointments/doctor identifies the doctor from the auth token, so
      // there's no doctorId param, and the route doesn't take a date filter —
      // fetch everything for this doctor and narrow to the selected day here.
      const data = await apiFetch(ENDPOINTS.doctorAppointments, { token });
      const all = Array.isArray(data) ? data : data.appointments || [];
      const forDay = all.filter((r) => r.startTime && r.startTime.slice(0, 10) === date);
      setRows(forDay);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDoctorsCount() {
    try {
      const data = await apiFetch("/doctors", { token });
      setDoctorsCount((data.doctors || []).length);
    } catch {
      // non-critical for the stats banner
    }
  }

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "HELD").length;
    return { total, pending };
  }, [rows]);

  const filteredRows = rows.filter((r) => {
    const patientName = `${r.patient?.user?.firstName || ""} ${r.patient?.user?.lastName || ""}`.toLowerCase();
    const matchesQuery = patientName.includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Today&rsquo;s schedule overview</h1>
          <p>Dr. {user.firstName} {user.lastName}</p>
        </div>
        <div className="field" style={{ marginLeft: "auto", minWidth: 170 }}>
          <label htmlFor="scheduleDate">Date</label>
          <input id="scheduleDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} aria-hidden="true" />
          Couldn't load the schedule ({error}). appointmentController.js wasn't shared, so the response
          shape is inferred — check the field names in <code>DoctorView</code>'s <code>loadSchedule</code> in App.jsx.
        </div>
      )}

      <section className="stats-row" aria-label="Daily summary">
        <div className="stat-card">
          <span className="stat-label">Total appointments today</span>
          <span className="stat-value">{loading ? "—" : stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Available doctors</span>
          <span className="stat-value">{doctorsCount ?? "—"}</span>
        </div>
        <div className="stat-card stat-card-warn">
          <span className="stat-label">Pending requests</span>
          <span className="stat-value">{loading ? "—" : stats.pending}</span>
        </div>
      </section>

      <section className="card table-card" aria-labelledby="schedule-heading">
        <div className="card-head table-card-head">
          <h2 id="schedule-heading">Patient schedule</h2>
          <div className="table-controls">
            <div className="search-box">
              <Search size={15} aria-hidden="true" />
              <input
                type="search" aria-label="Search by patient name" placeholder="Search patient"
                value={query} onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option value="HELD">Held</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <caption className="sr-only">Today&rsquo;s patient appointment schedule</caption>
            <thead>
              <tr>
                <th scope="col">Patient name</th>
                <th scope="col">Appointment time</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="empty-row"><Spinner /> Loading schedule…</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={3} className="empty-row">No matching appointments.</td></tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Patient">{r.patient?.user?.firstName} {r.patient?.user?.lastName}</td>
                    <td data-label="Time">{formatTime(r.startTime)}</td>
                    <td data-label="Status"><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*  Shell                                                                   */
/* ---------------------------------------------------------------------- */

const NAV_ITEMS = {
  PATIENT: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: CalendarCheck },
    { id: "doctors", label: "Find a doctor", icon: Stethoscope },
  ],
  DOCTOR: [
    { id: "dashboard", label: "Schedule overview", icon: LayoutDashboard },
    { id: "patients", label: "Patients", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ],
};

function readStoredUser() {
  try {
    const raw = localStorage.getItem("medtime_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("medtime_token") || "");
  const [user, setUser] = useState(readStoredUser);

  const handleAuth = (newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("medtime_token", newToken);
    localStorage.setItem("medtime_user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("medtime_token");
    localStorage.removeItem("medtime_user");
  };

  const sharedStyles = <GlobalStyles />;

  if (!token || !user) {
    return (
      <div className="mt-shell mt-shell-auth">
        {sharedStyles}
        <AuthScreen onAuth={handleAuth} />
      </div>
    );
  }

  const role = user.role === "DOCTOR" ? "DOCTOR" : "PATIENT";
  const initials = `${(user.firstName || "?")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase();

  return (
    <div className="mt-shell">
      {sharedStyles}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Activity size={19} /></div>
          <div className="brand-name">MedTime Plus<span>Appointment manager</span></div>
        </div>

        <ul className="nav-list">
          {NAV_ITEMS[role].map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <li key={item.id}>
                <button className={i === 0 ? "active" : ""}>
                  <ItemIcon size={17} aria-hidden="true" /> {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-foot">
          <button type="button" onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Sign out</button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <span className="topbar-title">{role === "PATIENT" ? "Patient portal" : "Doctor portal"}</span>
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">{initials}</span>
            {user.firstName} {user.lastName}
          </div>
        </header>

        <main className="content">
          {role === "PATIENT" ? <PatientView token={token} user={user} /> : <DoctorView token={token} user={user} />}
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Styles                                                                  */
/* ---------------------------------------------------------------------- */

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

      .mt-shell, .mt-shell * { box-sizing: border-box; }
      .mt-shell {
        --blue: #0056b3; --blue-dark: #003d82; --blue-tint: #e8f1fb;
        --teal: #00a896; --teal-tint: #e3f7f4;
        --bg: #f8f9fa; --surface: #ffffff; --text: #1c2430; --muted: #64748b; --border: #e3e7ed;
        --success: #157347; --success-bg: #e3f5e9;
        --pending: #a15c00; --pending-bg: #fdf1dc;
        --completed: #0056b3; --completed-bg: #e8f1fb;
        --cancelled: #6b7280; --cancelled-bg: #f1f2f4;
        --danger: #b3261e; --radius: 12px;
        font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
        color: var(--text); background: var(--bg); min-height: 100vh; display: flex;
      }
      .mt-shell :focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

      .spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(0,0,0,0.15); border-top-color: currentColor; border-radius: 50%; animation: mt-spin 0.7s linear infinite; vertical-align: -2px; margin-right: 4px; }
      @keyframes mt-spin { to { transform: rotate(360deg); } }

      /* ---- Auth screen ---- */
      .mt-shell-auth { display: flex; align-items: center; justify-content: center; padding: 30px; }
      .auth-shell { width: 100%; display: flex; align-items: center; justify-content: center; }
      .auth-card { width: 100%; max-width: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 34px 32px; box-shadow: 0 20px 50px rgba(20,40,80,0.08); }
      .auth-brand { border: none; padding: 0; margin-bottom: 22px; }
      .auth-card h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px; }
      .error-banner { display: flex; align-items: flex-start; gap: 8px; background: #fdecec; color: var(--danger); padding: 10px 14px; border-radius: 9px; font-size: 13.5px; font-weight: 600; margin-bottom: 16px; line-height: 1.5; }
      .error-banner code { background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px; font-weight: 600; }
      .switch-mode { margin-top: 20px; text-align: center; color: var(--muted); font-size: 14px; }
      .switch-mode button { border: none; background: none; color: var(--blue); font-weight: 700; cursor: pointer; margin-left: 5px; }

      /* ---- Sidebar ---- */
      .sidebar { width: 240px; flex-shrink: 0; background: var(--blue-dark); color: #eaf1fb; display: flex; flex-direction: column; padding: 24px 16px; }
      .brand { display: flex; align-items: center; gap: 10px; padding: 0 8px 22px; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.14); }
      .brand-icon { width: 34px; height: 34px; border-radius: 9px; background: var(--teal); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
      .brand-name { font-weight: 800; font-size: 16.5px; letter-spacing: -0.2px; line-height: 1.15; }
      .brand-name span { display: block; font-size: 10.5px; font-weight: 500; color: #9fc4ef; letter-spacing: 0.4px; text-transform: uppercase; }

      .nav-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
      .nav-list button { width: 100%; display: flex; align-items: center; gap: 11px; background: transparent; border: none; color: #cfe1f7; font: inherit; font-size: 14px; font-weight: 500; padding: 10px 12px; border-radius: 9px; cursor: pointer; text-align: left; transition: background 0.15s, color 0.15s; }
      .nav-list button:hover { background: rgba(255,255,255,0.08); }
      .nav-list button.active { background: var(--teal); color: white; font-weight: 600; }

      .sidebar-foot { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.14); }
      .sidebar-foot button { display: flex; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; color: #b9d2ef; font: inherit; font-size: 13.5px; padding: 9px 12px; border-radius: 9px; cursor: pointer; }
      .sidebar-foot button:hover { background: rgba(255,255,255,0.08); color: white; }

      /* ---- Main ---- */
      .main-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; background: var(--surface); border-bottom: 1px solid var(--border); }
      .topbar-title { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .user-chip { display: flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 600; }
      .user-chip .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--blue-tint); color: var(--blue); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }

      .content { padding: 30px 32px 48px; max-width: 1100px; width: 100%; margin: 0 auto; }

      .page-head { margin-bottom: 22px; display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
      .page-head h1 { margin: 0 0 4px; font-size: 25px; font-weight: 800; letter-spacing: -0.3px; }
      .page-head p { margin: 0; color: var(--muted); font-size: 14.5px; }

      .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 28px; }
      .card-head { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; color: var(--blue); }
      .card-head h2 { margin: 0; font-size: 17px; font-weight: 700; color: var(--text); }
      .section-head { margin-bottom: 14px; }
      .section-head h2 { margin: 0; font-size: 17px; font-weight: 700; }

      .success-banner { display: flex; align-items: center; gap: 8px; background: var(--success-bg); color: var(--success); padding: 10px 14px; border-radius: 9px; font-size: 13.5px; font-weight: 600; margin-bottom: 16px; }

      .wizard-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 4px; }
      .field label { display: block; font-size: 12.5px; font-weight: 700; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
      .field select, .field input { width: 100%; padding: 10px 12px; font: inherit; font-size: 14px; border: 1.5px solid var(--border); border-radius: 9px; background: var(--surface); color: var(--text); transition: border-color 0.15s, box-shadow 0.15s; }
      .field select:disabled, .field input:disabled { background: #f3f4f6; color: #9aa3af; cursor: not-allowed; }
      .field select:focus, .field input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,86,179,0.12); outline: none; }

      .slot-picker { margin-top: 20px; }
      .slot-picker-label { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 10px; }
      .slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
      .slot { padding: 9px 6px; font: inherit; font-size: 13px; font-weight: 600; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); cursor: pointer; transition: 0.15s; }
      .slot:hover:not(:disabled) { border-color: var(--teal); background: var(--teal-tint); }
      .slot-selected { background: var(--teal); border-color: var(--teal); color: white; }
      .slot-booked { background: #f3f4f6; color: #adb5bd; text-decoration: line-through; cursor: not-allowed; border-color: var(--border); }

      .btn-primary, .book-btn { display: inline-flex; align-items: center; gap: 6px; justify-content: center; background: var(--blue); color: white; border: none; font: inherit; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 9px; cursor: pointer; margin-top: 20px; transition: background 0.15s; }
      .btn-primary:hover:not(:disabled) { background: var(--blue-dark); }
      .btn-primary:disabled { background: #a9c3e0; cursor: not-allowed; }

      .appt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
      .appt-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; }
      .appt-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
      .doc-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--blue-tint); color: var(--blue); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .appt-card h3 { margin: 0; font-size: 15px; font-weight: 700; }
      .muted { color: var(--muted); margin: 2px 0 0; font-size: 13px; }
      .appt-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text); margin-bottom: 16px; }
      .appt-meta span { display: flex; align-items: center; gap: 5px; }
      .appt-actions { display: flex; gap: 8px; }
      .btn-secondary, .btn-danger, .btn-ghost, .btn-danger-solid { font: inherit; font-size: 12.5px; font-weight: 700; border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: 0.15s; }
      .btn-secondary { background: var(--blue-tint); color: var(--blue); border: 1px solid transparent; flex: 1; }
      .btn-secondary:hover { background: #d7e6f8; }
      .btn-danger { background: transparent; color: var(--danger); border: 1.5px solid #f0d4d2; flex: 1; }
      .btn-danger:hover { background: #fdf1f0; }
      .confirm-row { align-items: center; flex-wrap: wrap; font-size: 12.5px; color: var(--text); }
      .confirm-row span { margin-right: 4px; font-weight: 600; }
      .btn-danger-solid { background: var(--danger); color: white; border: none; }
      .btn-ghost { background: transparent; color: var(--muted); border: 1.5px solid var(--border); }

      .empty-state { padding: 30px; text-align: center; color: var(--muted); background: var(--surface); border: 1.5px dashed var(--border); border-radius: var(--radius); font-size: 14px; }

      .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
      .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 6px; }
      .stat-label { font-size: 12.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.3px; }
      .stat-value { font-size: 32px; font-weight: 800; color: var(--blue); letter-spacing: -0.5px; }
      .stat-card-warn .stat-value { color: var(--pending); }

      .table-card { padding: 0; overflow: hidden; }
      .table-card-head { padding: 22px 24px 16px; margin-bottom: 0; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
      .table-controls { display: flex; gap: 10px; margin-left: auto; }
      .search-box { display: flex; align-items: center; gap: 7px; border: 1.5px solid var(--border); border-radius: 8px; padding: 7px 10px; background: var(--bg); }
      .search-box input { border: none; background: transparent; font: inherit; font-size: 13px; outline: none; width: 190px; }
      .table-controls select { border: 1.5px solid var(--border); border-radius: 8px; padding: 7px 10px; font: inherit; font-size: 13px; background: var(--surface); }
      .table-scroll { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      thead th { text-align: left; font-size: 11.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; padding: 12px 24px; border-bottom: 1.5px solid var(--border); background: var(--bg); }
      tbody td { padding: 14px 24px; border-bottom: 1px solid var(--border); }
      tbody tr:last-child td { border-bottom: none; }
      tbody tr:hover { background: #fafbfd; }
      .empty-row { text-align: center; color: var(--muted); padding: 26px; }

      .status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
      .status-confirmed { background: var(--success-bg); color: var(--success); }
      .status-held { background: var(--pending-bg); color: var(--pending); }
      .status-completed { background: var(--completed-bg); color: var(--completed); }
      .status-cancelled { background: var(--cancelled-bg); color: var(--cancelled); }

      @media (max-width: 960px) {
        .wizard-row { grid-template-columns: 1fr 1fr; }
        .stats-row { grid-template-columns: 1fr; }
      }
      @media (max-width: 760px) {
        .mt-shell { flex-direction: column; }
        .sidebar { width: 100%; flex-direction: row; align-items: center; padding: 12px 16px; gap: 14px; overflow-x: auto; }
        .brand { border: none; padding: 0; margin: 0; }
        .brand-name span { display: none; }
        .nav-list { flex-direction: row; }
        .sidebar-foot { display: none; }
        .content { padding: 22px 16px 40px; }
        .wizard-row { grid-template-columns: 1fr; }
        .table-card-head { flex-direction: column; align-items: stretch; }
        .table-controls { margin-left: 0; }
        .search-box input { width: 100%; }
      }
    `}</style>
  );
}