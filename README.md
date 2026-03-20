# NEU Library Visitor Log System
> **A Digital Transformation Project for New Era University**

---

## Live Prototype
Access the deployed application here:
**[neu-library-log-kappa.vercel.app](https://neu-library-log-kappa.vercel.app)**

---

## Project Overview
The **NEU Library Visitor Log System** is a modern web application designed to replace traditional paper-based logbooks. It provides a seamless, cloud-based entry process for students and a powerful analytics dashboard for administrators.

## Key Features

### For Students (Visitors)
* **Institutional Login:** Secure Google Authentication restricted to @neu.edu.ph accounts.
* **Welcome Experience:** Personalized welcome messages upon successful login.
* **Smart Profiling:** * **Department Selection:** Choose from 17 recognized NEU Colleges.
    * **Purpose of Visit:** Categorize visits (e.g., Study, Research, Borrowing).

### For Administrators
* **Real-time Dashboard:** Instant visibility of current library traffic.
* **Data Analytics (Charts):**
    * **Departmental Trends:** Statistical view of which college uses the library the most.
    * **Peak Hours:** Identify the busiest times of the day.
    * **Usage Purpose:** Visual breakdown of student activities.
* **One-Click Reporting:** Export all logs into a professional, branded **PDF Report**.

---

## Technical Stack
| Layer | Technology Used |
| :--- | :--- |
| **Frontend** | HTML5, Tailwind CSS, Lucide Icons |
| **Backend/Auth** | Firebase Authentication (OAuth 2.0) |
| **Database** | Cloud Firestore (Real-time NoSQL) |
| **Deployment** | Vercel |
| **Libraries** | Chart.js, jsPDF |

---

## System Workflow
1.  **Authentication:** User signs in with their NEU Google Account.
2.  **Input:** User selects their **College** and **Purpose**.
3.  **Sync:** Data is sent to the cloud in real-time.
4.  **Analytics:** The Admin Dashboard updates graphs automatically.
5.  **Output:** Reports are generated via the Export PDF function.

---

**Developed by:** [Your Name]  
**Institution:** New Era University  
**Status:** Proposal
