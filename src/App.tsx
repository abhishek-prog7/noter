import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import './App.css';
import Home from './pages/Home';
import NoteEditor from './pages/NoteEditor';

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`App ${theme}`}>
      <header className="App-header">
        <div className="header-content">
          <h1>Noter</h1>
          <p>Your personal note-taking application</p>
        </div>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/note/:id" element={<NoteEditor />} />
          <Route path="/new" element={<NoteEditor />} />
        </Routes>
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} Noter App</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
