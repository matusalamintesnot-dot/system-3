/* Live data layer: Firebase Authentication + Cloud Firestore (works on the free Spark plan).
   Same interface as data-demo.js. All permissions are enforced by firestore.rules,
   NOT by this file - the browser is never trusted. */
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs,
  writeBatch, runTransaction, serverTimestamp, arrayUnion, arrayRemove, addDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const pad = n => String(n).padStart(2, "0");
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tsIso = ts => (ts && ts.toDate ? isoDate(ts.toDate()) : "");
const CHUNK = 15; // keeps each batch under Firestore's 20 rule-lookups-per-batch limit

export async function createStore(cfg) {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  let listener = null;
  let suppress = false;

  const toMe = p => ({
    uid: p.uid, email: p.email, name: p.displayName, role: p.role, status: p.status,
    classId: p.classId, classIds: Array.isArray(p.classIds) ? p.classIds : [],
    studentId: p.studentId, grade: p.grade, section: p.section
  });
  const toStudent = p => ({ uid: p.uid, studentId: p.studentId, name: p.displayName, grade: p.grade, section: p.section, classId: p.classId, status: p.status });
  const byName = (a, b) => (a.name || "").localeCompare(b.name || "");

  async function emit() {
    const u = auth.currentUser;
    if (!listener) return;
    if (!u) return listener(null);
    try {
      const snap = await getDoc(doc(db, "profiles", u.uid));
      listener(snap.exists() ? toMe(snap.data()) : { uid: u.uid, email: u.email, name: u.email, role: "unknown", status: "none", classIds: [] });
    } catch (e) {
      console.error(e);
      listener({ uid: u.uid, email: u.email, name: u.email, role: "unknown", status: "error", classIds: [] });
    }
  }
  onAuthStateChanged(auth, () => { if (!suppress) emit(); });
  const needAdmin = () => { if (!auth.currentUser) throw new Error("Please sign in again."); };

  return {
    mode: "live",
    onAuthChange(cb) { listener = cb; auth.authStateReady().then(emit); },
    refreshMe: emit,

    async signIn({ email, password }) {
      await signInWithEmailAndPassword(auth, String(email).trim(), password);
    },
    async signUp({ email, password, name, grade, section, guardian, phone }) {
      suppress = true;
      try {
        const cred = await createUserWithEmailAndPassword(auth, String(email).trim(), password);
        const uid = cred.user.uid;
        const batch = writeBatch(db);
        batch.set(doc(db, "profiles", uid), {
          uid, email: cred.user.email, displayName: name.trim(), role: "student", status: "pending", createdAt: serverTimestamp()
        });
        batch.set(doc(db, "registrationRequests", uid), {
          uid, name: name.trim(), grade: Number(grade), section: section.trim(), guardian: (guardian || "").trim(),
          phone: (phone || "").trim(), status: "pending", createdAt: serverTimestamp()
        });
        await batch.commit();
      } finally { suppress = false; }
      await emit();
    },
    async signOut() { await fbSignOut(auth); },
    async resetPassword(email) { await sendPasswordResetEmail(auth, String(email).trim()); },
    async getMyRequest() {
      const s = await getDoc(doc(db, "registrationRequests", auth.currentUser.uid));
      if (!s.exists()) return null;
      const r = s.data(); return { ...r, date: tsIso(r.createdAt) };
    },

    async listStudents({ classId } = {}) {
      const q = classId
        ? query(collection(db, "profiles"), where("classId", "==", classId))
        : query(collection(db, "profiles"), where("role", "==", "student"));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data()).filter(p => p.role === "student" && p.status === "active").map(toStudent).sort(byName);
    },
    async listRequests() {
      const snap = await getDocs(query(collection(db, "registrationRequests"), orderBy("createdAt", "desc"), limit(300)));
      return snap.docs.map(d => { const r = d.data(); return { ...r, date: tsIso(r.createdAt) }; });
    },
    async approveRequest(uid, classId) {
      needAdmin();
      if (!classId) throw new Error("Choose a class first.");
      await runTransaction(db, async tx => {
        const reqRef = doc(db, "registrationRequests", uid), profRef = doc(db, "profiles", uid);
        const cntRef = doc(db, "meta", "counters"), clsRef = doc(db, "classes", classId);
        const [req, cnt, cls] = await Promise.all([tx.get(reqRef), tx.get(cntRef), tx.get(clsRef)]);
        if (!req.exists() || req.data().status !== "pending") throw new Error("This application is no longer pending.");
        if (!cls.exists()) throw new Error("That class no longer exists.");
        const next = cnt.exists() && Number.isInteger(cnt.data().nextStudent) ? cnt.data().nextStudent : 1001;
        const studentId = "DSM-" + next;
        const r = req.data();
        tx.set(cntRef, { nextStudent: next + 1 }, { merge: true });
        tx.update(profRef, { status: "active", studentId, classId, grade: r.grade, section: r.section });
        tx.update(reqRef, { status: "approved", studentId, classId, reviewedBy: auth.currentUser.uid, reviewedAt: serverTimestamp() });
      });
    },
    async rejectRequest(uid) {
      needAdmin();
      await runTransaction(db, async tx => {
        const reqRef = doc(db, "registrationRequests", uid);
        const req = await tx.get(reqRef);
        if (!req.exists() || req.data().status !== "pending") throw new Error("This application is no longer pending.");
        tx.update(reqRef, { status: "rejected", reviewedBy: auth.currentUser.uid, reviewedAt: serverTimestamp() });
      });
    },

    async listClasses() {
      const snap = await getDocs(collection(db, "classes"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    },
    async createClass({ name, grade, section, teacherUid }) {
      needAdmin();
      const id = ("C" + grade + section).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if ((await getDoc(doc(db, "classes", id))).exists()) throw new Error("A class with that grade and section already exists.");
      let teacherName = "";
      if (teacherUid) { const t = await getDoc(doc(db, "profiles", teacherUid)); teacherName = t.exists() ? t.data().displayName : ""; }
      const batch = writeBatch(db);
      batch.set(doc(db, "classes", id), { name: name.trim(), grade: Number(grade), section: section.trim(), teacherUid: teacherUid || "", teacherName, createdAt: serverTimestamp() });
      if (teacherUid) batch.update(doc(db, "profiles", teacherUid), { classIds: arrayUnion(id) });
      await batch.commit();
    },
    async setClassTeacher(classId, teacherUid) {
      needAdmin();
      const cs = await getDoc(doc(db, "classes", classId));
      if (!cs.exists()) throw new Error("Class not found.");
      const oldUid = cs.data().teacherUid;
      let teacherName = "";
      if (teacherUid) { const t = await getDoc(doc(db, "profiles", teacherUid)); teacherName = t.exists() ? t.data().displayName : ""; }
      const batch = writeBatch(db);
      batch.update(doc(db, "classes", classId), { teacherUid: teacherUid || "", teacherName });
      if (oldUid && oldUid !== teacherUid) batch.update(doc(db, "profiles", oldUid), { classIds: arrayRemove(classId) });
      if (teacherUid) batch.update(doc(db, "profiles", teacherUid), { classIds: arrayUnion(classId) });
      await batch.commit();
    },
    async listTeachers() {
      const snap = await getDocs(query(collection(db, "profiles"), where("role", "==", "teacher")));
      return snap.docs.map(d => d.data()).map(p => ({ uid: p.uid, name: p.displayName, email: p.email, classIds: p.classIds || [] })).sort(byName);
    },
    // Creates the teacher's login with a SECOND temporary Firebase app so the administrator stays signed in.
    async createTeacher({ name, email, password }) {
      needAdmin();
      const sec = initializeApp(cfg, "teacher-create-" + Date.now());
      let uid, mail;
      try {
        const sAuth = getAuth(sec);
        const cred = await createUserWithEmailAndPassword(sAuth, String(email).trim(), password);
        uid = cred.user.uid; mail = cred.user.email;
        await fbSignOut(sAuth);
      } finally { await deleteApp(sec); }
      await setDoc(doc(db, "profiles", uid), {
        uid, email: mail, displayName: name.trim(), role: "teacher", status: "active", classIds: [], createdAt: serverTimestamp()
      });
    },

    async getAttendance(classId, date) {
      const snap = await getDocs(query(collection(db, "attendance"), where("classId", "==", classId), where("date", "==", date)));
      const out = {}; snap.docs.forEach(d => { out[d.data().studentUid] = d.data().status; }); return out;
    },
    async saveAttendance({ classId, date, records, students }) {
      const sid = {}; (students || []).forEach(s => { sid[s.uid] = s.studentId; });
      const entries = Object.entries(records);
      for (let i = 0; i < entries.length; i += CHUNK) {
        const batch = writeBatch(db);
        entries.slice(i, i + CHUNK).forEach(([studentUid, status]) => {
          batch.set(doc(db, "attendance", `${classId}_${date}_${studentUid}`), {
            classId, date, studentUid, studentId: sid[studentUid], status, markedBy: auth.currentUser.uid, markedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
    },
    async listAttendance({ classId, studentUid, from, date } = {}) {
      let q;
      if (studentUid) q = query(collection(db, "attendance"), where("studentUid", "==", studentUid), orderBy("date", "desc"), limit(400));
      else if (classId) q = query(collection(db, "attendance"), where("classId", "==", classId), where("date", ">=", from || "0000-00-00"), orderBy("date", "desc"), limit(1500));
      else if (date) q = query(collection(db, "attendance"), where("date", "==", date));
      else return [];
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data()).filter(r => !from || r.date >= from).map(r => ({
        classId: r.classId, date: r.date, studentUid: r.studentUid, studentId: r.studentId, status: r.status
      }));
    },

    async listAnnouncements() {
      const snap = await getDocs(query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(50)));
      return snap.docs.map(d => { const a = d.data(); return { id: d.id, title: a.title, body: a.body, date: tsIso(a.createdAt) }; });
    },
    async postAnnouncement({ title, body }) {
      needAdmin();
      await addDoc(collection(db, "announcements"), { title: title.trim(), body: body.trim(), authorUid: auth.currentUser.uid, createdAt: serverTimestamp() });
    }
  };
}
