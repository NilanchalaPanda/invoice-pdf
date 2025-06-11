# InvoiceGen – PDF Invoice Generator 🧾⚡

![Landing Page](https://github.com/user-attachments/assets/58110af3-d6b9-4701-a2ae-858907e096af)



> A scalable, real-time, and secure PDF invoice generation system built using **Next.js**, **Socket.IO**, **MongoDB Atlas**, and **Express.js**.

---

## 📌 Overview

**InvoiceGen** is a production-ready invoice generation platform designed as a proof-of-concept for handling resource-intensive tasks like PDF creation in a scalable and secure architecture. It ensures smooth user experience with real-time updates and strong multi-tenancy security.

---

## 🚀 Live Demo

🌐 [Live Frontend on Vercel](https://invoicegen-black.vercel.app/)   
🛠️ Backend: Deployed using Express + MongoDB Atlas

---

## 🧰 Tech Stack

### 🔷 Frontend
- **Next.js** (React Framework)
- **Tailwind CSS**
- **Socket.IO** (WebSocket integration for real-time updates)

### 🟦 Backend
- **Express.js**
- **MongoDB Atlas**
- **JWT** for secure authentication
- **In-memory Cache** (Node Cache)
- **Socket.IO**
- **Rate Limiter (Redis/MemoryStore)**

---

## 📦 Features

### 🔐 Authentication
- User Sign Up & Login
- JWT-based secure sessions
- Route protection (e.g., dashboard, invoice fetch/download)

### 📄 Invoice Dashboard
- Create Invoice via a form
- Fill client name, multiple line items (with descriptions & prices)
- Generate PDF asynchronously with real-time progress

### ⚙️ Background PDF Generation
- Invoice status updates as "Processing..." instantly
- Background worker generates the PDF on the server
- Real-time invoice update using **Socket.IO**

### 🔄 Real-Time Communication
- Frontend subscribes to backend events via WebSocket
- UI auto-updates invoice status without refresh

### 🧷 Secure Download Links
- Download only available once invoice is ready
- Access control: Only the creator can access the PDF

### 🛡️ Rate Limiting
- Maximum 5 PDF generations per user per minute
- Prevents abuse & protects backend resources
