import logo from './logo.svg';
import React from 'react';
import Photobooth from './components/photobooth';
import './styles/global.css';
import './App.css';

const logoSrc = "/assets/logo"
function App() {
  return (
      <div className="App-header" style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection:"column",
        alignItems: "center"
      }}>
        <div style={{
          width: "100%",
          maxWidth: 1200,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "20px 32px"
        }}>
          <img src={logoSrc} alt="Witches-logo" style={{width: 50}}/>
          <h1 style={{
            fontFamily: "Cantika cute",
            color: "#8c5b4a",
            margin: 0
          }}>
            Witches in the underworld photobooth
          </h1>
        </div>

        <div style={{
          flex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: "40px"
        }}>
          <Photobooth />
        </div>
        
      </div>
  );
}

export default App;
