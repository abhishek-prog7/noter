import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NoteList from '../components/NoteList';
import { Note } from '../models/Note';
import { noteService } from '../services/api';
import './Home.css';

const Home: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes from API service
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await noteService.getAllNotes();
        setNotes(fetchedNotes);
        setFilteredNotes(fetchedNotes);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch notes. Please try again later.');
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Filter notes based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = notes.filter(
        note => 
          note.title.toLowerCase().includes(term) || 
          note.content.toLowerCase().includes(term)
      );
      setFilteredNotes(filtered);
    }
  }, [searchTerm, notes]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h2>My Notes</h2>
        <Link to="/new" className="new-note-btn">+ New Note</Link>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search" 
            onClick={() => setSearchTerm('')}
          >
            ×
          </button>
        )}
      </div>
      
      {loading ? (
        <p className="loading-message">Loading notes...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : filteredNotes.length === 0 ? (
        <p className="no-results">No notes found. {searchTerm ? 'Try a different search term.' : 'Create your first note!'}</p>
      ) : (
        <NoteList notes={filteredNotes} />
      )}
    </div>
  );
};

export default Home;
