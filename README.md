📚 NEU Library Visitor Log System
An Automated Visitor Management & Real-time Analytics Solution for New Era University. 

🔗 Live Project Link
View the Live Prototype here: https://neu-library-log-kappa.vercel.app

🌟 Project Overview
The NEU Library Visitor Log System is a digital solution designed to streamline the entry process at the New Era University Library. It replaces manual logs with a seamless, cloud-based workflow that captures visitor data accurately for administrative reporting and facility optimization.

🚀 Core Features
👤 Visitor Experience
Custom Welcome Message: A personalized greeting upon successful Google Authentication, providing a professional and welcoming user experience.

Department Selection: A dedicated step for visitors to select their specific college (e.g., CICS, CEA, CAS) from the 17 recognized NEU departments.

Purpose of Visit: Data collection on why the user is visiting (e.g., Research, Study, Book Borrowing, or Clearance) to help the library understand user needs.

📊 Admin Command Center
Real-time Visitor Tracking: Instant visibility of all active entries in the library.

Statistical Data Visualization: * Department Distribution: Charts showing which colleges use the library most.

Purpose Analytics: Graphs highlighting the primary reasons for library visits.

Peak Hour Density: Identifying the busiest times of the day to assist in staff scheduling.

Professional PDF Export: Generate formal, branded reports of all visitor logs with a single click for documentation and archiving.

🛡️ Security & Authentication
Institutional Verification: Access is strictly restricted to official @neu.edu.ph email addresses.

Firestore Security Rules: Implemented server-side protection to ensure that students can only see their own logs while Admins have full access to analytics.

🛠️ Tech Stack
Frontend: HTML5, Tailwind CSS, Lucide Icons.

Backend: Firebase Authentication (OAuth 2.0).

Database: Cloud Firestore (Real-time NoSQL).

Analytics: Chart.js for interactive data visualization.

Reporting: jsPDF for automated document generation.

📝 User Workflow
Sign In: User logs in via Google using their NEU email.

Greeting: System displays a Welcome Message with the user's name.

Profiling: User selects their Department and Purpose of Visit.

Logging: Data is sent to Firestore and appears instantly on the Admin Dashboard.

Analytics: Admins view generated charts and export the data as a PDF Report.

Developed by: FAJARDO, LUIS KENNETH D. 

Institution: New Era University

Project Status: Functional Prototype / Proposal
