"use strict";
/* EduTrack AI - DATA SANA MEMORIAL SCHOOL
   UI layer. Talks only to a "store" (data-demo.js or data-firebase.js). */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, "0");
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => isoDate(new Date());
const addDays = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); return isoDate(new Date(y, m - 1, d + n)); };
const safe = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const copy = {
  en: { dashboard: "Dashboard", registration: "Student registration", attendance: "Daily attendance", students: "Students", classes: "Classes & teachers", reports: "Reports", assistant: "AI assistant", announcements: "Announcements", status: "Application status", myAttendance: "My attendance",
    welcome: "Your school's attendance and information at a glance.", totalStudents: "Total students", presentToday: "Present today", pendingApps: "Pending applications", classesCount: "Homeroom classes",
    name: "Student name", grade: "Grade", section: "Section", guardian: "Parent/guardian name", phone: "Guardian phone", submit: "Submit application", pending: "Pending", approved: "Approved", rejected: "Rejected", approve: "Approve", reject: "Reject",
    search: "Search students...", studentList: "Student directory", class: "Class", teacher: "Homeroom teacher", date: "School date", save: "Save attendance", present: "Present", absent: "Absent", late: "Late", excused: "Excused", statusCol: "Status",
    ask: "Ask a school question...", send: "Send", assistantIntro: "Hello! I can answer general questions about registration, attendance and school procedures. Try asking in English or Amharic.", post: "Publish announcement", title: "Announcement title", message: "Announcement message", empty: "Nothing to show yet.",
    signIn: "Sign in", signUp: "New student application", email: "Email", password: "Password", forgot: "Forgot password?", logout: "Sign out", loading: "Loading…", markAll: "Mark all present", records: "Attendance records", rate: "Attendance rate", daily: "Daily attendance",
    liveMode: "● Live", demoMode: "● Demo mode", createClass: "Create a classroom", createTeacher: "Create teacher account", assign: "Assign", notice: "Demo information only. Do not enter real student data.",
    pendingMsg: "Your application is waiting for approval by the school administrator. You will get access as soon as it is approved.", rejectedMsg: "Your application was not approved. Please contact the school office.",
    exportCsv: "Export CSV", last: "Period", days: "days", allClasses: "All classes", pendingOnly: "Student applications",
    readAloud: "Read answers aloud", clear: "Clear chat", listening: "Listening… speak now", voiceUnsupported: "Voice input is not supported in this browser. Use Chrome, Edge or Safari, or type your question.", tapMic: "Tap the microphone and speak, or type below.", directorIntro: "Hello Director! Ask me about students, attendance and absences, or give me a calculation. Tap the microphone to speak.", todayByClass: "Today by class", trend7: "Attendance rate, last 7 days", absentToday: "Absent today", askAssistant: "Ask the assistant", refreshData: "Refresh data" },
  am: { dashboard: "ዳሽቦርድ", registration: "የተማሪ ምዝገባ", attendance: "ዕለታዊ መገኘት", students: "ተማሪዎች", classes: "ክፍሎችና መምህራን", reports: "ሪፖርቶች", assistant: "AI ረዳት", announcements: "ማስታወቂያዎች", status: "የማመልከቻ ሁኔታ", myAttendance: "የእኔ መገኘት",
    welcome: "የትምህርት ቤቱን መረጃና የመገኘት ሁኔታ ይመልከቱ።", totalStudents: "ጠቅላላ ተማሪዎች", presentToday: "ዛሬ የተገኙ", pendingApps: "በመጠባበቅ ላይ ያሉ ምዝገባዎች", classesCount: "የክፍል አስተዳደር",
    name: "የተማሪ ስም", grade: "ክፍል", section: "ሴክሽን", guardian: "የወላጅ/አሳዳጊ ስም", phone: "የወላጅ ስልክ", submit: "ማመልከቻ ላክ", pending: "በመጠባበቅ ላይ", approved: "ተፈቅዷል", rejected: "ውድቅ ተደርጓል", approve: "ፍቀድ", reject: "ውድቅ አድርግ",
    search: "ተማሪ ፈልግ...", studentList: "የተማሪ ዝርዝር", class: "ክፍል", teacher: "የክፍል መምህር", date: "ቀን", save: "መገኘትን አስቀምጥ", present: "ተገኝቷል", absent: "አልተገኘም", late: "ዘግይቷል", excused: "በምክንያት ቀርቷል", statusCol: "ሁኔታ",
    ask: "የትምህርት ቤት ጥያቄ ይጠይቁ...", send: "ላክ", assistantIntro: "ሰላም! ስለ ምዝገባ፣ መገኘትና የትምህርት ቤት ሂደቶች አጠቃላይ ጥያቄዎችን መልሳለሁ።", post: "ማስታወቂያ አትም", title: "የማስታወቂያ ርዕስ", message: "የማስታወቂያ መልዕክት", empty: "ምንም መረጃ የለም።",
    signIn: "ግባ", signUp: "አዲስ የተማሪ ማመልከቻ", email: "ኢሜይል", password: "የይለፍ ቃል", forgot: "የይለፍ ቃል ረስተዋል?", logout: "ውጣ", loading: "በመጫን ላይ…", markAll: "ሁሉንም ተገኝቷል አድርግ", records: "የመገኘት መዝገቦች", rate: "የመገኘት መጠን", daily: "ዕለታዊ መገኘት",
    liveMode: "● ቀጥታ", demoMode: "● የሙከራ ሁኔታ", createClass: "ክፍል ፍጠር", createTeacher: "የመምህር አካውንት ፍጠር", assign: "መድብ", notice: "የሙከራ መረጃ ብቻ ነው። እውነተኛ የተማሪ መረጃ አያስገቡ።",
    pendingMsg: "ማመልከቻዎ በትምህርት ቤቱ አስተዳዳሪ እስኪፈቀድ በመጠባበቅ ላይ ነው። እንደተፈቀደ መግባት ይችላሉ።", rejectedMsg: "ማመልከቻዎ አልተፈቀደም። እባክዎ የትምህርት ቤቱን ቢሮ ያነጋግሩ።",
    exportCsv: "CSV ላክ", last: "ጊዜ", days: "ቀናት", allClasses: "ሁሉም ክፍሎች", pendingOnly: "የተማሪ ማመልከቻዎች",
    readAloud: "መልሶችን ጮኽ ብሎ አንብብ", clear: "ውይይቱን አጽዳ", listening: "እየሰማሁ ነው… ይናገሩ", voiceUnsupported: "በዚህ አሳሽ የድምፅ ግብዓት አይደገፍም። Chrome፣ Edge ወይም Safari ይጠቀሙ፣ ወይም ጥያቄዎን ይጻፉ።", tapMic: "ማይክሮፎኑን ነክተው ይናገሩ፣ ወይም ከታች ይጻፉ።", directorIntro: "ሰላም ዳይሬክተር! ስለ ተማሪዎች፣ መገኘትና መቅረት ይጠይቁኝ፣ ወይም ስሌት ይስጡኝ። ለመናገር ማይክሮፎኑን ይንኩ።", todayByClass: "ዛሬ በክፍል", trend7: "የመገኘት መጠን፣ ያለፉት 7 ቀናት", absentToday: "ዛሬ ያልተገኙ", askAssistant: "ረዳቱን ይጠይቁ", refreshData: "መረጃ አድስ" }
};
let lang = "en";
const t = k => copy[lang][k] || copy.en[k] || k;

