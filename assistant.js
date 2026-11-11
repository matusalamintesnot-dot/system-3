/* Director data assistant (English + Amharic).
   Answers questions by CALCULATING from the school data the director is already allowed to see.
   Runs entirely in the browser: no question or student data is sent to any AI service. */
(function (root) {
  "use strict";
  const ETH = /[\u1200-\u137F]/;
  const pad = n => String(n).padStart(2, "0");
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); return isoDate(new Date(y, m - 1, d + n)); };
  const pct = (a, b) => (b ? Math.round(a / b * 1000) / 10 : null);
  const fmtPct = v => (v === null || v === undefined ? "—" : v + "%");
  const num = x => (Math.round(x * 1000) / 1000).toLocaleString("en-US");

  /* ---------- safe calculator (no eval) ---------- */
  function calc(raw) {
    const s = String(raw).replace(/×/g, "*").replace(/÷/g, "/").replace(/([\d)])\s*x\s*([\d(])/gi, "$1*$2").replace(/,/g, "").replace(/\s+/g, "");
    if (!/^[\d+\-*/().]+$/.test(s)) return null;
    const tk = s.match(/\d+\.?\d*|\.\d+|[+\-*/()]/g);
    if (!tk || tk.join("") !== s) return null;
    let i = 0;
    const expr = () => { let v = term(); while (tk[i] === "+" || tk[i] === "-") { const o = tk[i++], r = term(); v = o === "+" ? v + r : v - r; } return v; };
    const term = () => { let v = factor(); while (tk[i] === "*" || tk[i] === "/") { const o = tk[i++], r = factor(); if (o === "/" && r === 0) throw new Error("div0"); v = o === "*" ? v * r : v / r; } return v; };
    const factor = () => {
      const x = tk[i++];
      if (x === "-") return -factor();
      if (x === "+") return factor();
      if (x === "(") { const v = expr(); if (tk[i++] !== ")") throw new Error("paren"); return v; }
      if (x === undefined || isNaN(Number(x))) throw new Error("syntax");
      return Number(x);
    };
    try { const v = expr(); return i === tk.length && isFinite(v) ? v : null; } catch { return null; }
  }

  /* ---------- data helpers ---------- */
  const scopeStudents = (snap, ids) => (ids ? snap.students.filter(s => ids.includes(s.classId)) : snap.students);
  function dayCounts(snap, date, ids) {
    const st = scopeStudents(snap, ids), map = new Map();
    snap.att.forEach(r => { if (r.date === date) map.set(r.studentUid, r.status); });
    const c = { total: st.length, present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 };
    st.forEach(s => { const v = map.get(s.uid); if (v && c[v] !== undefined) c[v]++; else c.unmarked++; });
    c.marked = c.total - c.unmarked;
    c.rate = pct(c.present + c.late, c.marked);
    return c;
  }
  function rangeCounts(snap, from, to, ids) {
    const set = new Set(scopeStudents(snap, ids).map(s => s.uid));
    const c = { present: 0, late: 0, absent: 0, excused: 0, records: 0 };
    snap.att.forEach(r => { if (r.date >= from && r.date <= to && set.has(r.studentUid) && c[r.status] !== undefined) { c[r.status]++; c.records++; } });
    c.rate = pct(c.present + c.late, c.records);
    return c;
  }
  const latestDate = (snap, ids, upTo) => {
    const set = new Set(scopeStudents(snap, ids).map(s => s.uid));
    return snap.att.filter(r => set.has(r.studentUid) && r.date <= upTo).map(r => r.date).sort().pop() || null;
  };
  const classIdsOf = (snap, ids) => (ids ? snap.classes.filter(c => ids.includes(c.id)) : snap.classes);

  function findScope(t, snap) {
    let g = null, s = null, m = t.match(/(?:grade|class|ክፍል)\s*[-:]?\s*(\d{1,2})(?:\s*-?\s*section\s*([a-z])\b|\s*-\s*([a-z])\b|([a-z])\b|\s+([a-d])(?=\s*(?:$|[?.,!]|today|yesterday|this|last|section|ዛሬ|ትናንት)))?/);
    if (m) { g = +m[1]; s = m[2] || m[3] || m[4] || m[5] || null; }
    else if ((m = t.match(/\b(9|10|11|12)\s*-?\s*([a-d])\b/))) { g = +m[1]; s = m[2]; }
    if (g === null) return { ids: null, label: "" };
    const hit = snap.classes.filter(c => c.grade === g && (!s || String(c.section).toLowerCase() === s));
    return { ids: hit.map(c => c.id), label: s ? `Grade ${g} - Section ${s.toUpperCase()}` : `Grade ${g}`, empty: !hit.length };
  }
  function findPeriod(t, today) {
    let m = t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (m) return { kind: "day", date: m[1], key: m[1] };
    if (/yesterday|ትናንት|ትላንት/.test(t)) return { kind: "day", date: addDays(today, -1), key: "yesterday" };
    if (/\btoday\b|ዛሬ|\bnow\b|tonight/.test(t)) return { kind: "day", date: today, key: "today" };
    if ((m = t.match(/(?:last|past|previous)\s+(\d{1,3})\s+days?/))) return { kind: "range", n: Math.min(+m[1], 30), key: "range" };
    if (/week|ሳምንት/.test(t)) return { kind: "range", n: 7, key: "week" };
    if (/month|ወር/.test(t)) return { kind: "range", n: 30, key: "month" };
    return null;
  }

  const K = {
    help: /\bhelp\b|what can you|what do you do|how do (i|you) use|ምን ማድረግ|እገዛ|ምን ትችላለህ|ምን ትችላለሽ/,
    gender: /\b(boys?|girls?|male|female|gender|men|women)\b|ወንድ|ሴት/,
    summary: /summary|overview|brief|\breport\b|daily report|how('?s| is) (the )?school|ማጠቃለያ|ሪፖርት|አጠቃላይ/,
    pending: /pending|application|applicant|ማመልከቻ|አመልካች|ያልተፈቀደ/,
    teachers: /teachers?\b|homeroom|መምህ/,
    unmarked: /(not|n't|yet|without|missing|haven'?t|hasn'?t|didn'?t|never).{0,30}(taken|marked|record|submit|done|complete|enter)|unmarked|no attendance|ያልተመዘገበ|ያልያዙ|አልያዙ/,
    topAbsent: /most absen|frequent(ly)? absen|top absen|worst attendance|highest absen|repeat absen|ብዙ ጊዜ የቀሩ|በጣም የቀሩ/,
    compare: /\bbest\b|highest|lowest|worst|ranking|rank\b|compare|comparison|each class|by class|per class|every class|all classes|class by class|የትኛው ክፍል|ክፍሎች/,
    who: /\bwho\b|\blist\b|names?\b|which students|which student|show me|ማን|ማናቸው|ስሞች|ዝርዝር|የትኞቹ/,
    absent: /absent|absence|not present|isn'?t here|aren'?t here|didn'?t (come|attend)|ያልተገኙ|አልተገኙ|አልተገኘ|ያልመጡ|የቀሩ|ቀሩ|ቀረ|አለመገኘት/,
    late: /\blate\b|tardy|ዘግይ/,
    excused: /excus|በምክንያት/,
    present: /\bpresent\b|attended|\bcame\b|\bhere\b|ተገኝ|ተገኙ|መጡ|መጣ|የተገኙ/,
    attendance: /attendance|መገኘት/,
    rate: /\brate\b|percent|percentage|%|መጠን|መቶኛ/,
    howMany: /how many|number of|count|\btotal\b|ስንት|ብዛት|ቁጥር|ምን ያህል/,
    students: /students?|pupils?|ተማሪ/,
    classes: /classes|classrooms|ክፍሎች/
  };

  function answer(question, snap, opts) {
    opts = opts || {};
    const today = opts.today || isoDate(new Date());
    const q = String(question || "").trim();
    const am = ETH.test(q) || (opts.lang === "am" && !/[a-z]{3,}/i.test(q));
    const L = (en, a) => (am ? a : en);
    if (!q) return { text: L("Please type or say a question.", "እባክዎ ጥያቄ ይጻፉ ወይም ይናገሩ።") };
    const t = q.toLowerCase();
    const ST = { present: L("Present", "ተገኝቷል"), late: L("Late", "ዘግይቷል"), absent: L("Absent", "አልተገኘም"), excused: L("Excused", "በምክንያት ቀርቷል"), unmarked: L("Not yet marked", "ገና ያልተመዘገበ") };
    const whenLabel = p => (p.key === "today" ? L("today", "ዛሬ") : p.key === "yesterday" ? L("yesterday", "ትናንት") : L("on ", "በ") + p.date);
    const stuWord = n => (n === 1 ? L("student", "ተማሪ") : L("students", "ተማሪዎች"));

    /* ---- 1. calculator ---- */
    let m = t.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/);
    if (m) return { text: L(`${m[1]}% of ${m[2]} = ${num(+m[1] / 100 * +m[2])}`, `${m[2]} ውስጥ ${m[1]}% = ${num(+m[1] / 100 * +m[2])}`) };
    m = t.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/|of)\s*(\d+(?:\.\d+)?)/);
    if (m && /percent|percentage|%|መቶኛ/.test(t) && !K.attendance.test(t)) {
      if (+m[2] === 0) return { text: L("I can't divide by zero.", "በዜሮ ማካፈል አይቻልም።") };
      return { text: L(`${m[1]} out of ${m[2]} is ${num(+m[1] / +m[2] * 100)}%.`, `ከ${m[2]} ${m[1]} = ${num(+m[1] / +m[2] * 100)}%።`) };
    }
    const bare = t.replace(/^(please\s+)?(calculate|compute|what('?s| is)|how much is|ስንት ነው|አስላ)\s*/, "").replace(/[=?]+$/g, "").trim();
    if (/\/\s*0(?![\d.])/.test(bare) && /^[\d\s+\-*/().x×÷,]+$/.test(bare)) return { text: L("I can't divide by zero.", "በዜሮ ማካፈል አይቻልም።") };
    if (/^[\d\s+\-*/().x×÷,]+$/.test(bare) && /\d/.test(bare) && /[+\-*/×÷x]/.test(bare)) {
      const v = calc(bare);
      return v === null ? { text: L("I couldn't calculate that. Check the numbers and symbols (+ − × ÷).", "ማስላት አልቻልኩም። ቁጥሮቹን እና ምልክቶቹን ያረጋግጡ።") } : { text: `${bare.replace(/\s+/g, " ")} = ${num(v)}` };
    }

    const scope = findScope(t, snap), per = findPeriod(t, today);
    const scopeTxt = scope.label ? (am ? ` (${scope.label})` : ` in ${scope.label}`) : "";
    if (scope.empty) return { text: L(`There is no ${scope.label} class in the system.`, `${scope.label} የሚባል ክፍል በሲስተሙ ውስጥ የለም።`) };
    const ids = scope.ids;

    /* ---- 2. simple topics ---- */
    if (K.help.test(t)) return { text: L("I'm your data assistant. I calculate from the school's live records. Try:", "እኔ የመረጃ ረዳትዎ ነኝ። ከትምህርት ቤቱ መዝገብ በቀጥታ አስላለሁ። ይሞክሩ፦"), lines: [
      L("How many students are there?", "ስንት ተማሪዎች አሉ?"), L("How many students are present today?", "ዛሬ ስንት ተማሪዎች ተገኝተዋል?"), L("Who is absent today in grade 10?", "ዛሬ በክፍል 10 ማን አልተገኘም?"),
      L("Attendance rate by class this week", "በዚህ ሳምንት የክፍል መገኘት መጠን"), L("Which classes have not taken attendance?", "የትኞቹ ክፍሎች መገኘት አልያዙም?"), L("Who is most absent this month?", "በዚህ ወር ብዙ ጊዜ የቀሩ ተማሪዎች?"),
      L("Pending applications", "በመጠባበቅ ላይ ያሉ ማመልከቻዎች"), L("Daily summary", "ዕለታዊ ማጠቃለያ"), L("Calculate 45 + 30, or 12 out of 40 as a percent", "አስላ 45 + 30 ወይም 12 ከ40 በመቶኛ")] };
    if (K.gender.test(t) && !K.attendance.test(t)) return { text: L("The system does not record student gender, so I can't count boys and girls.", "ሲስተሙ የተማሪ ጾታን አይመዘግብም፤ ስለዚህ ወንዶችንና ሴቶችን መቁጠር አልችልም።") };

    /* ---- 3. summary ---- */
    if (K.summary.test(t)) {
      const day = per && per.kind === "day" ? per.date : today;
      const c = dayCounts(snap, day, ids), cls = classIdsOf(snap, ids);
      const done = cls.filter(x => snap.att.some(r => r.classId === x.id && r.date === day)).length;
      const wk = rangeCounts(snap, addDays(day, -6), day, ids), pend = snap.reqs.filter(r => r.status === "pending").length;
      const lines = [L(`Total students: ${c.total} in ${cls.length} classes`, `ጠቅላላ ተማሪዎች፦ ${c.total} በ${cls.length} ክፍሎች`), L(`Attendance taken by ${done} of ${cls.length} classes`, `መገኘት የያዙ ክፍሎች፦ ${done} ከ${cls.length}`)];
      ["present", "late", "absent", "excused", "unmarked"].forEach(k => lines.push(`${ST[k]}: ${c[k]}`));
      lines.push(L(`Attendance rate: ${fmtPct(c.rate)} (7-day: ${fmtPct(wk.rate)})`, `የመገኘት መጠን፦ ${fmtPct(c.rate)} (የ7 ቀን፦ ${fmtPct(wk.rate)})`), L(`Pending applications: ${pend}`, `በመጠባበቅ ላይ ያሉ ማመልከቻዎች፦ ${pend}`));
      return { text: L(`Summary for ${day === today ? "today" : day}${scopeTxt}:`, `የ${day === today ? "ዛሬ" : day} ማጠቃለያ${scopeTxt}፦`), lines };
    }
    if (K.pending.test(t) && !K.attendance.test(t)) {
      const p = snap.reqs.filter(r => r.status === "pending");
      if (!p.length) return { text: L("There are no pending student applications.", "በመጠባበቅ ላይ ያለ የተማሪ ማመልከቻ የለም።") };
      return { text: L(`${p.length} student application${p.length === 1 ? " is" : "s are"} waiting for approval:`, `${p.length} የተማሪ ማመልከቻ ፈቃድ በመጠባበቅ ላይ ነው፦`), lines: p.slice(0, 30).map(r => `${r.name} — ${L("Grade", "ክፍል")} ${r.grade}${r.section}`) };
    }
    if (K.teachers.test(t) && !K.attendance.test(t) && !K.absent.test(t) && !K.present.test(t)) {
      if (ids && K.who.test(t)) {
        const cl = classIdsOf(snap, ids);
        return { text: L(`Homeroom teacher${cl.length === 1 ? "" : "s"}${scopeTxt}:`, `የክፍል መምህር${scopeTxt}፦`), lines: cl.map(c => `${c.name}: ${c.teacherName || L("not assigned", "አልተመደበም")}`) };
      }
      return { text: L(`There ${snap.teachers.length === 1 ? "is" : "are"} ${snap.teachers.length} teacher account${snap.teachers.length === 1 ? "" : "s"}.`, `${snap.teachers.length} የመምህር አካውንቶች አሉ።`), lines: snap.teachers.map(x => `${x.name} — ${(x.classIds || []).map(id => (snap.classes.find(c => c.id === id) || {}).name || id).join(", ") || L("no class yet", "ክፍል የለውም")}`) };
    }

    /* ---- 4. attendance topics ---- */
    if (K.unmarked.test(t)) {
      const day = per && per.kind === "day" ? per.date : today;
      const todo = classIdsOf(snap, ids).filter(c => !snap.att.some(r => r.classId === c.id && r.date === day));
      if (!todo.length) return { text: L(`All classes have taken attendance ${whenLabel(per || { key: "today", date: day })}.`, `ሁሉም ክፍሎች መገኘት ይዘዋል።`) };
      return { text: L(`${todo.length} class${todo.length === 1 ? " has" : "es have"} not taken attendance ${whenLabel(per || { key: "today", date: day })}:`, `${todo.length} ክፍሎች መገኘት አልያዙም፦`), lines: todo.map(c => `${c.name} — ${c.teacherName || L("no teacher", "መምህር የለም")}`) };
    }
    if (K.topAbsent.test(t)) {
      const n = per && per.kind === "range" ? per.n : 30, from = addDays(today, -(n - 1));
      const set = new Map(scopeStudents(snap, ids).map(s => [s.uid, s])), cnt = {};
      snap.att.forEach(r => { if (r.status === "absent" && r.date >= from && set.has(r.studentUid)) cnt[r.studentUid] = (cnt[r.studentUid] || 0) + 1; });
      const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 7);
      if (!top.length) return { text: L(`No absences were recorded in the last ${n} days${scopeTxt}.`, `ባለፉት ${n} ቀናት ውስጥ የቀረ ተማሪ አልተመዘገበም።`) };
      return { text: L(`Students with the most absences in the last ${n} days${scopeTxt}:`, `ባለፉት ${n} ቀናት ብዙ ጊዜ የቀሩ ተማሪዎች${scopeTxt}፦`), lines: top.map(([u, k]) => `${set.get(u).name} — ${k} ${L(k === 1 ? "absence" : "absences", "ቀን")}`) };
    }
    const statusKey = K.absent.test(t) ? "absent" : K.late.test(t) ? "late" : K.excused.test(t) ? "excused" : K.present.test(t) ? "present" : null;

    if (K.compare.test(t) && !K.who.test(t) && !(K.howMany.test(t) && K.students.test(t) && !K.rate.test(t) && !K.attendance.test(t))) {
      const cls = classIdsOf(snap, ids);
      if (per && per.kind === "range" || (!per && !statusKey) || (per && per.kind !== "day")) {
        const n = per && per.kind === "range" ? per.n : 7, from = addDays(today, -(n - 1));
        const rows = cls.map(c => { const r = rangeCounts(snap, from, today, [c.id]); return [c.name, r.records, r.absent, r.rate]; }).sort((a, b) => (b[3] ?? -1) - (a[3] ?? -1));
        return { text: L(`Attendance rate by class, last ${n} days (present + late ÷ recorded):`, `የክፍል መገኘት መጠን፣ ባለፉት ${n} ቀናት፦`), table: { head: [L("Class", "ክፍል"), L("Records", "መዝገቦች"), ST.absent, L("Rate", "መጠን")], rows: rows.map(r => [r[0], r[1], r[2], fmtPct(r[3])]) } };
      }
      const day = per && per.kind === "day" ? per.date : today;
      const rows = cls.map(c => { const k = dayCounts(snap, day, [c.id]); return [c.name, k.total, k.present, k.late, k.absent, k.excused, k.unmarked, fmtPct(k.rate)]; });
      return { text: L(`Attendance by class ${whenLabel({ key: day === today ? "today" : day, date: day })}:`, `የክፍል መገኘት ${day === today ? "ዛሬ" : day}፦`), table: { head: [L("Class", "ክፍል"), L("Students", "ተማሪዎች"), ST.present, ST.late, ST.absent, ST.excused, ST.unmarked, L("Rate", "መጠን")], rows } };
    }

    if (K.who.test(t) && (statusKey || K.attendance.test(t))) {
      const key = statusKey || "absent";
      let day = per && per.kind === "day" ? per.date : today;
      if (!(per && per.kind === "day") && dayCounts(snap, day, ids).marked === 0) { const ld = latestDate(snap, ids, today); if (ld) day = ld; }
      const set = new Map(scopeStudents(snap, ids).map(s => [s.uid, s])), names = [];
      snap.att.forEach(r => { if (r.date === day && r.status === key && set.has(r.studentUid)) { const s = set.get(r.studentUid), c = snap.classes.find(x => x.id === s.classId); names.push(`${s.name} — ${c ? c.name : ""}`); } });
      names.sort();
      const dl = day === today ? L("today", "ዛሬ") : day;
      if (!names.length) return { text: L(`No student is marked ${ST[key].toLowerCase()} ${dl}${scopeTxt}.`, `${dl}${scopeTxt} ${ST[key]} የተመዘገበ ተማሪ የለም።`) };
      return { text: L(`${names.length} ${stuWord(names.length)} marked ${ST[key].toLowerCase()} ${dl}${scopeTxt}:`, `${dl}${scopeTxt} ${ST[key]} የተመዘገቡ ${names.length} ተማሪዎች፦`), lines: names.slice(0, 60) };
    }

    if (K.rate.test(t)) {
      if (per && per.kind === "range") {
        const r = rangeCounts(snap, addDays(today, -(per.n - 1)), today, ids);
        if (!r.records) return { text: L(`No attendance was recorded in the last ${per.n} days${scopeTxt}.`, `ባለፉት ${per.n} ቀናት ምንም መገኘት አልተመዘገበም።`) };
        return { text: L(`Attendance rate for the last ${per.n} days${scopeTxt}: ${fmtPct(r.rate)}`, `ባለፉት ${per.n} ቀናት${scopeTxt} የመገኘት መጠን፦ ${fmtPct(r.rate)}`), lines: [L(`${r.present + r.late} attended (${r.present} present + ${r.late} late) out of ${r.records} records`, `ከ${r.records} መዝገቦች ${r.present + r.late} ተገኝተዋል`), `${ST.absent}: ${r.absent}`, `${ST.excused}: ${r.excused}`] };
      }
      let day = per ? per.date : today, c = dayCounts(snap, day, ids), note = "";
      if (!per && c.marked === 0) { const ld = latestDate(snap, ids, today); if (ld) { day = ld; c = dayCounts(snap, day, ids); note = L(`No attendance recorded today yet. Latest recorded day: ${ld}.`, `ዛሬ ገና መገኘት አልተመዘገበም። የመጨረሻው የተመዘገበ ቀን፦ ${ld}።`); } }
      if (!c.marked) return { text: L(`No attendance has been recorded ${whenLabel(per || { key: "today", date: day })}${scopeTxt} yet.`, `ገና መገኘት አልተመዘገበም${scopeTxt}።`) };
      return { text: L(`Attendance rate ${day === today ? "today" : "on " + day}${scopeTxt}: ${fmtPct(c.rate)}`, `የመገኘት መጠን ${day === today ? "ዛሬ" : day}${scopeTxt}፦ ${fmtPct(c.rate)}`), lines: [L(`${c.present + c.late} attended out of ${c.marked} marked (${c.present} present + ${c.late} late)`, `ከ${c.marked} ተመዝጋቢዎች ${c.present + c.late} ተገኝተዋል`)].concat(note ? [note] : []) };
    }

    if (statusKey || K.attendance.test(t)) {
      if (per && per.kind === "range") {
        const r = rangeCounts(snap, addDays(today, -(per.n - 1)), today, ids);
        if (!r.records) return { text: L(`No attendance was recorded in the last ${per.n} days${scopeTxt}.`, `ባለፉት ${per.n} ቀናት ምንም መገኘት አልተመዘገበም።`) };
        const key = statusKey || "present";
        return { text: L(`In the last ${per.n} days${scopeTxt}: ${r[key]} ${ST[key].toLowerCase()} records out of ${r.records}.`, `ባለፉት ${per.n} ቀናት${scopeTxt}፦ ${ST[key]} ${r[key]} ከ${r.records} መዝገቦች።`), lines: ["present", "late", "absent", "excused"].map(k => `${ST[k]}: ${r[k]}`).concat([L(`Rate: ${fmtPct(r.rate)}`, `መጠን፦ ${fmtPct(r.rate)}`)]) };
      }
      let day = per ? per.date : today, c = dayCounts(snap, day, ids), note = "";
      if (!per && c.marked === 0) { const ld = latestDate(snap, ids, today); if (ld) { day = ld; c = dayCounts(snap, day, ids); note = L(`No attendance has been recorded today yet, so these are the figures for the latest recorded day (${ld}).`, `ዛሬ ገና መገኘት አልተመዘገበም፤ ስለዚህ የመጨረሻው የተመዘገበ ቀን (${ld}) ቁጥሮች ናቸው።`); } }
      const dl = day === today ? L("today", "ዛሬ") : per && per.key === "yesterday" ? L("yesterday", "ትናንት") : L("on ", "በ") + day;
      const be = day === today ? "are" : "were";
      if (!c.total) return { text: L(`There are no students${scopeTxt}.`, `ተማሪዎች የሉም።`) };
      if (!c.marked) return { text: L(`No attendance has been recorded ${dl}${scopeTxt} yet. There are ${c.total} students${scopeTxt}.`, `${dl} ገና መገኘት አልተመዘገበም። ተማሪዎች፦ ${c.total}።`) };
      const key = statusKey || "present";
      const lead = key === "present" && !statusKey ? "" : "";
      const text = key === "absent" ? L(`${c.absent} of ${c.total} students ${be} absent ${dl}${scopeTxt}.`, `${dl}${scopeTxt} ከ${c.total} ተማሪዎች ${c.absent} አልተገኙም።`)
        : key === "late" ? L(`${c.late} of ${c.total} students ${be} late ${dl}${scopeTxt}.`, `${dl}${scopeTxt} ከ${c.total} ተማሪዎች ${c.late} ዘግይተዋል።`)
        : key === "excused" ? L(`${c.excused} of ${c.total} students ${be} excused ${dl}${scopeTxt}.`, `${dl}${scopeTxt} ከ${c.total} ተማሪዎች ${c.excused} በምክንያት ቀርተዋል።`)
        : L(`${c.present} of ${c.total} students ${be} present ${dl}${scopeTxt}${c.late ? ` (plus ${c.late} late)` : ""}.`, `${dl}${scopeTxt} ከ${c.total} ተማሪዎች ${c.present} ተገኝተዋል${c.late ? ` (ሌሎች ${c.late} ዘግይተዋል)` : ""}።`);
      const out = { text: lead + text, lines: ["present", "late", "absent", "excused", "unmarked"].map(k => `${ST[k]}: ${c[k]}`).concat([L(`Attendance rate: ${fmtPct(c.rate)}`, `የመገኘት መጠን፦ ${fmtPct(c.rate)}`)]) };
      if (note) out.lines.push(note);
      if (!ids) { const cls = snap.classes; out.table = { head: [L("Class", "ክፍል"), L("Students", "ተማሪዎች"), ST.present, ST.late, ST.absent, ST.excused, ST.unmarked, L("Rate", "መጠን")], rows: cls.map(x => { const k = dayCounts(snap, day, [x.id]); return [x.name, k.total, k.present, k.late, k.absent, k.excused, k.unmarked, fmtPct(k.rate)]; }) }; }
      return out;
    }

    /* ---- 5. headcounts ---- */
    if (K.students.test(t) || K.howMany.test(t)) {
      if (K.classes.test(t) || (/class/.test(t) && K.howMany.test(t) && !K.students.test(t))) return { text: L(`There ${snap.classes.length === 1 ? "is" : "are"} ${snap.classes.length} class${snap.classes.length === 1 ? "" : "es"}.`, `${snap.classes.length} ክፍሎች አሉ።`), lines: snap.classes.map(c => `${c.name} — ${scopeStudents(snap, [c.id]).length} ${stuWord(scopeStudents(snap, [c.id]).length)} — ${c.teacherName || L("no teacher", "መምህር የለም")}`) };
      const st = scopeStudents(snap, ids);
      const out = { text: L(`There ${st.length === 1 ? "is" : "are"} ${st.length} active ${stuWord(st.length)}${scopeTxt}.`, `${scopeTxt} ${st.length} ንቁ ተማሪዎች አሉ።`.trim()) };
      if (!ids) {
        out.lines = [L(`${snap.classes.length} classes`, `${snap.classes.length} ክፍሎች`), L(`${snap.reqs.filter(r => r.status === "pending").length} applications pending approval`, `${snap.reqs.filter(r => r.status === "pending").length} ማመልከቻዎች በመጠባበቅ ላይ`)];
        out.table = { head: [L("Class", "ክፍል"), L("Students", "ተማሪዎች"), L("Homeroom teacher", "የክፍል መምህር")], rows: snap.classes.map(c => [c.name, scopeStudents(snap, [c.id]).length, c.teacherName || "—"]) };
      }
      return out;
    }
    if (K.classes.test(t)) return { text: L(`There are ${snap.classes.length} classes.`, `${snap.classes.length} ክፍሎች አሉ።`), lines: snap.classes.map(c => c.name) };

    return { unknown: true, text: L("I'm not sure I understood. I can count students, attendance and absences, calculate rates by class, list who is absent, and do simple math. Say “help” for examples.", "ጥያቄዎን በትክክል አልተረዳሁም። ተማሪዎችን፣ መገኘትንና መቅረትን መቁጠር፣ የክፍል መጠን ማስላት፣ ያልተገኙትን መዘርዘር እችላለሁ። ለምሳሌ “እገዛ” ይበሉ።") };
  }

  root.DirectorAssistant = { answer, calc, dayCounts, rangeCounts, addDays, fmtPct };
  if (typeof module !== "undefined") module.exports = root.DirectorAssistant;
})(typeof window !== "undefined" ? window : globalThis);
