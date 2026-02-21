# FleetFlow

FleetFlow is a comprehensive fleet management solution designed for the Odoo Hackathon 2026. It features a robust React frontend and a Node.js/Express backend with MongoDB.

## Features
- Real-time fleet tracking and monitoring.
- Expense management and reporting.
- Secure authentication using JWT.
- Responsive dashboard with data visualizations.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts.
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **Tools**: Axios, JSON Web Tokens, Bcryptjs.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or on Atlas)

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your configuration:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/fleetflow
   JWT_SECRET=your_secret_key
   ```
4. Run the seed script to populate initial data:
   ```bash
   npm run seed
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Branch tirth: update by assistant on 2026-02-21