const NAV = {
  admin: ["dashboard", "registration", "students", "classes", "reports", "assistant", "announcements"],
  teacher: ["dashboard", "attendance", "students", "reports", "assistant", "announcements"],
  student: ["dashboard", "reports", "assistant", "announcements"],
  pending: ["status"],
  unknown: []
};
let store = null, me = null, page = "dashboard", renderToken = 0;
const view = { chat: [], speak: false, attClass: null, attDate: todayStr(), repClass: "all", repDays: 30, loginTab: "in", repRows: [], pendingCount: 0 };

const navRole = () => !me ? "unknown" : me.role === "student" && me.status !== "active" ? "pending" : (NAV[me.role] ? me.role : "unknown");
const defaultPage = () => NAV[navRole()][0] || "dashboard";
const allowed = p => NAV[navRole()].includes(p);

const toast = msg => { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 3200); };
const friendly = e => {
  const c = (e && e.code) || "";
  const m = {
    "auth/invalid-credential": "Incorrect email or password.", "auth/wrong-password": "Incorrect email or password.", "auth/user-not-found": "Incorrect email or password.",
    "auth/invalid-email": "Enter a valid email address.", "auth/email-already-in-use": "That email already has an account. Sign in instead.",
    "auth/weak-password": "Choose a stronger password (at least 8 characters).", "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "Network problem. Check your internet connection.", "permission-denied": "You do not have permission to do that.",
    "unavailable": "The service is temporarily unavailable. Please try again.", "failed-precondition": "A required database index is missing. Deploy firestore.indexes.json (see README)."
  };
  return m[c] || (e && e.message) || "Something went wrong.";
};
const busy = async (btn, fn) => {
  invalidate();
  if (btn) btn.disabled = true;
  try { return await fn(); } catch (e) { console.error(e); toast(friendly(e)); } finally { if (btn) btn.disabled = false; }
};
const classLabel = (classes, id) => (classes.find(c => c.id === id) || {}).name || "—";
const myClasses = async () => { const all = await store.listClasses(); return me.role === "admin" ? all : all.filter(c => (me.classIds || []).includes(c.id)); };
let snapCache = null;
async function loadSnapshot(force) {
  if (!force && snapCache && Date.now() - snapCache.at < 15000) return snapCache.data;
  const [students, classes, teachers, reqs] = await Promise.all([store.listStudents({}), store.listClasses(), store.listTeachers(), store.listRequests()]);
  const from = addDays(todayStr(), -29);
  const att = (await Promise.all(classes.map(c => store.listAttendance({ classId: c.id, from })))).flat();
  const data = { students, classes, teachers, reqs, att, today: todayStr() };
  snapCache = { at: Date.now(), data };
  return data;
}
const invalidate = () => { snapCache = null; };
const stat = (label, num, foot, icon) => `<div class="card"><div class="stat-top">${safe(label)} <span class="stat-icon">${icon}</span></div><div class="stat-num">${safe(num)}</div><div class="stat-foot">${safe(foot)}</div></div>`;
const badgeFor = s => `<span class="badge ${s === "present" || s === "approved" ? "green" : s === "absent" || s === "rejected" ? "red" : "amber"}">${safe(t(s))}</span>`;
const loadingCard = () => `<div class="card"><p class="muted">${t("loading")}</p></div>`;

/* ---------------- chrome ---------------- */
function updateChrome() {
  $("#today").textContent = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { weekday: "short", year: "numeric", month: "short", day: "numeric" }).format(new Date());
  $("#year").textContent = new Date().getFullYear();
  $("#modeBadge").textContent = store.mode === "live" ? t("liveMode") : t("demoMode");
  $("#privacyNote").textContent = store.mode === "live" ? "Signed-in access. Records are stored in the school's Firebase project." : "Demo data is stored only in this browser. This is not a live school database.";
  $("#logoutBtn").textContent = t("logout");
  $("#logoutBtn").hidden = !me;
  const roleName = !me ? "" : me.role === "admin" ? "Director" : me.role === "teacher" ? "Teacher" : me.role === "student" ? "Student" : "";
  $("#sessionRole").textContent = me ? `${roleName ? roleName + " · " : ""}${me.name || ""}` : "";
  const labels = { dashboard: t("dashboard"), status: t("status"), registration: t("registration"), attendance: t("attendance"), students: t("students"), classes: t("classes"), reports: me && me.role === "student" ? t("myAttendance") : t("reports"), assistant: t("assistant"), announcements: t("announcements") };
  $$("#nav .nav-item").forEach(b => {
    const p = b.dataset.page;
    b.style.display = me && allowed(p) ? "flex" : "none";
    b.classList.toggle("active", p === page);
    $(".nav-text", b).textContent = labels[p];
  });
  $("#pendingBadge").hidden = !(me && me.role === "admin");
  $("#pendingBadge").textContent = view.pendingCount;
  document.documentElement.lang = lang;
  return labels;
}

