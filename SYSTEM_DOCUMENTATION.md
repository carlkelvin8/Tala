# TALA — NSTP Management System
## Kumpletong Dokumentasyon ng Sistema

> **Para sa mga estudyante at kliyente:** Ang dokumentong ito ay nagpapaliwanag ng kung paano gumagana ang buong sistema — ang lahat ng proseso, panuntunan, daloy, at lohika ng bawat feature. Hindi ito teknikal na gabay para sa mga developer, kundi isang malinaw at kumpleto na paliwanag ng kung ano ang ginagawa ng sistema, bakit, at sino ang makaka-access ng ano.

---

## Talaan ng Nilalaman

1. [Pangkalahatang-ideya ng Sistema](#1-pangkalahatang-ideya-ng-sistema)
2. [Mga Uri ng Gumagamit at Access Matrix](#2-mga-uri-ng-gumagamit-at-access-matrix)
3. [Seguridad ng Sistema](#3-seguridad-ng-sistema)
4. [Login, Logout, at Password Reset](#4-login-logout-at-password-reset)
5. [Enrollment — Pagsali sa NSTP](#5-enrollment--pagsali-sa-nstp)
6. [Sections, Flights, at Courses](#6-sections-flights-at-courses)
7. [Attendance — Pagpapatunay ng Presensya](#7-attendance--pagpapatunay-ng-presensya)
8. [Training Monitoring — Pagsunod sa Kinakailangang Training Days](#8-training-monitoring--pagsunod-sa-kinakailangang-training-days)
9. [Live Monitor — Real-time na Pagmamatyag](#9-live-monitor--real-time-na-pagmamatyag)
10. [Grading System — Sistema ng Grado](#10-grading-system--sistema-ng-grado)
11. [Merit at Demerit System](#11-merit-at-demerit-system)
12. [Leaderboard — Ranggo ng mga Estudyante](#12-leaderboard--ranggo-ng-mga-estudyante)
13. [Exams — Online na Pagsusulit](#13-exams--online-na-pagsusulit)
14. [Learning Materials — Mga Kagamitan sa Pag-aaral](#14-learning-materials--mga-kagamitan-sa-pag-aaral)
15. [Medical Certificates at Document Submissions](#15-medical-certificates-at-document-submissions)
16. [Instructor Remarks — Mga Komento ng Guro](#16-instructor-remarks--mga-komento-ng-guro)
17. [Notifications — Mga Abiso](#17-notifications--mga-abiso)
18. [Calendar — Kalendaryo ng mga Session](#18-calendar--kalendaryo-ng-mga-session)
19. [Dashboard — Pangkalahatang Larawan](#19-dashboard--pangkalahatang-larawan)
20. [Reports at Exports](#20-reports-at-exports)
21. [Profile at Avatar](#21-profile-at-avatar)
22. [Academic Terms — Akademikong Termino](#22-academic-terms--akademikong-termino)
23. [User Management — Pamamahala ng mga Gumagamit](#23-user-management--pamamahala-ng-mga-gumagamit)
24. [Audit Logs — Talaan ng mga Aksyon](#24-audit-logs--talaan-ng-mga-aksyon)
25. [Mga Limitasyon, Patakaran, at Mahalagang Panuntunan](#25-mga-limitasyon-patakaran-at-mahalagang-panuntunan)

---

## 1. Pangkalahatang-ideya ng Sistema

Ang **Tala** ay isang web-based na sistema para sa pamamahala ng **National Service Training Program (NSTP)**. Sinusuportahan nito ang dalawang uri ng programa:

| Program | Buong Pangalan |
|---|---|
| **CWTS** | Civic Welfare Training Service |
| **ROTC** | Reserved Officers' Training Corps |

Ang sistema ay nagbibigay ng isang pinag-isang lugar para sa lahat ng pangangailangan ng NSTP — mula sa pagpaparehistro, pagsubaybay ng presensya gamit ang GPS o QR code, paglagyan ng grado, paglikha ng online na pagsusulit, hanggang sa pag-abot ng mga materyales sa pag-aaral — na may built-in na seguridad at privacy para sa lahat ng gumagamit.

### Mataas na Antas na Daloy

```
Estudyante → Nagpaparehistro → Enrollment PENDING
     ↓
Admin/Implementor → Inaprubahan → Inilaan sa Section at Flight
     ↓
Sistema → Nag-iingat ng Attendance, Grado, Merit, Exams, Materyales
     ↓
Lahat ng Gumagamit → Nakakakita lamang ng datos na para sa kanila
```

---

## 2. Mga Uri ng Gumagamit at Access Matrix

May **apat na uri ng gumagamit** (roles) sa sistema. Ang bawat isa ay may partikular na mga pahintulot.

### Buod ng mga Role

| Feature | ADMIN | IMPLEMENTOR | CADET OFFICER | STUDENT |
|---|---|---|---|---|
| Dashboard | ✅ (CWTS + ROTC) | ✅ (ROTC only) | ✅ | ✅ (sarili) |
| Enrollment management | ✅ | ✅ (ROTC only) | ❌ | ❌ |
| Students page | ✅ | ✅ (ROTC only) | ❌ | ❌ |
| Courses (CWTS) | ✅ | ❌ | ❌ | ❌ |
| Courses (ROTC) | ✅ | ✅ | ❌ | ❌ |
| Sections | ✅ | ✅ | ❌ | ❌ |
| Flights | ✅ | ❌ | ✅ | ❌ |
| Attendance (tingnan) | ✅ | ✅ (ROTC) | ✅ (sariling section) | ✅ (sarili) |
| QR Scanner | ❌ | ✅ | ❌ | ❌ |
| Training Monitoring | ✅ | ✅ | ❌ | ❌ |
| Live Monitor | ✅ | ✅ | ✅ | ❌ |
| Grades (i-encode) | ✅ | ✅ | ❌ | ❌ |
| Grades (tingnan) | ✅ | ✅ | ❌ | ✅ (sarili) |
| Merits (i-encode) | ✅ | ❌ | ❌ | ❌ |
| Merits (tingnan) | ✅ | ❌ | ❌ | ✅ (sarili/section) |
| Exams (gumawa) | ✅ | ✅ | ❌ | ❌ |
| Exams (sumagot) | ❌ | ❌ | ❌ | ✅ |
| Materials | ✅ | ✅ | ✅ | ✅ (read only) |
| Medical Certs (i-review) | ❌ | ✅ | ❌ | ❌ |
| Medical Certs (mag-upload) | ❌ | ❌ | ❌ | ✅ |
| Document Submissions | ✅ | ✅ | ❌ | ✅ |
| Reports | ✅ | ✅ | ✅ | ❌ |
| Leaderboard | ✅ | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ | ✅ |
| Users management | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Terms management | ✅ | ✅ | ❌ | ❌ |
| Certificates | ✅ | ✅ | ❌ | ❌ |

### Detalye ng Bawat Role

#### ADMIN
- Pinakamataas na antas ng access — nakakakita at nakaka-manage ng **lahat** ng datos
- Nakaka-access ng parehong CWTS at ROTC na programa
- Ang tanging may kakayahang mag-manage ng mga gumagamit (lumikha, mag-edit, mag-disable)
- Nakaka-access ng audit logs para makita ang lahat ng aksyon sa sistema
- Maaaring mag-encode ng merits at demerits
- Makakakita ng cross-program statistics sa dashboard

#### IMPLEMENTOR
- Katulad ng Admin ngunit **naka-lock sa ROTC program lamang**
- **Hindi** makakakita ng datos ng CWTS na estudyante — kahit subukan, tinanggihan agad ng sistema
- Puwedeng mag-approve ng enrollment, mag-encode ng grado, mag-manage ng attendance sessions
- Ang tanging may kakayahang gamitin ang **QR Scanner** (para sa Implementor ang scanner page)
- Maaaring mag-review ng medical certificates
- Hindi maaaring lumikha ng bagong gumagamit o baguhin ang mga role

#### CADET OFFICER
- Mas mababang antas ng pamamahala sa loob ng isang section
- Nakakakita ng datos ng kanilang section (attendance, materials, live monitor)
- Maaaring mag-manage ng flights
- Maaaring makita ang mga reports
- **View-only** ang karamihan sa features — hindi maaaring mag-encode ng grado o mag-approve ng enrollment
- Nakakakita lang ng sariling remarks at attendance

#### STUDENT
- Pinakakaraniwang uri ng gumagamit
- Nakakakita lang ng **sariling datos** — walang ibang estudyanteng makikita
- Puwedeng mag-check in ng attendance (GPS-based), gumawa ng exam, mag-submit ng dokumento at medical certificate
- Makakakita ng leaderboard at calendar (pampublikong features)

### Mahalagang Patakaran: Read-Only Guard

Ang mga **Cadet Officer at Student** ay may "view-only" na katayuan sa karamihan ng mga resource. Kung susubukan nilang gumawa ng write operation (POST, PATCH, DELETE) sa mga resource na hindi nila pinapayagang baguhin, awtomatikong tinatanggihan ng sistema ang kahilingan nang may mensaheng "View-only access."

---

## 3. Seguridad ng Sistema

### Rate Limiting — Proteksyon laban sa Pag-atake

Ang sistema ay may built-in na limitasyon sa bilang ng kahilingan sa loob ng isang takdang panahon. Ito ay nagpoprotekta laban sa automated na pag-atake:

| Endpoint | Limitasyon | Window |
|---|---|---|
| Login | 10 pagtatangka | bawat 15 minuto (per email + IP) |
| Register | 30 pagtatangka | bawat isang oras (per IP) |
| Token Refresh | 30 pagtatangka | bawat 15 minuto (per IP) |
| QR Scan | 60 scans | bawat minuto (per user + IP) |
| Forgot Password | 10 pagtatangka | bawat 15 minuto (per email + IP) |
| Reset Password | 10 pagtatangka | bawat 15 minuto (per IP) |

Kapag naabot ang limitasyon, nagbabalik ang sistema ng mensahe na nagsasabing gaano katagal bago maaari ulit na subukan.

### Role-Based Access Control

Bawat route (daan) sa sistema ay may nakatalagang listahan ng mga role na maaari lamang mag-access nito. Kapag sinubukan ng isang gumagamit na ma-access ang isang route na hindi para sa kanila, awtomatikong tinatanggihan ito nang may 403 Forbidden na mensahe.

### Program Separation (CWTS vs ROTC)

Ang isa sa pinaka-kritikal na patakaran ng sistema:
- Ang **Implementor** ay makaka-access lamang ng datos ng ROTC program
- Hindi maaaring i-reassign ang isang estudyante mula sa isang program papunta sa isa pa
- Lahat ng grade, attendance, merit, materials, at iba pang datos ay **hiwalay** batay sa program

### JWT Authentication (Token-based Login)

Ang sistema ay gumagamit ng dalawang uri ng token:
- **Access Token** — Panandaliang token para makilala ang gumagamit sa bawat kahilingan
- **Refresh Token** — Pangmatagalang token para makakuha ng bagong access token

Ang bawat refresh token ay may **version number**. Kapag ginamit, ang version ay nagda-dagdag ng isa at ang lumang version ay hindi na gumagana. Ito ay nangangahulugang kahit naagaw ang isang refresh token, maging invalid na ito pagkatapos ng unang paggamit.

---

## 4. Login, Logout, at Password Reset

### Pagpaparehistro (Para sa Bagong Gumagamit)

1. Pumunta sa pahina ng pagpaparehistro
2. Punan ang email at password
3. Piliin ang NSTP program (CWTS o ROTC)
4. Mag-submit — ang account ay nalilikha

> Ang pagpaparehistro ay **hindi** awtomatikong nagbibigay ng access sa lahat ng features. Kailangan pa ring aprubahan ng Admin/Implementor ang enrollment.

### Login

1. Ilagay ang email at password
2. Ang sistema ay mag-verify:
   - Tama ba ang email at password?
   - Aktibo ba ang account (`isActive = true`)?
3. Kung tama lahat, nagbabalik ang sistema ng:
   - **Access Token** — para sa kasalukuyang session
   - **Refresh Token** — para ma-renew ang session nang hindi muling naglo-login
   - Impormasyon ng gumagamit (role, program, section, avatar)

### Logout

Kapag nag-logout ang gumagamit, ang kanyang **refresh token version** ay nadadagdagan ng isa sa database. Ibig sabihin:
- Lahat ng dating inilabas na refresh token para sa account na iyon ay **naging invalid na**
- Kahit may naka-imbak na token sa ibang device, hindi na ito gagana
- Ito ay nagbibigay ng "logout sa lahat ng device" na epekto

### Password Reset

Kung nakalimutan ang password:
1. I-click ang "Forgot Password"
2. Ilagay ang email address
3. Ang sistema ay mag-generate ng:
   - **Ticket** — isang lihim na identifier
   - **Verification Code** — 6-digit na code
4. Gamitin ang ticket at code para i-reset ang password

> **Seguridad:** May rate limit ang forgot password at reset password para hindi ito magamit para sa brute-force na pag-atake.

---

## 5. Enrollment — Pagsali sa NSTP

### Daloy ng Enrollment

```
[1] Estudyante ay nagpaparehistro
      ↓
[2] Awtomatikong nalilikha ang enrollment record (status: PENDING)
      ↓
[3] Admin o Implementor ay nagrerebyu ng kahilingan
      ↓
    APPROVED → Inilalagay sa Section at Flight
    REJECTED → Tinanggihan, maaaring magpadala ng dahilan
```

### Mga Status ng Enrollment

| Status | Ibig Sabihin |
|---|---|
| **PENDING** | Naghihintay ng desisyon ng Admin/Implementor |
| **APPROVED** | Tanggap na, nakalaan na sa section at flight |
| **REJECTED** | Tinanggihan ang kahilingan |

### Pag-assign ng Section at Flight

Kapag inaprubahan ang enrollment:
- Pinipili ng Admin ang tamang **Section** (pangkat na pang-akademiko, katumbas ng isang kurso)
- Pinipili rin ng Admin ang tamang **Flight** (sub-grupo ng section)
- Ang pagtatalaga ay gumagawa ng **dalawang bagay** nang sabay-sabay:
  1. Ina-update ang enrollment record (nakalagay kung aling section/flight)
  2. Ina-update ang student profile (para ma-sync ang dalawang lugar)

### Proteksyon sa Program Transfer

Hindi maaaring ilipat ang isang estudyante sa section ng ibang programa. Halimbawa:
- Kung ang isang estudyante ay CWTS, hindi siya maaaring ilipat sa isang ROTC section
- Kung susubukan ito, magpapakita ang sistema ng mensahe ng error at **hindi magpapatuloy**

Ang panuntunang ito ay nagpapanatili ng wastong paghihiwalay ng CWTS at ROTC na datos.

### Bulk Import ng mga Estudyante

Ang Admin ay maaaring mag-import ng maraming estudyante nang sabay-sabay:
- Ginagamit ang CSV file para sa data
- Maximum na **1,000 estudyante** bawat import
- May opsyon na itakda ang default na password para sa lahat ng na-import
- Maaaring itakda ang enrollment status ng mga na-import (PENDING o APPROVED)

### Auto-Sectioning

Ang sistema ay may awtomatikong pag-aayos ng mga estudyante sa mga section:
- Pumipili ng course (hal., "CWTS 1")
- Ang lahat ng approved na enrollment na walang nakatalagang section ay ibinabahin sa mga available na section
- Ginagamit ang round-robin na pamamaraan para pantay-pantay ang distribusyon (una-una sa bawat section hanggang mapuno)

---

## 6. Sections, Flights, at Courses

### Course

Ang **Course** ay ang pinakamataas na antas ng pag-oorganisa. Ito ay may:
- Code (hal., "NSTP1-CWTS")
- Pangalan (hal., "NSTP 1 - Civic Welfare Training Service")
- NSTP Type (CWTS o ROTC)

Ang CWTS courses ay makikita at maaaring i-manage ng Admin lamang. Ang ROTC courses ay makikita ng Admin at Implementor.

### Section

Ang **Section** ay isang sub-pangkat ng isang Course.
- Nakakabit sa isang Course (at samakatuwid, nakakabit sa CWTS o ROTC)
- Ang mga attendance session, exam, at materyales ay maaaring i-target sa isang partikular na section
- Ang mga estudyante ay inilalaan sa isang section kapag inaprubahan ang kanilang enrollment

### Flight

Ang **Flight** ay isang mas maliit na sub-grupo sa loob ng isang section.
- Walang direktang koneksyon sa Course — ito ay nagsisilbing simpleng pangkat lamang
- Ginagamit para mas madaling pamamahala ng malalaking section
- Ang mga materials at attendance sessions ay maaari ring i-target sa specific na flight

### Hierarchy

```
Course (CWTS o ROTC)
 └── Section (hal., "Section Alpha — NSTP1-CWTS")
       └── Estudyante
             └── Flight (hal., "Bravo Flight")
```

> **Tandaan:** Ang isang estudyante ay maaaring maging bahagi ng isang section at isang flight sa parehong oras, o isa lang.

---

## 7. Attendance — Pagpapatunay ng Presensya

Ang sistema ay may **dalawang hiwalay na paraan** ng pagtatala ng attendance.

---

### Paraan 1: QR Code Scanner

Ginagamit ito para sa mabilis na pagtatala ng presensya gamit ang camera.

**Sino ang gumagamit nito:** Implementor lamang (may access sa Scanner page)

**Daloy:**
1. Binubuksan ng estudyante ang kanilang **QR code** sa kanilang profile
2. Ang Implementor ay nagbubukas ng **Scanner Page** at nag-click ng "Open Scanner"
3. Ang browser ay nagbubukas ng camera
4. Ini-scan ang QR code ng estudyante
5. Nagpapadala ang sistema ng kahilingan sa server
6. Ang server ay nagve-verify ng QR code at nagtatalaga ng **PRESENT**

**Tungkol sa QR Code:**
- Ang bawat QR code ay may **validity na 6 na araw** — pagkatapos nito, maaaring mag-request ng bago
- Ang QR code ay may **digital na pirma (HMAC-SHA256)** — hindi ito maaaring palsipikahin o baguhin
- Ang server ay gumagamit ng **constant-time comparison** para ma-verify ang pirma — nagpoprotekta laban sa mga timing attack
- Kung sinubukang gamitin ang isang expired o pekeng QR code, tinatanggihan agad ng sistema

**Mga Posibleng Error:**
- "QR token expired" — kailangan ng bagong QR code
- "Already scanned for today" — isa lang ang maaaring i-scan bawat araw
- "Wrong program" — Ang ROTC-scoped na scanner ay hindi maaaring i-scan ang CWTS na estudyante

---

### Paraan 2: Location-Based Attendance (GPS)

Ito ang mas advanced na paraan na gumagamit ng GPS para tiyaking **physically present** ang estudyante sa tamang lugar.

#### Paglikha ng Attendance Session

Ginagawa ito ng instructor (Admin o Implementor) bago magsimula ang klase o training:

1. Pumunta sa Attendance page
2. Lumikha ng bagong session:
   - **Title** — Pangalan ng session (hal., "Morning Formation - Nov 5")
   - **Date** — Petsa ng session
   - **GPS Coordinates** — Awtomatikong kinukuha ng browser ang kasalukuyang lokasyon ng instructor
   - **Radius** — Gaano kalayo ang pinapayagang distansya (default: **50 metro**)
   - **Require Verifier** — Opsyonal na pangalawang verification point
   - **Section/Flight** — Para kanino ang session na ito
   - **Term** — Kung aling academic term ito kabilang

#### Pag-check in ng Estudyante

1. Binubuksan ng estudyante ang Attendance page
2. Nakikita ang aktibong session para sa kanilang section/flight
3. Nag-click ng "Check In"
4. Hinihiling ng browser ang GPS coordinates ng estudyante
5. Ipinapadala ang coordinates kasama ang timestamp sa server

#### Pag-verify ng Server

Ang server ay gumaganap ng tatlong hakbang ng verification:

```
[1] Nandoon ba ang session? Aktibo ba ito?
[2] Naka-set ba ang host location?
[3] Ang distansya ng estudyante ay nasa loob ba ng nakatakdang radius?
      Ginagamit ang Haversine Formula para kalkulahin ang distansya:
      d = 2r × arcsin(√(sin²(Δlat/2) + cos(lat1)×cos(lat2)×sin²(Δlon/2)))
      (Nagbibigay ng tumpak na distansya sa ibabaw ng Mundo)
[4] (Kung may verifier) Nasa loob ba rin ng radius ng verifier?
[5] Sariwa ba ang timestamp? (Hindi dapat higit sa 60 segundo ang edad)
[6] Makatotohanan ba ang bilis ng paglipat? (Hindi "impossible speed")
```

#### Mga Resulta

| Kondisyon | Status |
|---|---|
| Nasa loob ng radius, sa oras | **PRESENT** |
| Nasa loob ng radius, ngunit lumampas na ang itinakdang oras | **LATE** |
| Wala sa loob ng radius | **Tinanggihan** — hindi naitala |

#### Mga Mensahe ng Error

| Error | Ibig Sabihin |
|---|---|
| "Host location not set" | Hindi pa naka-set ang GPS ng instructor — kausapin ang instructor |
| "You are 150m away. Required: 50m" | Masyadong malayo — pumunta sa tamang lokasyon |
| "Verifier required but not assigned" | Kailangan pa ng verifier para mag-check in |
| "Location timestamp is too old" | Mag-refresh at subukan ulit — lumang GPS data |
| "Impossible travel speed detected" | Posibleng GPS spoofing — kausapin ang instructor |

#### Verifier System

Ang verifier ay isang pangalawang taong nagpapatunay na nasa tamang lugar ang mga estudyante:
- Ang instructor ay nagtatalaga ng verifier sa session
- Ang verifier ay nagsusumite ng sariling GPS coordinates
- Ang estudyante ay dapat nasa loob ng radius ng **parehong** host at verifier
- Nagdadagdag ito ng karagdagang antas ng katumpakan at seguridad

---

### Mga Status ng Attendance

| Status | Ibig Sabihin |
|---|---|
| **PRESENT** | Nakapag-check in sa tamang oras at lokasyon |
| **LATE** | Nakapag-check in ngunit lumampas na ang itinakdang oras |
| **ABSENT** | Hindi nakapag-check in para sa session na iyon |

---

### Panuntunan sa Pagpalya Dahil sa Absensya

> ⚠️ **Ito ang isa sa pinaka-kritikal na patakaran ng sistema.**

| Bilang ng Absensya | Nangyayari |
|---|---|
| Umabot sa **3 absensya** | Nakakatanggap ng babala ang estudyante: "Isa pang absensya at mabibigo ka" |
| **Higit sa 3 absensya** | Ang status ng estudyante ay awtomatikong nagiging **FAILED_ABSENCES** — nakakatanggap ng notification |

Kapag naitala ang isang ABSENT record, awtomatikong nire-check ng sistema ang kabuuang bilang ng absensya ng estudyante at isinasagawa ang naaangkop na aksyon. Ang prosesong ito ay nagaganap sa tuwing may bagong attendance record na naitala.

---

## 8. Training Monitoring — Pagsunod sa Kinakailangang Training Days

Ang Training Monitoring page ay nagbibigay ng pangkalahatang larawan ng pagsunod ng mga session sa kinakailangang bilang ng training days bawat termino.

### Kinakailangang Training Days

| Program | Kinakailangang Bilang ng Session |
|---|---|
| **ROTC** | 15 sessions bawat termino |
| **CWTS** | Walang pinakamababang kinakailangan (0) |

### Paano Gumagana

1. Pinipili ng gumagamit ang isang **Academic Term**
2. Nagpapakita ang sistema ng:
   - **Total Sessions** — Gaano karaming attendance session ang naganap sa term na iyon
   - **Required Days** — Gaano karami ang kailangang magawa (batay sa program)
   - **Compliance Status** — Compliant ba o hindi?

### Per-Student na Training Days

Maaari ring tingnan ang pagsunod ng bawat estudyante:
- Gaano karaming session ang naharap ng estudyante (PRESENT o LATE) sa loob ng term
- Kung natutugunan ba ng estudyante ang kinakailangang bilang
- Listahan ng bawat session na naharap kasama ang check-in time at status

### Session Attendance Overview

Nagpapakita ng talahanayan ng lahat ng session sa loob ng term:
- Pangalan at petsa ng session
- Kung aling section
- Bilang ng PRESENT, LATE, at ABSENT
- Mga remarks ng session

---

## 9. Live Monitor — Real-time na Pagmamatyag

Ang Live Monitor ay isang espesyal na pahina para sa **real-time na pagsubaybay** ng isang aktibong attendance session.

### Mga Makikita

- **Bilang ng Checked In** — Gaano karaming estudyante ang nakapag-check in na
- **Bilang ng Present** — Sa tamang oras
- **Bilang ng Late** — Lumampas na ang oras ngunit nakapag-check in
- **Absent/Naghihintay** — Hindi pa nakapag-check in (batay sa roster ng section)
- **Attendance Rate Bar** — Visual na porsyento ng presensya
- **Recent Check-ins** — Listahan ng pinakabagong mga check-in, na ina-update bawat **5 segundo**

### Awtomatikong Pag-refresh

- Ang lista ng mga aktibong session ay ina-update bawat **15 segundo**
- Ang live feed (check-ins at statistics) ay ina-update bawat **5 segundo**
- Hindi kailangan ng manual na pag-refresh — awtomatiko ito

### Maraming Aktibong Session

Kung may higit sa isang aktibong session, maaaring pumili ang gumagamit kung alin ang gusto nilang subaybayan gamit ang selector buttons.

---

## 10. Grading System — Sistema ng Grado

### Tatlong Antas ng Istraktura

```
Grade Category  (hal., "Quizzes" — 30% weight)
 └── Grade Item  (hal., "Quiz 1" — max 50 points)
       └── Student Grade  (hal., Juan Dela Cruz — 45/50)
```

### Grade Category

Nagbibigay ng uri at kategorya ng mga gawain:
- May pangalan (hal., "Quizzes," "Activities," "Major Exams")
- May opsyonal na **weight percentage** para sa weighted average na kalkulasyon
- Maaaring mag-edit o magtanggal ng category (laging naka-log sa audit)

### Grade Item

Kumakatawan sa isang partikular na gawain o pagsusulit:
- May pamagat (hal., "Quiz 1," "Midterm Exam")
- May **maximum score** (hal., 100 points)
- Nakakabit sa isang Category

### Student Grade

Ang aktwal na score ng isang estudyante:
- Naitala kasama ang identity ng nag-encode at timestamp
- Maaaring i-edit o tanggalin ng may awtorisasyon
- Lahat ng pagbabago ay naka-log sa audit trail

### Kalkulasyon ng Kabuuang Grado

Ang kabuuang grado ay kinakalkula gamit ang weighted average:

```
Para sa bawat Category:
  Kalkulahin ang average ng lahat ng score ng estudyante sa category na iyon
  (hal., 80% average sa Quizzes)

Pagkatapos:
  Total = Σ (Category Average × Category Weight)
  
Halimbawa:
  Quizzes (30%):    80% average → 24.0 points
  Activities (40%): 85% average → 34.0 points
  Major Exams (30%): 78% average → 23.4 points
  ──────────────────────────────────────────
  Total Grade: 81.4
```

Kung walang weight ang isang category, ito ay kasama sa simple average ng lahat ng unweighted na categories.

### Privacy ng Estudyante

- Ang mga **estudyante** ay nakakakita lang ng sariling grado — walang ibang estudyante ang makikita
- Ang "Actions" column (i-edit, magtanggal) ay **hindi** lumilitaw para sa mga estudyante
- Ang mga staff (Admin, Implementor) ay nakakakita ng lahat ng grade records na may kaukulang mga aksyon

---

## 11. Merit at Demerit System

Isang sistema para sa pagkilala at pag-record ng mabuti at masamang kilos ng mga estudyante.

### Mga Uri

| Uri | Ibig Sabihin | Epekto sa Score |
|---|---|---|
| **MERIT** | Positibong kilos (hal., kahusayan, pagtulong) | Nagdadagdag ng puntos |
| **DEMERIT** | Negatibong kilos (hal., tardiness, misconduct) | Nagbabawas ng puntos |

### Bawat Record ay Naglalaman ng:
- Pangalan ng estudyante
- Uri (MERIT o DEMERIT)
- Bilang ng puntos
- Detalyadong dahilan o paliwanag
- Sino ang nag-encode at kailan naitala

### Net Merit Score

```
Net Merit = Kabuuang Merit Points − Kabuuang Demerit Points
```

Ito ay ginagamit sa dashboard bilang isa sa mga sukatan ng pangkalahatang kalagayan ng programa.

### Sino ang Maaaring Mag-encode

- **Admin lamang** ang maaaring mag-assign, mag-edit, at magtanggal ng merit at demerit records
- Ang mga estudyante ay nakakakita lamang ng sarili nilang records (o ng kanilang section kung may section)

---

## 12. Leaderboard — Ranggo ng mga Estudyante

Ang Leaderboard ay isang **gamified na sistema ng ranggo** na batay sa attendance performance ng mga estudyante.

### Paano Kinakalkula ang Points

| Event | Points |
|---|---|
| Bawat PRESENT | +10 puntos |
| Bawat LATE | +5 puntos |
| Bawat ABSENT | −5 puntos |
| Streak Bonus | +2 puntos bawat sunod-sunod na naharap (hanggang 10 streak) |

**Halimbawa:**
```
6 PRESENT, 1 LATE, 0 ABSENT, 4-session streak:
= (6×10) + (1×5) + (0×−5) + (min(4,10)×2)
= 60 + 5 + 0 + 8
= 73 puntos
```

### Mga Badge

Maaaring makakuha ng mga espesyal na badge ang mga estudyante batay sa kanilang performance:

| Badge | Icon | Kondisyon |
|---|---|---|
| **Perfect Attendance** | 🏆 | Walang absensya sa 3 o higit pang sessions |
| **Streak Master** | 🔥 | 4 o higit pang magkakasunod na sessions na naharap |
| **Early Bird** | 🌅 | Naka-check in bago mag-7 AM ng tatlo o higit pang beses |
| **Reliable Cadet** | 🎖️ | 90% o higit na attendance rate sa 4+ sessions |
| **Veteran** | ⭐ | Naharap ang 6 o higit pang sessions |

### Scope ng Leaderboard

- Ang ranggo ay batay sa **kasalukuyang aktibong Academic Term** (kung may aktibo)
- Kung walang aktibong term, kasama ang lahat ng records
- Maaaring i-filter ng Admin at Implementor ayon sa section

### Pagkakasunod ng Ranggo

Ang mga estudyante ay inuuri-uri batay sa:
1. **Points** (pababa) — Mas maraming puntos, mas mataas ang ranggo
2. **Attendance Rate** (pababa) — Pantay ang puntos, mas mataas ang attendance rate ang mas nananaig
3. **Pangalan** (paakyat) — Para sa stable at consistent na pagkakasunod

---

## 13. Exams — Online na Pagsusulit

### Lifecycle ng Isang Exam

Ang bawat exam ay dumadaan sa apat na yugto:

```
DRAFT → SCHEDULED → ACTIVE → CLOSED
```

| Yugto | Ibig Sabihin | Makikita ng Estudyante? |
|---|---|---|
| **DRAFT** | Ginagawa pa, hindi pa tapos | Hindi |
| **SCHEDULED** | Naka-publish, naghihintay ng oras | Oo (hindi pa sagutin) |
| **ACTIVE** | Bukas na para sagutin | Oo (maaari nang subukan) |
| **CLOSED** | Tapos na | Oo (hindi na maaaring sagutin) |

### Mga Uri ng Tanong

| Uri | Paliwanag |
|---|---|
| **IDENTIFICATION** | Ang estudyante ay nagta-type ng sagot |
| **MULTIPLE_CHOICE** | Pumipili mula sa mga opsyon (kailangan ng hindi bababa sa 2 choices) |

### Pag-validate ng Pagsubok ng Estudyante

Bago makapagsimula ng exam attempt ang estudyante, nini-verify ng sistema:

1. ✅ **Aktibo ba ang exam?** — ACTIVE o SCHEDULED na at nagsimula na ang oras
2. ✅ **Nasa loob pa ba ng oras?** — Hindi pa tapos ang duration window
3. ✅ **Kasali ba ang estudyante?** — May approved na enrollment sa section/flight ng exam
4. ✅ **Nagsimula na ba dati?** — **Isa lang ang pagkakataon** — walang retake

### Anti-Cheat Monitoring

Habang sumasagot ang estudyante, awtomatikong nino-monitor ng sistema:

| Event | Ibig Sabihin |
|---|---|
| **Focus Loss** | Lumipat sa ibang tab, window, o app |
| **Violation** | Iba pang kahina-hinalang gawi |

- Ang bawat event ay naitala nang may **timestamp** sa monitoring log
- Ang log ay maaaring i-review ng instructor pagkatapos ng exam
- Kung masyadong maraming violation, maaaring **i-lock ang attempt** — hindi na maaaring ituloy ng estudyante

> Bago magsimula, **sinabihan ang estudyante** na nino-monitor ang kanilang screen activity.

### Para sa Estudyante

1. Pumunta sa Exams page
2. Makikita ang mga available na exam para sa section
3. Nag-click ng "Start" — sinabihan tungkol sa monitoring
4. Sinasagot ang mga tanong sa loob ng itinakdang oras (duration in minutes)
5. Nag-submit o awtomatikong natapos kapag naubos ang oras

---

## 14. Learning Materials — Mga Kagamitan sa Pag-aaral

### Mga Kategorya ng Materyales

| Kategorya | Nilalaman |
|---|---|
| **MODULE** | Mga module at reading materials ng kurso |
| **LECTURE** | Mga lecture notes at presentasyon |
| **ANNOUNCEMENT** | Mga opisyal na anunsyo ng programa |
| **ACTIVITY** | Mga instruksyon para sa aktibidad at worksheets |

### Pag-upload ng Files

**Pinapayagang uri ng file:**
- PDF documents (`.pdf`)
- Word documents (`.docx`)
- JPEG images (`.jpg`)

**Limitasyon:** Maximum na **10 MB** bawat file

**Seguridad sa File Upload:**
Ang sistema ay hindi lamang nagtitiwala sa pangalan o extension ng file. Sinusuri nito ang **aktwal na nilalaman ng file** (magic bytes) para tiyaking:
- Ang isang file na sinasabing PDF ay talagang PDF (nagsisimula sa `%PDF`)
- Ang isang file na sinasabing JPEG ay talagang JPEG image
- Ang isang file na sinasabing DOCX ay talagang ZIP-based na Office document

Ito ay nagpoprotekta laban sa mga nakakasamang file na nagpapanggap na ligal.

### Pagtarget ng Materyales

Ang bawat materyales ay maaaring i-assign sa:
- Isang partikular na **Section** — makikita ng lahat ng estudyante sa section na iyon
- Isang partikular na **Flight** — para sa sub-grupo lamang
- Kung wala kang itinakda, makikita ng lahat ng estudyante sa program

### Para sa Estudyante

- Nakikita lang ang mga materyales na para sa kanilang section o flight
- May "View File" na button — nagbubukas ng file sa bagong tab
- Ang icon ay nagpapakita kung may attached na file ang materyales

---

## 15. Medical Certificates at Document Submissions

---

### Medical Certificates (Para sa mga Medical na Dahilan)

Ginagamit ng mga estudyante na may medikal na dahilan ng absensya.

**Daloy:**

```
[1] Estudyante → Nag-u-upload ng medical certificate
      (File + Dahilan + Petsa ng saklaw ng sakit: mula kailan hanggang kailan)
      ↓
[2] Implementor → Tinitignan at nagpapasya
      ↓
APPROVED → Naitala, maaaring gamitin bilang ebidensya ng absensya
REJECTED → Tinanggihan kasama ang dahilan
      ↓
[3] Estudyante → Nakakatanggap ng notification tungkol sa desisyon
```

**Mga Status:**
- **PENDING** — Naghihintay ng rebyu
- **APPROVED** — Tinanggap
- **REJECTED** — Tinanggihan (kasama ang mga remarks)

---

### Document Submissions (Para sa Lahat ng Uri ng Opisyal na Dokumento)

**Mga Tinatanggap na Uri ng Dokumento:**

| Uri | Paliwanag |
|---|---|
| **EXCUSE_LETTER** | Liham ng dahilan para sa absensya |
| **MEDICAL_CERTIFICATE** | Medical na sertipiko mula sa doktor |
| **OTHER_OFFICIAL_DOCUMENT** | Iba pang opisyal na dokumento |

**Daloy:**

```
[1] Estudyante → Nag-u-upload ng dokumento
      (Uri ng dokumento + Pamagat + Paliwanag + Petsa ng saklaw)
      ↓
[2] Admin o Implementor → Tinitignan
      ↓
APPROVED o REJECTED (kasama ang mga remarks)
      ↓
[3] Estudyante → Nakakatanggap ng notification
```

**Limitasyon ng Access:**
- Ang mga estudyante ay nakakakita ng sarili nilang submissions lamang
- Ang Admin at Implementor ay nakakakita ng lahat (na naka-filter ayon sa program)

---

## 16. Instructor Remarks — Mga Komento ng Guro

Ang mga instructor (Admin at Implementor) ay maaaring mag-iwan ng mga personal na komento para sa bawat estudyante.

### Paano Gumagana

- Ang remark ay nakakabit sa isang partikular na estudyante
- Maaari ring mag-dagdag ng remark sa isang partikular na **attendance record** (hal., "Dumating nang ilang minuto lang pagkatapos ng session")
- Ang mga estudyante ay maaaring makita ang mga remark na para sa kanila
- Ang mga cadet officer ay nakakakita lamang ng sariling mga remark

### Program Scoping

Ang mga Implementor (na naka-lock sa ROTC) ay hindi maaaring mag-lagay ng remark sa mga CWTS na estudyante. Awtomatikong sinisigurado ng sistema ito.

---

## 17. Notifications — Mga Abiso

Awtomatikong nagpapadala ang sistema ng mga notification para sa mga sumusunod na pangyayari:

| Uri ng Notification | Kailan Nagaganap |
|---|---|
| **THREE_ABSENCES** | Umabot na sa eksaktong 3 absensya — babala bago mabigo |
| **FAILED_ABSENCES** | Lumampas na sa 3 absensya — namarkahan na bilang FAILED |
| **MEDICAL_CERTIFICATE_PENDING** | May bagong medical certificate na naghihintay ng rebyu (para sa staff) |
| **MEDICAL_CERTIFICATE_APPROVED** | Inaprubahan ang iyong medical certificate (para sa estudyante) |
| **MEDICAL_CERTIFICATE_REJECTED** | Tinanggihan ang iyong medical certificate (para sa estudyante) |
| **GENERAL** | Pangkalahatang abiso |

### Paano Gumagana

- Nakikita ang **bilang ng hindi pa nababasang notifications** sa navigation bar
- Maaaring markahan ang isang notification bilang **nabasa** nang isa-isa
- Maaaring markahan ang **lahat nang sabay** bilang nabasa
- Maaaring i-filter ang listahan para makita lang ang hindi pa nababasa

---

## 18. Calendar — Kalendaryo ng mga Session

Ang Calendar page ay nagpapakita ng lahat ng attendance session sa isang visual na kalendaryo.

### Paano Gumagana

- Nakikita ang mga attendance session na naka-ayos ayon sa petsa
- Maaaring mag-navigate sa pagitan ng mga buwan
- Maaaring i-filter ayon sa saklaw ng petsa (mula kailan hanggang kailan)
- Kapaki-pakinabang para sa pangkalahatang pagtingin sa schedule ng mga training session

### Access

- Available sa lahat ng logged-in na gumagamit
- Ang programa scoping ay nalalapat din dito — nakikita ng bawat gumagamit ang mga session na para sa kanila

---

## 19. Dashboard — Pangkalahatang Larawan

### Para sa Admin

Nakakakita ng parehong CWTS at ROTC na datos:
- Hiwalay na attendance rate para sa bawat program
- Kabuuang bilang ng approved na enrollment
- Average na grado sa lahat ng students
- Net merits (merits minus demerits)
- Attendance trend chart (interactive, maaaring zoom at filter)
- Talahanayan ng mga estudyante para sa mabilis na pagtingin

### Para sa Implementor (ROTC Only)

Katulad ng Admin ngunit **ROTC data lamang** ang makikita:
- Mga shortcut buttons para sa madalas na ginagamit na aksyon (attendance, enrollment, reports)

### Para sa Estudyante

Personal na dashboard na nagpapakita ng:

| Widget | Nilalaman |
|---|---|
| **Enrollment Status** | Kasalukuyang status (PENDING/APPROVED/REJECTED) kasama ang nakatalagang section at kurso |
| **Total Grade** | Weighted na kabuuang grado sa lahat ng grade categories |
| **Attendance Summary** | Bilang ng sessions na naharap, na nahalang, at na-absent; porsyento ng presensya |
| **Pending Submissions** | Bilang ng mga dokumento na naghihintay pa ng desisyon |

---

## 20. Reports at Exports

### Mga Available na Report

| Report | Nilalaman |
|---|---|
| **Enrollment Report** | Listahan ng lahat ng enrollment: email, status, section, flight, petsa |
| **Attendance Report** | Lahat ng attendance records: email, petsa, status, check-in time, GPS coordinates |
| **Grades Report** | Lahat ng grade records: email, category, item, score, maximum score |
| **Merits Report** | Lahat ng merit/demerit records: email, uri, puntos, dahilan, petsa |

### Mga Filter

Ang bawat report ay maaaring i-filter ayon sa:
- **Petsa** (mula at hanggang)
- **Section** (para sa specific na section)
- **Flight** (para sa specific na flight)
- **Program** (para sa Admin — CWTS o ROTC)

### Export

Lahat ng report ay maaaring i-download bilang **CSV file** — bumubukas sa Excel, Google Sheets, o anumang spreadsheet application para sa karagdagang pag-aanalisa at presentasyon.

### Access

| Role | Mga Available na Report |
|---|---|
| Admin | Lahat, parehong CWTS at ROTC |
| Implementor | Lahat, ROTC lang |
| Cadet Officer | Lahat, sariling section lang |
| Student | Walang access sa reports |

---

## 21. Profile at Avatar

### Mga Maaaring Baguhin sa Profile

| Field | Admin | Implementor | Cadet Officer | Student |
|---|---|---|---|---|
| First Name | ✅ | ✅ | ✅ | ✅ |
| Last Name | ✅ | ✅ | ✅ | ✅ |
| Middle Name | — | — | — | ✅ |
| Gender | — | — | — | ✅ |
| Birth Date | — | — | — | ✅ |
| Contact Number | ✅ | ✅ | ✅ | ✅ |
| Address | — | — | — | ✅ |

### Hindi Maaaring Baguhin

| Field | Dahilan |
|---|---|
| Email address | Permanenteng identifier ng account |
| Role | Itinakda at kontrolado ng Administrator |
| Student ID Number | Permanenteng identifier |

### Profile Photo

- Maaaring mag-upload ng larawan gamit ang camera button sa profile page
- Ang larawan ay nagde-display bilang base64-encoded JPEG
- Maaaring alisin ang larawan anumang oras
- Kung walang larawan, awtomatikong gumagawa ang sistema ng natatanging avatar batay sa email ng gumagamit gamit ang **DiceBear API** — tiyak na laging may visual na representasyon ang bawat gumagamit

### Avatar Frames

Maaaring pumili ng dekorasyong frame para sa profile picture:

| Frame | Paglalarawan |
|---|---|
| **none** | Walang frame, malinis |
| **gradient** | Smooth gradient ring (default para sa lahat) |
| **double** | Doble na border na ring |
| **glow** | Neon glow effect |
| **hexagon** | Hexagonal na clip path |
| **badge** | Badge-style na frame |

**Ang kulay ng frame ay batay sa papel ng gumagamit:**
- Admin → Violet
- Implementor → Sky Blue
- Cadet Officer → Amber
- Student → Emerald

Ang napiling frame ay makikita sa tatlong lugar:
1. Profile page
2. Sidebar user card
3. Top navigation bar

---

## 22. Academic Terms — Akademikong Termino

Ang sistema ay may tatanggap ng **Academic Terms** para sa mas maayos na pag-oorganisa ng datos.

### Katangian ng Term

- **Pangalan** — hal., "1st Semester AY 2026-2027 (ROTC)"
- **Petsa ng Simula** — Kailan nagsimula ang term
- **Petsa ng Pagtatapos** — Kailan matatapos ang term
- **isActive** — Isa lang sa lahat ng term ang maaaring "aktibo" sa isang pagkakataon

### Paano Ginagamit ang Term

- Ang mga **Attendance Session** ay maaaring iugnay sa isang term
- Ang **Training Monitoring** ay gumagamit ng term para i-filter ang mga session
- Ang **Leaderboard** ay gumagamit ng aktibong term para limitahan ang attendance window
- Kapag walang aktibong term, kasama ang lahat ng records sa aggregation

---

## 23. User Management — Pamamahala ng mga Gumagamit

**Admin lamang** ang may access sa User Management page.

### Mga Maaaring Gawin ng Admin

- **Lumikha ng bagong gumagamit** — Anumang role, kasama ang paglikha ng role-specific na profile
- **Mag-edit ng gumagamit** — Baguhin ang role, program, o iba pang detalye
- **I-enable o I-disable ang account** — Ang disabled (`isActive = false`) na account ay hindi makakapag-login
- **Magtanggal ng gumagamit** — Soft delete (hindi tinatanggal sa database, nagtatago lamang)

### Paglikha ng Gumagamit

Kapag gumawa ng bagong gumagamit:
1. Automatically ay ini-hash ang password (hindi naka-imbak nang plaintext)
2. Nalilikha ang role-specific na profile (StudentProfile, ImplementorProfile, o CadetOfficerProfile) kasabay ng User record

### Paghanap at Pag-filter

Maaaring i-filter ang listahan ng mga gumagamit ayon sa:
- **Role** (ADMIN, IMPLEMENTOR, CADET_OFFICER, STUDENT)
- **Search** — Paghahanap ayon sa email address

---

## 24. Audit Logs — Talaan ng mga Aksyon

Ang bawat mahahalagang aksyon sa sistema ay awtomatikong naitala sa audit log. **Ang audit logs ay hindi maaaring burahin.**

### Mga Naitatalang Aksyon

| Aksyon | Halimbawa |
|---|---|
| **CREATE** | Bagong enrollment, bagong grade, bagong user, bagong merit |
| **UPDATE** | Pag-edit ng profile, pagbabago ng grade, pag-approve ng enrollment |
| **DELETE** | Pagtanggal ng rekord |
| **LOGIN** | Matagumpay na pag-login ng gumagamit |

### Nilalaman ng Bawat Log Entry

| Field | Ibig Sabihin |
|---|---|
| **Actor** | Sino ang gumanap — kung sino ang naka-login noong mangyari ito |
| **Action** | Ang uri ng aksyon (CREATE, UPDATE, DELETE, LOGIN) |
| **Entity** | Anong uri ng rekord ang naapektuhan (hal., "StudentGrade", "Enrollment") |
| **Entity ID** | Ang ID ng partikular na rekord |
| **Meta** | Karagdagang impormasyon (hal., kung ilang records ang na-import) |
| **Timestamp** | Eksaktong oras ng aksyon |

### Access

- **Admin lamang** ang may access sa Audit Logs page
- May search at filter functionality (ayon sa aksyon at entity type)
- Pinaginated para sa mabilis na pag-browse ng mahabang kasaysayan

---

## 25. Mga Limitasyon, Patakaran, at Mahalagang Panuntunan

### Tungkol sa Presensya

- **Hindi maaaring mag-check in nang dalawang beses sa iisang araw** — awtomatikong tinatanggihan
- **Ang maximum na absensya bago mabigo ay 3 absensya** — pagkatapos nito, awtomatiko ang proseso
- **Ang GPS-based attendance ay nangangailangan ng HTTPS** at ng pahintulot ng browser para sa lokasyon
- **Ang QR code ay may validity na 6 na araw** — pagkatapos nito, kailangan ng bagong QR
- **Ang GPS timestamp ay dapat sariwa** — tinatanggihan kung higit sa 60 segundong luma na

### Tungkol sa Program Separation

- Ang mga datos ng CWTS at ROTC ay **ganap na hiwalay** — hindi makikita ng isa ang datos ng isa
- **Ang Implementor ay ROTC only** — hard-coded na limitasyon, hindi mababago sa labas ng pag-edit ng code
- **Walang program transfer** — hindi maaaring ilipat ang estudyante mula sa isang program papunta sa isa pa

### Tungkol sa mga Files

- **Maximum na laki ng file: 10 MB** bawat upload
- **Pinapayagang format: PDF, DOCX, JPEG lamang** — tinatanggihan ang lahat ng iba
- **Magic byte verification** — ang sistema ay sinisigurado na ang file content ay tumutugma sa sinasabing uri

### Tungkol sa Exams

- **Isa lang ang pagkakataon sa bawat exam** — walang retake
- **Ang monitoring ay patuloy habang sumasagot** — lahat ng tab switch at focus loss ay naitala
- **Ang exam window ay may simula at wakas na batay sa duration** — hindi maaaring simulan kapag lipas na ang window

### Tungkol sa Privacy ng Estudyante

- **Read-only ang karamihan ng access ng estudyante** — hindi maaaring baguhin ang datos ng iba
- **Private ang lahat ng personal na datos** — grado, merits, attendance, remark — para sa estudyante na iyon lamang

### Tungkol sa Seguridad

- **Rate limiting sa lahat ng sensitibong endpoint** — nagpoprotekta laban sa brute force at automated na pag-atake
- **Token rotation** — ang bawat refresh ay nag-i-invalidate ng lumang token
- **Constant-time comparison para sa QR code** — nagpoprotekta laban sa timing attacks
- **Server-side validation ng lahat** — hindi maaaring dayain ang sistema sa pamamagitan ng pagbabago ng client-side code

---

## Buod ng Buong Sistema sa Isang Tingin

```
REGISTRATION & ONBOARDING
  Mag-register → Enrollment PENDING → Admin/Implementor Approves
  → Ilaan sa Section + Flight → Aktibo na ang estudyante

ATTENDANCE (Dalawang Paraan)
  QR Scan (Implementor):    I-scan ang QR ng estudyante → PRESENT
  GPS Check-in (Estudyante): Haversine verification → PRESENT / LATE / Tinanggihan
  3 Absensya = Babala | Higit sa 3 = FAILED awtomatiko

ACADEMICS
  Grado:   Category (may weight) → Item (may max score) → Student Score → Weighted Total
  Merits:  Gawi → Merit/Demerit Points → Net Merit Score → Leaderboard Rank
  Exams:   DRAFT→SCHEDULED→ACTIVE→CLOSED | Isa lang na pagkakataon | Screen monitoring

MATERIALS & DOCUMENTS
  Materials:    I-upload (PDF/DOCX/JPEG max 10MB) → I-target sa Section/Flight
  Med Certs:    Student uploads → Implementor reviews → APPROVED/REJECTED + Notification
  Submissions:  Student uploads → Admin/Implementor reviews → APPROVED/REJECTED + Notification

MONITORING & REPORTING
  Live Monitor:    Real-time check-in feed (refresh bawat 5 segundo)
  Training Page:   Pagsunod sa required training days (ROTC: 15, CWTS: 0)
  Leaderboard:     Points + Badges + Ranking
  Calendar:        Visual na schedule ng mga session
  Reports:         CSV export ng attendance, grades, merits, enrollment

ADMINISTRATION
  Users:      Create/Edit/Disable/Delete accounts
  Audit Logs: Immutable na talaan ng lahat ng aksyon
  Terms:      Manage academic terms para sa scoped na aggregation
```

---

*Kumpletong Dokumentasyon ng Sistema — Tala NSTP Management System*
*Inihanda para sa mga kliyente at estudyante para maunawaan ang buong lohika at daloy ng sistema*
