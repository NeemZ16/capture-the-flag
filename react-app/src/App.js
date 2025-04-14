import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import GamePage from './pages/GamePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles/index.css';

function App() {
  return (
    <Router>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/game"     element={<GamePage />} />
      </Routes>

    </Router>
  );
}

export default App;