async function render() {
  stopVoice(); if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (!me) { updateChrome(); showLogin(); return; }
  if (!allowed(page)) page = defaultPage();
  const token = ++renderToken;
  const labels = updateChrome();
  $("#pageTitle").textContent = labels[page] || t("dashboard");
  $("#pageSubtitle").textContent = page === "dashboard" ? t("welcome") : "";
  if (navRole() === "unknown") { $("#pageContent").innerHTML = unknownProfile(); return; }
  $("#pageContent").innerHTML = loadingCard();
  let html;
  try { html = await pages[page](); } catch (e) { console.error(e); html = `<div class="card"><h2>Could not load this page</h2><p class="notice">${safe(friendly(e))}</p></div>`; }
  if (token !== renderToken) return;
  $("#pageContent").innerHTML = html;
  $("#pendingBadge").textContent = view.pendingCount;
}
const setPage = p => { page = p; render(); };

function unknownProfile() {
  return `<div class="card"><h2>No school profile found</h2><p class="notice">You are signed in as ${safe(me.email || "")}, but this account has no school profile (or it could not be loaded). Ask the school administrator to set up your account, then sign out and sign in again.</p></div>`;
}

/* ---------------- login ---------------- */
function showLogin() {
  const live = store.mode === "live", tab = view.loginTab;
  $("#pageTitle").textContent = live ? "Sign in" : "Secure demo access";
  $("#pageSubtitle").textContent = "";
  const tabs = `<div class="tabs"><button type="button" class="tab ${tab === "in" ? "active" : ""}" data-tab="in">${t("signIn")}</button><button type="button" class="tab ${tab === "up" ? "active" : ""}" data-tab="up">${t("signUp")}</button></div>`;
  let body;
  if (tab === "up") {
    body = `<form id="signupForm"><div class="field"><label>${t("name")} *</label><input name="name" required minlength="2" maxlength="80" autocomplete="name"></div>
      ${live ? `<div class="field"><label>${t("email")} *</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>${t("password")} * (8+)</label><input name="password" type="password" required minlength="8" autocomplete="new-password"></div>` : ""}
      <div class="form-grid"><div class="field"><label>${t("grade")}</label><select name="grade"><option>9</option><option>10</option><option>11</option><option>12</option></select></div><div class="field"><label>${t("section")}</label><input name="section" value="A" required maxlength="4"></div></div>
      <div class="field"><label>${t("guardian")}</label><input name="guardian" maxlength="80"></div><div class="field"><label>${t("phone")}</label><input name="phone" type="tel" maxlength="30"></div>
      <button class="btn primary" type="submit">${t("submit")}</button><p class="small muted">An administrator must approve your application before you can use the system.</p></form>`;
  } else if (live) {
    body = `<form id="loginForm"><div class="field"><label>${t("email")}</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>${t("password")}</label><input name="password" type="password" required autocomplete="current-password"></div>
      <button class="btn primary" type="submit">${t("signIn")}</button><p class="small"><a href="#" id="forgotLink">${t("forgot")}</a></p><p class="small muted">Teachers: your account is created by the school administrator.</p></form>`;
  } else {
    body = `<form id="loginForm"><div class="field"><label>Portal</label><select name="role" required><option value="admin">Director (Administrator)</option><option value="teacher">Teacher / Homeroom</option><option value="student">Student</option></select></div><div class="field"><label>Access code</label><input name="code" required autocomplete="off" placeholder="Enter your portal code"></div>
      <button class="btn primary" type="submit">${t("signIn")}</button><p class="small muted">Demo codes are listed in the README. They are demonstration codes, not real authentication.</p></form>`;
  }
  $("#pageContent").innerHTML = `<div class="login-wrap"><div class="card login-card"><div class="login-logo"><img src="assets/school-logo.jpg" alt="DATA SANA MEMORIAL SCHOOL"></div><div class="eyebrow">DATA SANA MEMORIAL SCHOOL</div><h2>Welcome to EduTrack AI</h2><p class="muted">${live ? "Sign in with your school account." : "Demo portal — sample data only."}</p>${tabs}${body}<div id="loginError" class="notice" hidden></div></div></div>`;
}
const loginError = msg => { const el = $("#loginError"); if (el) { el.textContent = msg; el.hidden = false; } };

