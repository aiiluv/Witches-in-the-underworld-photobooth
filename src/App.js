import React from 'react';
import Photobooth from './components/photobooth';
import './styles/global.css';
import './App.css';

import logoImg from './assets/logo/logo.png';

function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <nav>
        <div id="grid-item">
          <a href="index.html">
            <img src={logoImg} id="logo" alt="Logo" />
          </a>
        </div>

        <div className="navbar-inline">
          <ul className="nav">
            <li><a href="https://aiiluv.github.io/Witches-in-the-underworld/">Home?</a></li>
            <li><a href="https://aiiluv.github.io/Witches-in-the-underworld/game.html">Minigames</a></li>
            <li><a href="https://aiiluv.github.io/Witches-in-the-underworld/quiz.html">Your spark</a></li>
            <li><a href="https://aiiluv.github.io/witches-in-the-underworld/wonderbox.html">Wonderbox</a></li>
            <li><a href="index.html">Photobooth</a></li>
          </ul>
        </div>
      </nav>

      {/* Photobooth Content - diberi paddingTop agar tidak tertimpa navbar fixed */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "90px"
      }}>
        <h1 style={{
          fontFamily: "Cantika cute, sans-serif",
          color: "#ffffff",
          margin: "0 0 10px 0",
          textAlign: "center"
        }}>
          Witches in the underworld photobooth
        </h1>

        <Photobooth />
      </main>
    </div>
  );
}

export default App;