# Skill-Swap
The SkillSwap project aims to create a full-stack web application that connects people based on the skills they can teach and the skills they want to learn. It works as a Crowd-Powered Skill Exchange Network, where users can find learning partners instead of hiring tutors.
The platform will allow users to:
•	Create a profile listing the skills they can teach and the ones they want to learn.
•	Find compatible users through a smart matching system that pairs people with complementary skills.
•	Communicate via a simple messaging system.
•	Make optional payments using a safe test-mode payment system powered by Stripe.
Unlike traditional tutoring websites, SkillSwap focuses on community-driven learning — it’s about sharing knowledge, not selling it.
2.3 Objectives
The main objectives of the project are to:
•	Build a complete and functional MVP that demonstrates real-world full-stack development.
•	Implement an intelligent matching algorithm to connect compatible learners and teachers.
•	Showcase the integration of frontend (Next.js) and backend (Django REST Framework).
•	Include a dummy payment flow using Stripe for optional paid sessions.
•	Provide a clean and user-friendly interface for users to explore and interact.
________________________________________
3. Tech Stack
Frontend
•	Next.js 15 (App Router): Used for building an interactive and responsive frontend interface.
•	Tailwind CSS , Shadcn UI , react spring , gsap , react-motion ,React Bits , Framer Motion , react charts library, : For creating clean, modern, and mobile-friendly UI designs.
Backend
•	Django REST Framework (DRF): Handles data logic, APIs, and backend processing.
Database
•	MongoDb: Stores user data, skills, messages, and payment records in a structured format.
Authentication
•	JWT (JSON Web Tokens): Used for secure login and registration through Django’s SimpleJWT or dj-rest-auth.
Payment Integration
•	Stripe API (Test Mode): Enables secure and dummy payment transactions.
API Communication
•	Axios: Manages all API requests between the frontend and backend.
Development Environment
•	Localhost setup: The application will run locally for demonstration purposes.
