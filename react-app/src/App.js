import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import GamePage from './pages/GamePage';
import 'bootstrap/dist/css/bootstrap.min.css';
//import './assets/styles/index.css';
import './assets/styles/style.css';

function App() {
  const [username, setUsername] = useState('');

  //on startup, check if user is logged in
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await fetch('http://localhost:8000/me', {
          method: 'GET',
          credentials: 'include'
        });
        if (!res.ok) throw new Error(`Status ${res.status}`); //throw error if not response not ok

        const data = await res.json(); //parses the response body as JSON
      
        setUsername(data.username); //if username is empty, user is not logged in

      } catch (err) {
        console.warn('Could not fetch current user:', err);
      }
    };
  

    loadCurrentUser();

  }, []);

  return (
    <Router>
      <Routes>

        {/* if logged in (non empty username) "/" to "/game", else show Login */}
        <Route path="/" element={ username ? <Navigate to="/game" replace /> : <Login setUsername={setUsername} />} />

        <Route path="/register" element={<Register />} />

        {/* if user is at the GamePage and are not logged in, force them to Login*/}
        <Route path="/game" element={ username ? <GamePage username={username} setUsername={setUsername} /> : <Navigate to="/" replace />} /> {/* will use username and setUsername on game page*/}

      </Routes>
    </Router>
  );
}

export default App;