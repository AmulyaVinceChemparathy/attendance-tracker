
# Attendance Tracker

A full-stack application to manage and track attendance efficiently. This project contains a **client (frontend)** and a **server (backend)**.

---

## 🚀 Features
- User authentication (login & signup)  
- Attendance tracking and storage  
- REST API powered by FastAPI  
- Frontend built with React + Vite  
- SQLite database integration  
- Real-time updates (future scope)  

---

## 🗂 Project Structure
attendance-tracker/  
│── client/        # React frontend (Vite + Tailwind)  
│── server/        # FastAPI backend with SQLite  
│── README.md  

---

## 🛠 Tech Stack
**Frontend**  
- React (Vite)  
- Tailwind CSS  

**Backend**  
- FastAPI (Python)  
- SQLite  
- bcrypt (authentication)  

**Other Tools**  
- Git & GitHub  
- Node.js (for frontend build tools)  

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/AmulyaVinceChemparathy/attendance-tracker.git
cd attendance-tracker
````

### 2️⃣ Backend (Server Setup)

```bash
cd server
pip install -r requirements.txt   # Install dependencies
uvicorn main:app --reload         # Run the FastAPI server
```

* Backend runs at: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* API docs available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3️⃣ Frontend (Client Setup)

```bash
cd client
npm install      # Install dependencies
npm run dev      # Start development server
```

* Frontend runs at: [http://localhost:5173](http://localhost:5173)

---

## 📌 Usage

1. Start the backend server (FastAPI).
2. Start the frontend client (React).
3. Open [http://localhost:5173](http://localhost:5173) in your browser.
4. Create an account or log in.
5. Mark and view attendance in real time.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License.


