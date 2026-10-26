"""Cleans the 6 hospital Excel files into one fast, static data/doctors.json.
Run:  python tools/build_data.py"""
import re, json, glob, os
import pandas as pd
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOSP = [  # key, file prefix, Bangla, English, short Bangla, short English, map query
 ("tmss","tmc_rch","টিএমএসএস মেডিকেল কলেজ ও রফাতুল্লাহ কমিউনিটি হাসপাতাল","TMSS Medical College & Rafatullah Community Hospital","টিএমএসএস / রফাতুল্লাহ","TMSS / Rafatullah","TMSS Medical College Rafatullah Hospital Bogura"),
 ("ibn","ibn_sina","ইবনে সিনা ডায়াগনস্টিক ও কনসালটেশন সেন্টার","Ibn Sina Diagnostic & Consultation Center","ইবনে সিনা","Ibn Sina","Ibn Sina Diagnostic Bogura"),
 ("pop","popular","পপুলার ডায়াগনস্টিক সেন্টার","Popular Diagnostic Centre","পপুলার","Popular","Popular Diagnostic Centre Bogura"),
 ("hc","health_city","হেলথ সিটি বগুড়া","Health City Bogura","হেলথ সিটি","Health City","Health City Bogura"),
 ("saic","saic","সাইক জেনারেল হাসপাতাল","SAIC General Hospital","সাইক","SAIC","SAIC General Hospital Bogura")]
CATS = [  # key, Bangla, English, icon, regex (first match wins)
 ("dent","দাঁতের চিকিৎসা","Dental","🦷",r"dent|orthodont|prosthodont|endodont|periodont|maxillofacial|\boral\b"),
 ("onc","ক্যান্সার","Cancer","🎗️",r"oncolog|cancer"),
 ("heart","হৃদরোগ","Heart","❤️",r"cardi"),
 ("gyn","স্ত্রীরোগ ও প্রসূতি","Women / Gynae","🤰",r"gyn|obs|infertil|reproductive"),
 ("child","শিশু রোগ","Child","👶",r"pediatric|paediatric|child|neonat|newborn|new born"),
 ("ent","নাক-কান-গলা","Ear Nose Throat","👂",r"\bent\b|otorhino|nose|\bear\b"),
 ("eye","চক্ষু","Eye","👁️",r"\beye\b|ophthal|retina"),
 ("skin","চর্ম রোগ","Skin","🧴",r"skin|derma|venere|\bvd\b"),
 ("kid","কিডনি","Kidney","🫘",r"nephro|kidney"),
 ("uro","মূত্রথলি / ইউরোলজি","Urology","💧",r"urolog"),
 ("neuro","স্নায়ু ও মস্তিষ্ক","Brain & Nerve","🧠",r"neuro|brain|nerve"),
 ("bone","হাড় ও জয়েন্ট","Bone & Joint","🦴",r"ortho|trauma|bone|rheumat|physical medicine|rehabilit"),
 ("psy","মানসিক রোগ","Mental Health","💭",r"psychiat"),
 ("liver","লিভার ও পেট","Liver & Stomach","🫃",r"gastro|liver|hepat"),
 ("chest","বুকের রোগ","Chest & Lungs","🫁",r"chest|respirat"),
 ("diab","ডায়াবেটিস ও হরমোন","Diabetes & Hormone","🍬",r"diabet|endocrin|thyroid|hormone"),
 ("blood","রক্তরোগ","Blood","🩸",r"h?a?emat"),
 ("surg","সার্জারি","Surgery","✂️",r"surg"),
 ("med","মেডিসিন","General Medicine","🩺",r"medicine|physician"),
 ("other","অন্যান্য","Other","➕",r".")]
DAY = ["sat","sun","mon","tue","wed","thu","fri"]
DTOK = re.compile(r"\b(sat|sun|mon(?!th)|tue|tus|wed|thu|fri)[a-z]*|(-)", re.I)
T = re.compile(r"(\d{1,2})(?:[:.](\d{2}))?\s*([ap]m)\s*(?:-|to)\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap]m)", re.I)
def idx(w): w = w.lower(); return 3 if w == "tus" else DAY.index(w)
def days_of(s):
    s = str(s)
    if re.search(r"ever\w*\s*day", s, re.I): return list(range(7))
    out, rng = [], False
    for w, dash in DTOK.findall(s):
        if dash: rng = bool(out); continue
        i = idx(w)
        if rng:
            a = out[-1]
            while a != i: a = (a + 1) % 7; out.append(a)
            rng = False
        else: out.append(i)
    return sorted(set(out))
def groups(s):
    p = [x.strip() for x in re.split(r"(?:^|\s)\(?[a-d][.)]\s*", " " + str(s).strip()) if x.strip()]
    return p or [""]
def f(h, m, ap): return f"{int(h)}:{m or '00'} {ap.upper()}"
def times_of(s): return [f"{f(*m[:3])} – {f(*m[3:])}" for m in T.findall(s)]
def clean(s): return re.sub(r"\s+", " ", str(s)).strip()
def cat_of(s):
    for k, *_r, rx in CATS:
        if re.search(rx, s, re.I): return k
def schedule(days, time):
    dg, tg = groups(days), groups(time)
    if len(dg) != len(tg): dg, tg = [str(days)], [str(time)]
    out = []
    for dd, tt in zip(dg, tg):
        d = days_of(dd) or days_of(tt); ts = times_of(tt)
        # several day-specific time ranges in one text (Ibn Sina style) -> show original text, never guess
        mixed = len(ts) > 1 and len(tg) == 1 and bool(re.search(r"(sat|sun|mon|tue|wed|thu|fri)[a-z]*\s*[-:]", tt, re.I))
        raw = (not ts) or "month" in tt.lower() or mixed
        out.append({"d": d, "t": clean(tt) if raw else " & ".join(ts)})
    return out
docs = []
for key, pre, *_ in HOSP:
    for fn in sorted(glob.glob(f"{ROOT}/tools/Doctors/{pre}*.xlsx")):
        df = pd.read_excel(fn).fillna("")
        for _, r in df.iterrows():
            n = clean(r.iloc[0]); sp = clean(r.iloc[2])
            if not n: continue
            sp = sp if len(sp) < 70 else sp[:67].rsplit(" ", 1)[0] + "…"
            link = str(r.get("Profile Link", "")).strip()
            docs.append({"n": n, "s": sp, "c": cat_of(sp), "h": key, "sc": schedule(r.iloc[3], r.iloc[4]),
                         "l": link if link.startswith("https://") else ""})
out = {"cats": [dict(k=k, bn=b, en=e, i=i) for k, b, e, i, _ in CATS],
       "hosp": [dict(k=k, bn=b, en=e, sb=sb, se=se, q=q) for k, _, b, e, sb, se, q in HOSP],
       "docs": docs}
json.dump(out, open(f"{ROOT}/data/doctors.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(docs), "doctors | other:", sum(d["c"] == "other" for d in docs), "| no-days:", sum(not all(s["d"] for s in d["sc"]) for d in docs), "| raw-time:", sum(any("–" not in s["t"] for s in d["sc"]) for d in docs))
