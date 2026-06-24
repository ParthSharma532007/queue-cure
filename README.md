# Queue Cure '26 — Live Clinic Queue Manager & Audio Caller

76% of India's 1.5 million local clinics run on paper token slips and room shouting. Patients wait 2 to 3 hours with zero visibility into their status, causing immense waiting-room anxiety. Receptionists manage clinic flows from memory, leading to double-bookings and errors.

**Queue Cure** is a lightweight, real-time queue management system designed for local clinics. It replaces shouting with live digital wait dashboards synced via WebSockets and automated Text-to-Speech callouts.

---

## ⚡ Key Outcomes & Stats
* **Intake Execution Speed:** `< 2 seconds` per patient (Keyboard-only receptionist console).
* **Refresh Rate:** `0` (Refresh-free updates on patient screens via bi-directional WebSockets).
* **Wait Time Engine:** `100% Dynamic` (Calculates wait times using a rolling average of actual consultation durations).

---

## 🛠️ Features

### 1. Receptionist Console (`receptionist.html`)
* **Rapid Intake Form:** Input field auto-focuses on load; typing a name and hitting `Enter` instantly registers the patient and prints their token.
* **Cabin calling controls:** One-click big action buttons to **Call Next**, **Recall Again** (re-trigger voice calls), or **Mark No-Show**.
* **Session Config Slider:** Receptionist can configure a target consultation time.
* **Wait Directory List:** Real-time queue table showing active check-in timestamps and live wait estimations. Supports Up/Down priority reordering and quick-delete commands.

### 2. Patient waiting room display (`index.html`)
* **Now Serving Header:** High-contrast glowing banner displaying the token and name currently inside the doctor's cabin.
* **Sound Announcement Switch:** Plays synthesized chime arpeggios (using Web Audio API) and reads the token name aloud (using browser SpeechSynthesis) when called.
* **Upcoming Queue Board:** Live listing of all upcoming tokens and wait durations.
* **Personal Status Tracker:** Allows patients to select their token to view personalized wait times, position in line, approximate clock-time of appointment, and a visual progress stepper (**In Queue** ➡️ **Next Up** ➡️ **In Cabin**).

### 3. Integrated Screen Switcher
* Features a segmented tab control in the top-right header of both screens for judges and users to toggle between the **Receptionist Console** and the **Patient Room** instantly.

---

## ⚙️ Local Setup Instructions

1. **Install Dependencies:**
   Ensure Node.js is installed, then run:
   ```bash
   npm install
   ```

2. **Start the Local Server:**
   ```bash
   npm run dev
   ```

3. **Access the Application:**
   * **Receptionist View:** [http://localhost:3000/receptionist.html](http://localhost:3000/receptionist.html)
   * **Patient waiting room display:** [http://localhost:3000/index.html](http://localhost:3000/index.html)

---

## 🧠 Behind the Scenes: Real Data Wait Engine

Instead of hardcoded guesses, Queue Cure measures actual doctor consultation speeds:
1. When the receptionist calls the next patient, the backend calculates the time elapsed since the previous patient was called.
2. It pushes this value into a rolling average array (tracking the last 5 completed sessions).
3. The estimated wait time is calculated dynamically as:
   $$\text{Estimated Wait} = \text{Remaining Time of Active Patient} + (\text{Queue Position} \times \text{Rolling Average})$$
4. If no historical logs exist yet, it falls back to the manual target duration set on the receptionist config slider.
