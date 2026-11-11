/* Demo data layer: everything lives in THIS browser only (localStorage).
   Uses the same interface as data-firebase.js so the app UI is identical.
   NOT secure and NOT shared between devices. Never enter real student data. */
(function () {
  const KEY = "edutrack_demo_db_v4";
  const CODES = { admin: "DSMS-ADMIN-2026", teacher: "DSMS-TEACHER-2026", student: "DSMS-STUDENT-2026" };
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());

  function seed() {
    const people = [
      ["s1001", "DSM-1001", "Abel Tesfaye", 10, "A", "C10A"],
      ["s1002", "DSM-1002", "Hana Bekele", 10, "A", "C10A"],
      ["s1003", "DSM-1003", "Dawit Alemu", 10, "A", "C10A"],
      ["s1004", "DSM-1004", "Meron Girma", 10, "A", "C10A"],
      ["s1005", "DSM-1005", "Samuel Tadesse", 10, "A", "C10A"],
      ["s1006", "DSM-1006", "Rahel Worku", 9, "B", "C9B"],
      ["s1007", "DSM-1007", "Bethlehem Haile", 10, "B", "C10B"],
      ["s1008", "DSM-1008", "Kaleb Mulugeta", 10, "B", "C10B"]
    ];
    const profiles = {
      admin1: { uid: "admin1", email: "admin@demo.invalid", displayName: "School Administrator", role: "admin", status: "active" },
      t1: { uid: "t1", email: "daniel@demo.invalid", displayName: "Mr. Daniel", role: "teacher", status: "active", classIds: ["C10A", "C9B"] },
      t2: { uid: "t2", email: "selam@demo.invalid", displayName: "Ms. Selam", role: "teacher", status: "active", classIds: ["C10B"] }
    };
    people.forEach(([uid, studentId, name, grade, section, classId]) => {
      profiles[uid] = { uid, email: uid + "@demo.invalid", displayName: name, role: "student", status: "active", studentId, grade, section, classId };
    });
    const requests = {};
    [["r1", "Mekdes Fikru", 9, "A", "Fikru Bekele"], ["r2", "Yonatan Kassa", 10, "B", "Kassa T."]].forEach(([uid, name, grade, section, guardian]) => {
      profiles[uid] = { uid, email: uid + "@demo.invalid", displayName: name, role: "student", status: "pending" };
      requests[uid] = { uid, name, grade, section, guardian, phone: "", status: "pending", date: today() };
    });
    // Sample attendance: the last 6 days for every class, and today for two of the three classes
    // (Grade 10 - Section B is left "not yet marked" so the director assistant has something to find).
    const attendance = {};
    const stu = people.map(([uid, studentId, , , , classId], i) => ({ uid, studentId, classId, i }));
    for (let back = 0; back <= 6; back++) {
      const d = new Date(); d.setDate(d.getDate() - back); const date = iso(d);
      stu.forEach(s => {
        if (back === 0 && s.classId === "C10B") return;
        const h = (s.i * 7 + back * 3) % 17;
        const status = h === 0 || (back === 0 && s.i === 1) ? "absent" : h === 5 ? "late" : h === 11 ? "excused" : "present";
        attendance[`${s.classId}_${date}_${s.uid}`] = { classId: s.classId, date, studentUid: s.uid, studentId: s.studentId, status, markedBy: "t1" };
      });
    }
    return {
      profiles, requests,
      classes: {
        C10A: { id: "C10A", name: "Grade 10 - Section A", grade: 10, section: "A", teacherUid: "t1", teacherName: "Mr. Daniel" },
        C10B: { id: "C10B", name: "Grade 10 - Section B", grade: 10, section: "B", teacherUid: "t2", teacherName: "Ms. Selam" },
        C9B: { id: "C9B", name: "Grade 9 - Section B", grade: 9, section: "B", teacherUid: "t1", teacherName: "Mr. Daniel" }
      },
      attendance,
      announcements: [
        { id: "a1", title: "Welcome to the new school term", body: "Welcome students and teachers. Please check your school information and keep your profiles updated.", date: today() },
        { id: "a2", title: "Daily attendance reminder", body: "Homeroom teachers should complete attendance every school day.", date: today() }
      ],
      nextStudent: 1009
    };
  }

  window.createDemoStore = function () {
    let db;
    try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { db = seed(); }
    const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
    let listener = null, uid = null;
    const toMe = p => p && ({ uid: p.uid, email: p.email, name: p.displayName, role: p.role, status: p.status, classId: p.classId, classIds: p.classIds || [], studentId: p.studentId, grade: p.grade, section: p.section });
    const emit = () => listener && listener(uid && db.profiles[uid] ? toMe(db.profiles[uid]) : null);
    const need = (cond, msg) => { if (!cond) throw new Error(msg); };
    const meP = () => db.profiles[uid];
    const toStudent = p => ({ uid: p.uid, studentId: p.studentId, name: p.displayName, grade: p.grade, section: p.section, classId: p.classId, status: p.status });

    return {
      mode: "demo",
      onAuthChange(cb) { listener = cb; emit(); },
      async signIn({ role, code }) {
        need(CODES[role] && String(code || "").trim().toUpperCase() === CODES[role], "That access code does not match the selected portal.");
        uid = { admin: "admin1", teacher: "t1", student: "s1001" }[role];
        emit();
      },
      async signUp({ name, grade, section, guardian, phone }) {
        const id = "n" + Date.now();
        db.profiles[id] = { uid: id, email: id + "@demo.invalid", displayName: name, role: "student", status: "pending" };
        db.requests[id] = { uid: id, name, grade: Number(grade), section, guardian, phone, status: "pending", date: today() };
        persist(); uid = id; emit();
      },
      async signOut() { uid = null; emit(); },
      async resetPassword() { throw new Error("Password reset is only available in live mode."); },
      async refreshMe() { emit(); },
      async getMyRequest() { return db.requests[uid] ? { ...db.requests[uid] } : null; },

      async listStudents({ classId } = {}) {
        return Object.values(db.profiles).filter(p => p.role === "student" && p.status === "active" && (!classId || p.classId === classId))
          .map(toStudent).sort((a, b) => a.name.localeCompare(b.name));
      },
      async listRequests() { return Object.values(db.requests).sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(r => ({ ...r })); },
      async approveRequest(ruid, classId) {
        need(meP()?.role === "admin", "Administrator access required.");
        const r = db.requests[ruid]; need(r && r.status === "pending", "This application is no longer pending.");
        need(db.classes[classId], "Choose a class first.");
        const studentId = "DSM-" + db.nextStudent++;
        Object.assign(db.profiles[ruid], { status: "active", studentId, classId, grade: r.grade, section: r.section });
        Object.assign(r, { status: "approved", studentId, classId });
        persist();
      },
      async rejectRequest(ruid) {
        need(meP()?.role === "admin", "Administrator access required.");
        const r = db.requests[ruid]; need(r && r.status === "pending", "This application is no longer pending.");
        r.status = "rejected"; persist();
      },

      async listClasses() { return Object.values(db.classes).map(c => ({ ...c })).sort((a, b) => a.name.localeCompare(b.name)); },
      async createClass({ name, grade, section, teacherUid }) {
        need(meP()?.role === "admin", "Administrator access required.");
        let id = ("C" + grade + section).replace(/[^A-Za-z0-9]/g, "").toUpperCase(); need(!db.classes[id], "A class with that grade and section already exists.");
        const t = db.profiles[teacherUid];
        db.classes[id] = { id, name, grade: Number(grade), section, teacherUid: teacherUid || "", teacherName: t ? t.displayName : "" };
        if (t) t.classIds = [...new Set([...(t.classIds || []), id])];
        persist();
      },
      async setClassTeacher(classId, teacherUid) {
        need(meP()?.role === "admin", "Administrator access required.");
        const c = db.classes[classId]; need(c, "Class not found.");
        const old = db.profiles[c.teacherUid], t = db.profiles[teacherUid];
        if (old) old.classIds = (old.classIds || []).filter(x => x !== classId);
        if (t) t.classIds = [...new Set([...(t.classIds || []), classId])];
        c.teacherUid = teacherUid || ""; c.teacherName = t ? t.displayName : ""; persist();
      },
      async listTeachers() {
        return Object.values(db.profiles).filter(p => p.role === "teacher").map(p => ({ uid: p.uid, name: p.displayName, email: p.email, classIds: p.classIds || [] }));
      },
      async createTeacher({ name, email }) {
        need(meP()?.role === "admin", "Administrator access required.");
        const id = "t" + Date.now();
        db.profiles[id] = { uid: id, email, displayName: name, role: "teacher", status: "active", classIds: [] }; persist();
      },

      async getAttendance(classId, date) {
        const out = {};
        Object.values(db.attendance).forEach(r => { if (r.classId === classId && r.date === date) out[r.studentUid] = r.status; });
        return out;
      },
      async saveAttendance({ classId, date, records }) {
        const me = meP(); need(me?.role === "teacher" && (me.classIds || []).includes(classId), "Only the assigned homeroom teacher can submit attendance.");
        need(date <= today(), "Attendance cannot be recorded for a future date.");
        Object.entries(records).forEach(([suid, status]) => {
          const s = db.profiles[suid]; need(s && s.classId === classId, "Student is not in this class.");
          db.attendance[`${classId}_${date}_${suid}`] = { classId, date, studentUid: suid, studentId: s.studentId, status, markedBy: uid };
        });
        persist();
      },
      async listAttendance({ classId, studentUid, from, date } = {}) {
        return Object.values(db.attendance).filter(r =>
          (!classId || r.classId === classId) && (!studentUid || r.studentUid === studentUid) && (!from || r.date >= from) && (!date || r.date === date)
        ).sort((a, b) => b.date.localeCompare(a.date)).map(r => ({ ...r }));
      },

      async listAnnouncements() { return [...db.announcements].map(a => ({ ...a })); },
      async postAnnouncement({ title, body }) {
        need(meP()?.role === "admin", "Administrator access required.");
        db.announcements.unshift({ id: "a" + Date.now(), title, body, date: today() }); persist();
      },
      resetDemo() { db = seed(); persist(); }
    };
  };
})();