/* ---------------- pages ---------------- */
const pages = {
  async dashboard() {
    if (me.role === "admin") {
      const snap = await loadSnapshot(true), D = DirectorAssistant, day = todayStr();
      const c = D.dayCounts(snap, day, null), pend = snap.reqs.filter(r => r.status === "pending").length;
      view.pendingCount = pend;
      const days = [6, 5, 4, 3, 2, 1, 0].map(n => addDays(day, -n));
      const trend = days.map(d => { const r = D.rangeCounts(snap, d, d, null); return `<div class="trend-col"><div class="trend-val">${r.rate === null ? "—" : r.rate + "%"}</div><div class="trend-bar"><i style="height:${r.rate || 0}%"></i></div><div class="trend-lab">${safe(d.slice(5))}</div></div>`; }).join("");
      const rows = snap.classes.map(cl => { const k = D.dayCounts(snap, day, [cl.id]); return `<tr><td><b>${safe(cl.name)}</b><div class="small muted">${safe(cl.teacherName || "—")}</div></td><td>${k.total}</td><td>${k.present + k.late}</td><td>${k.absent}</td><td>${k.excused}</td><td>${k.unmarked ? `<span class="badge">${k.unmarked} ${t("pending").toLowerCase()}</span>` : "—"}</td><td style="min-width:120px"><div class="progress"><i style="display:block;height:100%;width:${k.rate || 0}%;background:var(--green)"></i></div><span class="small muted">${D.fmtPct(k.rate)}</span></td></tr>`; }).join("");
      return `<div class="stats">${stat(t("totalStudents"), snap.students.length, `${snap.classes.length} ${t("classesCount").toLowerCase()}`, "♙")}${stat(t("presentToday"), c.present + c.late, c.marked ? `${c.marked} marked · ${c.unmarked} not yet marked` : "No attendance recorded yet", "✓")}${stat(t("absentToday"), c.absent, `${c.excused} excused`, "✗")}${stat(t("rate"), D.fmtPct(c.rate), "Present + late ÷ marked, today", "%")}</div>
      <div class="grid-two"><div class="card"><div class="card-head"><h2>${t("todayByClass")}</h2><button class="btn primary" data-go="assistant">🎤 ${t("askAssistant")}</button></div>${rows ? `<div class="table-wrap"><table><thead><tr><th>${t("class")}</th><th>${t("students")}</th><th>${t("present")}</th><th>${t("absent")}</th><th>${t("excused")}</th><th>${t("statusCol")}</th><th>${t("rate")}</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">${t("empty")}</div>`}</div>
      <div class="card"><h2>${t("trend7")}</h2><div class="trend">${trend}</div><div class="row"><span>${t("pendingOnly")}</span><button class="btn ${pend ? "primary" : ""}" data-go="registration">${pend} ${t("pending").toLowerCase()}</button></div>${store.mode === "demo" ? `<p class="notice" style="margin-top:12px">${t("notice")}</p>` : ""}</div></div>`;
    }
    if (me.role === "teacher") {
      const classes = await myClasses();
      const rows = await Promise.all(classes.map(async c => { const [roster, rec] = await Promise.all([store.listStudents({ classId: c.id }), store.getAttendance(c.id, todayStr())]); return { c, total: roster.length, marked: Object.keys(rec).length }; }));
      return `<div class="stats">${stat(t("classesCount"), classes.length, "Assigned to you", "▤")}${stat(t("totalStudents"), rows.reduce((n, r) => n + r.total, 0), "In your classes", "♙")}</div>
      <div class="card"><h2>Today's attendance</h2>${rows.length ? rows.map(r => `<div class="row"><div><b>${safe(r.c.name)}</b><div class="small muted">${r.marked} of ${r.total} marked today</div></div><button class="btn ${r.marked < r.total ? "primary" : ""}" data-go="attendance" data-class="${safe(r.c.id)}">${t("attendance")}</button></div>`).join("") : `<div class="empty">No class has been assigned to you yet. Contact the administrator.</div>`}</div>`;
    }
    const [rows, classes] = await Promise.all([store.listAttendance({ studentUid: me.uid }), store.listClasses()]);
    const from = addDays(todayStr(), -30), recent = rows.filter(r => r.date >= from), ok = recent.filter(r => r.status === "present" || r.status === "late").length;
    return `<div class="stats">${stat("Student ID", me.studentId || "—", classLabel(classes, me.classId), "♙")}${stat(t("rate"), recent.length ? Math.round(ok / recent.length * 100) + "%" : "—", "Last 30 days", "✓")}${stat(t("absent"), recent.filter(r => r.status === "absent").length, "Last 30 days", "▥")}</div>
    <div class="card"><div class="row"><span>${t("myAttendance")}</span><button class="btn" data-go="reports">Open</button></div><div class="row"><span>${t("announcements")}</span><button class="btn" data-go="announcements">Open</button></div></div>`;
  },

  async status() {
    const r = await store.getMyRequest();
    const st = r ? r.status : "pending";
    return `<div class="card"><div class="card-head"><h2>${t("status")}</h2>${badgeFor(st)}</div><p>${st === "rejected" ? t("rejectedMsg") : t("pendingMsg")}</p>${r ? `<div class="row"><span>${t("name")}</span><b>${safe(r.name)}</b></div><div class="row"><span>${t("grade")} / ${t("section")}</span><b>${safe(r.grade)} ${safe(r.section)}</b></div><div class="row"><span>${t("date")}</span><b>${safe(r.date || "")}</b></div>` : ""}</div>`;
  },

  async registration() {
    const [reqs, classes] = await Promise.all([store.listRequests(), store.listClasses()]);
    view.pendingCount = reqs.filter(r => r.status === "pending").length;
    const opts = r => classes.map(c => `<option value="${safe(c.id)}" ${c.grade === Number(r.grade) && String(c.section).toLowerCase() === String(r.section).toLowerCase() ? "selected" : ""}>${safe(c.name)}</option>`).join("");
    return `<div class="card"><div class="card-head"><h2>${t("pendingOnly")}</h2><span class="badge">${view.pendingCount} ${t("pending").toLowerCase()}</span></div>
    <p class="muted small">Students create their own account and appear here. Approving assigns a student ID and a class; only then can the student use the system.</p>
    ${reqs.length ? `<div class="table-wrap"><table><thead><tr><th>${t("name")}</th><th>${t("grade")}</th><th>${t("guardian")}</th><th>${t("phone")}</th><th>${t("statusCol")}</th><th>${t("class")} / Action</th></tr></thead><tbody>${reqs.map(r => `<tr><td>${safe(r.name)}<div class="small muted">${safe(r.date || "")}</div></td><td>${safe(r.grade)} ${safe(r.section)}</td><td>${safe(r.guardian || "—")}</td><td>${safe(r.phone || "—")}</td><td>${badgeFor(r.status)}</td><td>${r.status === "pending" ? `<select id="cls-${safe(r.uid)}">${opts(r)}</select> <button class="btn primary" data-approve="${safe(r.uid)}">${t("approve")}</button> <button class="btn danger" data-reject="${safe(r.uid)}">${t("reject")}</button>` : safe(r.studentId || "—")}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">${t("empty")}</div>`}
    ${classes.length ? "" : `<p class="notice">Create at least one class (Classes & teachers) before approving students.</p>`}</div>`;
  },

  async attendance() {
    const classes = await myClasses();
    if (!classes.length) return `<div class="card"><h2>${t("attendance")}</h2><p class="notice">No class has been assigned to you yet. Contact the administrator.</p></div>`;
    if (!classes.some(c => c.id === view.attClass)) view.attClass = classes[0].id;
    const cls = classes.find(c => c.id === view.attClass), date = view.attDate;
    const [roster, existing] = await Promise.all([store.listStudents({ classId: cls.id }), store.getAttendance(cls.id, date)]);
    const sel = (s, v) => (existing[s.uid] || "present") === v ? "selected" : "";
    return `<div class="notice">Only the assigned homeroom teacher can submit attendance. Records can be entered for today or up to 14 days back.</div>
    <div class="card"><div class="card-head"><h2>${t("daily")}</h2><div style="display:flex;gap:8px;flex-wrap:wrap">${classes.length > 1 ? `<select id="attClass">${classes.map(c => `<option value="${safe(c.id)}" ${c.id === cls.id ? "selected" : ""}>${safe(c.name)}</option>`).join("")}</select>` : `<b>${safe(cls.name)}</b>`}<input id="attDate" type="date" value="${safe(date)}" min="${addDays(todayStr(), -14)}" max="${todayStr()}" style="border:1px solid var(--line);padding:8px;border-radius:8px"></div></div>
    ${roster.length ? `<div class="table-wrap"><table><thead><tr><th>${t("students")}</th><th>${t("statusCol")}</th></tr></thead><tbody>${roster.map(s => `<tr><td><div class="person"><span class="avatar">${safe(s.name.split(" ").map(x => x[0]).join("").slice(0, 2))}</span>${safe(s.name)} <span class="small muted">${safe(s.studentId)}</span></div></td><td><select class="att-status" data-uid="${safe(s.uid)}"><option value="present" ${sel(s, "present")}>${t("present")}</option><option value="absent" ${sel(s, "absent")}>${t("absent")}</option><option value="late" ${sel(s, "late")}>${t("late")}</option><option value="excused" ${sel(s, "excused")}>${t("excused")}</option></select></td></tr>`).join("")}</tbody></table></div>
    <div class="form-actions"><button class="btn" id="markAll">${t("markAll")}</button><button class="btn primary" id="saveAttendance">${t("save")}</button></div>` : `<div class="empty">No active students are assigned to this class yet.</div>`}</div>`;
  },

  async students() {
    let list, classes = await store.listClasses();
    if (me.role === "admin") list = await store.listStudents({});
    else list = (await Promise.all((me.classIds || []).map(id => store.listStudents({ classId: id })))).flat();
    return `<div class="card"><div class="card-head"><h2>${t("studentList")}</h2><input class="search" id="studentSearch" placeholder="${t("search")}" style="max-width:230px"></div>
    <div class="table-wrap"><table><thead><tr><th>Student ID</th><th>${t("name")}</th><th>${t("class")}</th><th>${t("statusCol")}</th></tr></thead><tbody>${list.map(s => `<tr data-q="${safe((s.name + " " + s.studentId).toLowerCase())}"><td>${safe(s.studentId)}</td><td><div class="person"><span class="avatar">${safe(s.name.split(" ").map(x => x[0]).join("").slice(0, 2))}</span>${safe(s.name)}</div></td><td>${safe(classLabel(classes, s.classId))}</td><td><span class="badge green">${safe(s.status)}</span></td></tr>`).join("")}</tbody></table></div>${list.length ? "" : `<div class="empty">${t("empty")}</div>`}</div>`;
  },

  async classes() {
    const [classes, teachers, students] = await Promise.all([store.listClasses(), store.listTeachers(), store.listStudents({})]);
    const tOpts = sel => `<option value="">— none —</option>` + teachers.map(x => `<option value="${safe(x.uid)}" ${x.uid === sel ? "selected" : ""}>${safe(x.name)}</option>`).join("");
    const live = store.mode === "live";
    return `<div class="grid-two"><div class="card"><h2>${t("createClass")}</h2><form id="classForm"><div class="field"><label>Class name</label><input name="name" placeholder="Grade 11 - Section A" required maxlength="60"></div><div class="form-grid"><div class="field"><label>${t("grade")}</label><select name="grade"><option>9</option><option>10</option><option>11</option><option>12</option></select></div><div class="field"><label>${t("section")}</label><input name="section" value="A" required maxlength="4"></div></div><div class="field"><label>${t("teacher")}</label><select name="teacherUid">${tOpts("")}</select></div><button class="btn primary">${t("createClass")}</button></form></div>
    <div class="card"><h2>${t("createTeacher")}</h2><form id="teacherForm"><div class="field"><label>Full name</label><input name="name" required minlength="2" maxlength="80"></div><div class="field"><label>${t("email")}</label><input name="email" type="email" required></div>${live ? `<div class="field"><label>Temporary password (10+ characters)</label><input name="password" type="password" required minlength="10" autocomplete="new-password"></div>` : ""}<button class="btn primary">${t("createTeacher")}</button>${live ? `<p class="small muted">Give the teacher this temporary password privately. They can change it with “${t("forgot")}” on the sign-in page.</p>` : ""}</form></div></div>
    <div class="card" style="margin-top:16px"><h2>${t("classes")}</h2>${classes.length ? classes.map(c => `<div class="row"><div><b>${safe(c.name)}</b><div class="small muted">${students.filter(s => s.classId === c.id).length} ${t("students").toLowerCase()}</div></div><div><select id="tch-${safe(c.id)}">${tOpts(c.teacherUid)}</select> <button class="btn soft" data-assign="${safe(c.id)}">${t("assign")}</button></div></div>`).join("") : `<div class="empty">${t("empty")}</div>`}</div>`;
  },

  async reports() {
    let rows = [];
    if (me.role === "student") {
      const [recs, classes] = await Promise.all([store.listAttendance({ studentUid: me.uid }), store.listClasses()]);
      rows = recs.map(r => ({ date: r.date, student: me.name, studentId: me.studentId, cls: classLabel(classes, r.classId), status: r.status }));
    } else {
      const classes = await myClasses();
      const chosen = view.repClass === "all" ? classes : classes.filter(c => c.id === view.repClass);
      const from = addDays(todayStr(), -view.repDays);
      const parts = await Promise.all(chosen.map(async c => {
        const [roster, recs] = await Promise.all([store.listStudents({ classId: c.id }), store.listAttendance({ classId: c.id, from })]);
        const nm = Object.fromEntries(roster.map(s => [s.uid, s]));
        return recs.map(r => ({ date: r.date, student: (nm[r.studentUid] || {}).name || r.studentUid, studentId: r.studentId, cls: c.name, status: r.status }));
      }));
      rows = parts.flat().sort((a, b) => b.date.localeCompare(a.date) || a.student.localeCompare(b.student));
      view.repClasses = classes;
    }
    view.repRows = rows;
    const ok = rows.filter(r => r.status === "present" || r.status === "late").length;
    const filters = me.role === "student" ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="repClass"><option value="all" ${view.repClass === "all" ? "selected" : ""}>${t("allClasses")}</option>${view.repClasses.map(c => `<option value="${safe(c.id)}" ${view.repClass === c.id ? "selected" : ""}>${safe(c.name)}</option>`).join("")}</select><select id="repDays">${[7, 30, 90, 180].map(d => `<option value="${d}" ${view.repDays === d ? "selected" : ""}>${d} ${t("days")}</option>`).join("")}</select></div>`;
    return `<div class="stats">${stat(t("records"), rows.length, "", "▥")}${stat(t("present"), ok, "Present or late", "✓")}${stat(t("absent"), rows.filter(r => r.status === "absent").length, "", "✗")}${stat(t("rate"), rows.length ? Math.round(ok / rows.length * 100) + "%" : "—", "", "%")}</div>
    <div class="card"><div class="card-head"><h2>Attendance history</h2><div style="display:flex;gap:8px;flex-wrap:wrap">${filters}<button class="btn" id="exportCsv">${t("exportCsv")}</button></div></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>${t("date")}</th><th>${t("name")}</th><th>${t("class")}</th><th>${t("statusCol")}</th></tr></thead><tbody>${rows.slice(0, 500).map(r => `<tr><td>${safe(r.date)}</td><td>${safe(r.student)}</td><td>${safe(r.cls)}</td><td>${badgeFor(r.status)}</td></tr>`).join("")}</tbody></table></div>${rows.length > 500 ? `<p class="small muted">Showing the latest 500 rows. Export CSV for all rows.</p>` : ""}` : `<div class="empty">No attendance has been submitted for this period.</div>`}</div>`;
  },

  async assistant() {
    if (me.role === "admin") return directorAssistantPage();
    return `<div class="grid-two"><div class="card"><h2>${t("assistant")}</h2><div class="assistant-box" id="chat"><div class="bubble bot">${safe(t("assistantIntro"))}</div></div><div class="quick-asks"><button data-ask="How do students register?">How do students register?</button><button data-ask="When is attendance taken?">When is attendance taken?</button><button data-ask="What is the school motto?">School motto?</button><button data-ask="ምዝገባ እንዴት ነው?">ምዝገባ እንዴት ነው?</button></div><form class="assistant-input" id="chatForm"><input id="chatInput" placeholder="${safe(t("ask"))}" autocomplete="off" maxlength="300"><button class="btn primary">${t("send")}</button></form></div>
    <div class="card"><h2>About this assistant</h2><p class="notice">This assistant answers general school-procedure questions from a fixed list, in English and Amharic. It does not read student records. A generative AI model can be added later through a secure server-side service.</p></div></div>`;
  },

  async announcements() {
    const list = await store.listAnnouncements();
    return `${me.role === "admin" ? `<div class="card"><h2>${t("post")}</h2><form id="announcementForm"><div class="field"><label>${t("title")}</label><input name="title" required maxlength="120"></div><div class="field"><label>${t("message")}</label><textarea name="body" rows="3" required maxlength="2000"></textarea></div><button class="btn primary">${t("post")}</button></form></div>` : ""}
    <div class="card" style="margin-top:15px"><h2>${t("announcements")}</h2>${list.length ? list.map(a => `<div class="row"><div><b>${safe(a.title)}</b><p class="muted small">${safe(a.body)}</p><span class="small muted">${safe(a.date)}</span></div></div>`).join("") : `<div class="empty">${t("empty")}</div>`}</div>`;
  }
};

/* ---------------- director assistant: data answers + voice ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recErr = "", spokeWarned = false;
const msgHtml = m => {
  if (m.role === "user") return `<div class="bubble user">${safe(m.text)}</div>`;
  const list = m.lines && m.lines.length ? `<ul class="bubble-list">${m.lines.map(l => `<li>${safe(l)}</li>`).join("")}</ul>` : "";
  const tbl = m.table ? `<div class="table-wrap"><table><thead><tr>${m.table.head.map(h => `<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${m.table.rows.map(r => `<tr>${r.map(c => `<td>${safe(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : "";
  return `<div class="bubble bot"><div>${safe(m.text)}</div>${list}${tbl}</div>`;
};
const paintChat = () => { const box = $("#chat"); if (!box) return; box.innerHTML = (view.chat.length ? view.chat : [{ role: "bot", text: t("directorIntro") }]).map(msgHtml).join(""); box.scrollTop = box.scrollHeight; };
function directorAssistantPage() {
  const chips = lang === "am"
    ? ["ዛሬ ስንት ተማሪዎች ተገኝተዋል?", "ዛሬ ማን አልተገኘም?", "ስንት ተማሪዎች አሉ?", "ዕለታዊ ማጠቃለያ"]
    : ["How many students are present today?", "Who is absent today?", "How many students are there?", "Attendance rate by class this week", "Which classes have not taken attendance?", "Who is most absent this month?", "Daily summary", "Calculate 12 out of 40 as a percent"];
  setTimeout(paintChat, 0);
  return `<div class="grid-two"><div class="card"><div class="card-head"><h2>${t("assistant")}</h2><div class="voice-tools"><label class="small"><input type="checkbox" id="speakToggle" ${view.speak ? "checked" : ""}> 🔊 ${t("readAloud")}</label><button class="btn" id="clearChat">${t("clear")}</button></div></div>
    <div class="assistant-box" id="chat"></div><div class="quick-asks">${chips.map(c => `<button data-ask="${safe(c)}">${safe(c)}</button>`).join("")}</div>
    <form class="assistant-input" id="chatForm"><button type="button" class="mic" id="micBtn" aria-label="Voice input" title="Voice input">🎤</button><input id="chatInput" placeholder="${safe(t("ask"))}" autocomplete="off" maxlength="300"><button class="btn primary" type="submit">${t("send")}</button></form><div class="small muted" id="voiceStatus">${t("tapMic")}</div></div>
    <div class="card"><h2>What I can do</h2><ul class="bubble-list"><li>Count students, present, late, absent and excused — for the whole school, a grade, or one class</li><li>Today, yesterday, a date (2026-11-05), or the last 7 / 30 days</li><li>Attendance rate by class, best and lowest classes, most-absent students</li><li>Who is absent, which classes have not taken attendance, pending applications</li><li>Calculations: <i>45 + 30</i>, <i>15% of 200</i>, <i>12 out of 40 as a percent</i></li><li>English and Amharic (አማርኛ)</li></ul>
    <p class="notice">Answers are calculated from the school's live records on your device. Voice input uses your browser's speech recognition; in Chrome and Edge the audio is processed by the browser vendor's speech service, so avoid dictating confidential details.</p><button class="btn" id="refreshSnap">${t("refreshData")}</button></div></div>`;
}
async function askDirector(q, viaVoice) {
  q = String(q || "").trim(); if (!q) return;
  view.chat.push({ role: "user", text: q }, { role: "bot", text: "…", tmp: true }); paintChat();
  let r;
  try { const snap = await loadSnapshot(); r = DirectorAssistant.answer(q, snap, { lang, today: todayStr() }); if (r.unknown) r = { text: faq(q) }; }
  catch (e) { console.error(e); r = { text: friendly(e) }; }
  view.chat = view.chat.filter(m => !m.tmp); view.chat.push({ role: "bot", ...r }); paintChat();
  if (viaVoice || view.speak) speakAnswer(r);
}
function speakAnswer(r) {
  if (!("speechSynthesis" in window)) return;
  const am = /[\u1200-\u137F]/.test(r.text);
  if (am) {
    const voices = speechSynthesis.getVoices();
    if (voices.length && !voices.some(v => /^am/i.test(v.lang))) { if (!spokeWarned) { toast("This device has no Amharic voice, so the answer is shown on screen only."); spokeWarned = true; } return; }
  }
  const u = new SpeechSynthesisUtterance([r.text, ...(r.lines || []).slice(0, 6)].join(". "));
  u.lang = am ? "am-ET" : "en-US"; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function stopVoice() { if (rec) { try { rec.stop(); } catch { /* already stopped */ } } }
function toggleVoice() {
  const st = $("#voiceStatus");
  if (!SR) { toast(t("voiceUnsupported")); if (st) st.textContent = t("voiceUnsupported"); return; }
  if (rec) { stopVoice(); return; }
  const r = new SR(); rec = r; recErr = ""; let finalText = "";
  r.lang = lang === "am" ? "am-ET" : "en-US"; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  r.onstart = () => { const b = $("#micBtn"); if (b) b.classList.add("on"); const s2 = $("#voiceStatus"); if (s2) s2.textContent = t("listening"); };
  r.onresult = e => {
    let txt = ""; for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
    const inp = $("#chatInput"); if (inp) inp.value = txt;
    if (e.results[e.results.length - 1].isFinal) finalText = txt;
  };
  r.onerror = e => {
    const m = { "not-allowed": "Microphone permission was denied. Allow the microphone for this site in your browser settings.", "service-not-allowed": "Voice input is blocked here. Open the site over https:// (the GitHub Pages link) in Chrome, Edge or Safari.", "no-speech": "I didn't hear anything. Tap the microphone and try again.", "audio-capture": "No microphone was found.", "network": "Voice recognition needs an internet connection.", "language-not-supported": "This browser can't recognise that language. Switch the language selector or type your question." };
    recErr = m[e.error] || ("Voice input error: " + e.error);
  };
  r.onend = () => {
    rec = null; const b = $("#micBtn"); if (b) b.classList.remove("on");
    const s2 = $("#voiceStatus"); if (s2) s2.textContent = recErr || t("tapMic");
    if (recErr) toast(recErr);
    if (finalText) { const inp = $("#chatInput"); if (inp) inp.value = ""; askDirector(finalText, true); }
  };
  try { r.start(); } catch (e) { rec = null; toast("Could not start the microphone."); }
}

/* ---------------- assistant FAQ (no private data) ---------------- */
function faq(q) {
  const x = q.toLowerCase(), am = /[\u1200-\u137F]/.test(q) || lang === "am";
  const A = (en, a) => am ? a : en;
  if (/register|registration|apply|ምዝገባ|መመዝገብ|ማመልከቻ/.test(x)) return A("Students create their own account and submit a registration application. The school administrator reviews it; once approved, the student is given a student ID and a class.", "ተማሪዎች የራሳቸውን አካውንት ፈጥረው የምዝገባ ማመልከቻ ይልካሉ። የትምህርት ቤቱ አስተዳዳሪ ይመረምራል፤ ሲፈቀድ ተማሪው የተማሪ መታወቂያ ቁጥርና ክፍል ይሰጠዋል።");
  if (/attendance|present|absent|late|መገኘት|ተገኝ|አልተገኘ/.test(x)) return A("Daily attendance is recorded by the assigned homeroom teacher as Present, Absent, Late or Excused. Students cannot change their own attendance; contact your homeroom teacher if a record needs correction.", "ዕለታዊ መገኘት በተመደበው የክፍል መምህር ይመዘገባል (ተገኝቷል፣ አልተገኘም፣ ዘግይቷል፣ በምክንያት ቀርቷል)። ተማሪዎች የራሳቸውን መገኘት መቀየር አይችሉም፤ ማስተካከያ ካስፈለገ የክፍል መምህርዎን ያነጋግሩ።");
  if (/homeroom|teacher|class|መምህር|ክፍል/.test(x)) return A("Each class has an assigned homeroom teacher. Only that teacher can record attendance for the class.", "እያንዳንዱ ክፍል የተመደበ የክፍል መምህር አለው። ለክፍሉ መገኘት መመዝገብ የሚችለው ያ መምህር ብቻ ነው።");
  if (/motto|seek|serve|know|መርህ/.test(x)) return A("DATA SANA MEMORIAL SCHOOL motto: To seek · To serve · To know.", "የዳታ ሳና መታሰቢያ ትምህርት ቤት መርህ፦ ለመፈለግ · ለማገልገል · ለማወቅ።");
  if (/language|amharic|english|አማርኛ|እንግሊዝኛ/.test(x)) return A("EduTrack AI supports English and Amharic. Use the language selector at the top.", "ኢዱትራክ AI እንግሊዝኛና አማርኛ ይደግፋል። ከላይ ያለውን የቋንቋ መምረጫ ይጠቀሙ።");
  if (/password|forgot|የይለፍ/.test(x)) return A("Use “Forgot password?” on the sign-in page to receive a reset email. Teachers can also ask the administrator for help.", "በመግቢያ ገጹ “የይለፍ ቃል ረስተዋል?” የሚለውን ይጠቀሙ፤ የማስተካከያ ኢሜይል ይደርስዎታል።");
  return A("I can help with general questions about registration, attendance, homeroom teachers, the school motto and language support. For personal records, please contact the school office.", "ስለ ምዝገባ፣ መገኘት፣ የክፍል መምህራንና የትምህርት ቤቱ መርህ አጠቃላይ ጥያቄዎችን መመለስ እችላለሁ። ለግል መዝገቦች የትምህርት ቤቱን ቢሮ ያነጋግሩ።");
}
function sendQuestion(q) {
  q = q.trim(); if (!q) return;
  const chat = $("#chat");
  chat.insertAdjacentHTML("beforeend", `<div class="bubble user">${safe(q)}</div><div class="bubble bot">${safe(faq(q))}</div>`);
  $("#chatInput").value = ""; chat.scrollTop = chat.scrollHeight;
}

/* ---------------- events ---------------- */
$("#nav").addEventListener("click", e => { const b = e.target.closest("[data-page]"); if (b && allowed(b.dataset.page)) setPage(b.dataset.page); });

$("#pageContent").addEventListener("click", async e => {
  const el = e.target;
  const tab = el.closest("[data-tab]"); if (tab) { view.loginTab = tab.dataset.tab; showLogin(); return; }
  if (el.id === "forgotLink") {
    e.preventDefault();
    const email = prompt("Enter your account email. We will send a password reset link:");
    if (email) await busy(null, async () => { await store.resetPassword(email); toast("If that email has an account, a reset link has been sent."); });
    return;
  }
  const go = el.closest("[data-go]");
  if (go) { if (go.dataset.class) view.attClass = go.dataset.class; setPage(go.dataset.go); return; }
  const ask = el.closest("[data-ask]"); if (ask) { if (me.role === "admin") askDirector(ask.dataset.ask, false); else sendQuestion(ask.dataset.ask); return; }
  if (el.closest("#micBtn")) { toggleVoice(); return; }
  if (el.id === "clearChat") { view.chat = []; if ("speechSynthesis" in window) speechSynthesis.cancel(); paintChat(); return; }
  if (el.id === "refreshSnap") { snapCache = null; toast("Data refreshed."); return; }
  const ap = el.closest("[data-approve]");
  if (ap) { const uid = ap.dataset.approve, cid = $("#cls-" + uid).value; await busy(ap, async () => { await store.approveRequest(uid, cid); toast("Application approved. The student can now sign in."); await render(); }); return; }
  const rj = el.closest("[data-reject]");
  if (rj) { if (!confirm("Reject this application?")) return; await busy(rj, async () => { await store.rejectRequest(rj.dataset.reject); toast("Application rejected."); await render(); }); return; }
  const as = el.closest("[data-assign]");
  if (as) { const cid = as.dataset.assign; await busy(as, async () => { await store.setClassTeacher(cid, $("#tch-" + cid).value); toast("Homeroom teacher updated."); await render(); }); return; }
  if (el.id === "markAll") { $$(".att-status").forEach(s => s.value = "present"); return; }
  if (el.id === "saveAttendance") {
    const date = $("#attDate").value;
    if (!date || date > todayStr() || date < addDays(todayStr(), -14)) { toast("Choose today or a date within the last 14 days."); return; }
    const records = {}; $$(".att-status").forEach(s => records[s.dataset.uid] = s.value);
    await busy(el, async () => {
      const students = await store.listStudents({ classId: view.attClass });
      await store.saveAttendance({ classId: view.attClass, date, records, students });
      toast("Attendance saved for " + date + "."); await render();
    });
    return;
  }
  if (el.id === "exportCsv") {
    const csvSafe = v => { v = String(v ?? ""); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const rows = [["Date", "Student ID", "Student Name", "Class", "Status"], ...view.repRows.map(r => [r.date, r.studentId, r.student, r.cls, r.status])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map(r => r.map(csvSafe).join(",")).join("\n")], { type: "text/csv" }));
    a.download = "edutrack-attendance.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
});

$("#pageContent").addEventListener("change", e => {
  const id = e.target.id;
  if (id === "speakToggle") { view.speak = e.target.checked; if (!view.speak && "speechSynthesis" in window) speechSynthesis.cancel(); return; }
  if (id === "attClass") { view.attClass = e.target.value; render(); }
  if (id === "attDate" && e.target.value) { view.attDate = e.target.value; render(); }
  if (id === "repClass") { view.repClass = e.target.value; render(); }
  if (id === "repDays") { view.repDays = Number(e.target.value); render(); }
});
$("#pageContent").addEventListener("input", e => {
  if (e.target.id === "studentSearch") { const q = e.target.value.toLowerCase(); $$("tr[data-q]").forEach(r => r.hidden = !r.dataset.q.includes(q)); }
});

$("#pageContent").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target, f = Object.fromEntries(new FormData(form)), btn = form.querySelector("button[type=submit],button:not([type])");
  const id = form.id;
  if (id === "chatForm") { if (me.role === "admin") { const v = $("#chatInput").value; $("#chatInput").value = ""; askDirector(v, false); } else sendQuestion($("#chatInput").value); return; }
  if (btn) btn.disabled = true; invalidate();
  try {
    if (id === "loginForm") { await store.signIn(f); toast("Signed in."); }
    else if (id === "signupForm") { await store.signUp(f); toast("Application submitted. Waiting for administrator approval."); }
    else if (id === "classForm") { await store.createClass(f); toast("Classroom created."); await render(); }
    else if (id === "teacherForm") { await store.createTeacher(f); toast("Teacher account created."); await render(); }
    else if (id === "announcementForm") { await store.postAnnouncement(f); toast("Announcement published."); await render(); }
  } catch (err) {
    console.error(err);
    if (id === "loginForm" || id === "signupForm") loginError(friendly(err)); else toast(friendly(err));
  } finally { if (btn) btn.disabled = false; }
});

$("#logoutBtn").addEventListener("click", () => busy(null, () => store.signOut()));
$("#language").addEventListener("change", e => { lang = e.target.value; render(); });

/* ---------------- boot ---------------- */
async function boot() {
  let cfg = null;
  try { const m = await import("./firebase-config.js"); if (m.firebaseConfig && !String(m.firebaseConfig.apiKey).startsWith("YOUR_")) cfg = m.firebaseConfig; } catch { /* no config -> demo mode */ }
  if (cfg) {
    try { store = await (await import("./data-firebase.js")).createStore(cfg); }
    catch (err) { console.error("Firebase failed to start; using demo mode.", err); }
  }
  if (!store) store = window.createDemoStore();
  store.onAuthChange(async user => { me = user; view.loginTab = "in"; page = user ? defaultPage() : "dashboard"; await render(); });
  if (store.mode === "live") { /* onAuthStateChanged fires automatically */ } else await render();
}
boot();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});
let installPrompt;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; $("#installBtn").hidden = false; });
$("#installBtn").addEventListener("click", async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("#installBtn").hidden = true; });
