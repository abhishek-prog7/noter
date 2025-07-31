import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Note } from '../models/Note';
import { noteService } from '../services/api';
import './NoteEditor.css';

const NoteEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewNote = !id;
  
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(!isNewNote);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If editing an existing note, fetch it
    if (!isNewNote) {
      const fetchNote = async () => {
        try {
          const note = await noteService.getNote(id);
          setTitle(note.title);
          setContent(note.content);
          setLoading(false);
        } catch (err) {
          setError('Failed to fetch note. Please try again later.');
          setLoading(false);
        }
      };

      fetchNote();
    }
  }, [id, isNewNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSaving(true);
      
      if (isNewNote) {
        await noteService.createNote({
          title,
          content
        });
      } else if (id) {
        await noteService.updateNote(id, {
          title,
          content
        });
      }
      
      // Navigate back to home after saving
      navigate('/');
    } catch (err) {
      setError('Failed to save note. Please try again later.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNewNote || !id) return;
    
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setSaving(true);
        await noteService.deleteNote(id);
        navigate('/');
      } catch (err) {
        setError('Failed to delete note. Please try again later.');
        setSaving(false);
      }
    }
  };

  if (loading) {
    return <p className="loading-message">Loading note...</p>;
  }

  return (
    <div className="note-editor">
      <h2>{isNewNote ? 'Create New Note' : 'Edit Note'}</h2>
      
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            required
            disabled={saving}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note content"
            rows={10}
            disabled={saving}
          />
        </div>
        
        <div className="button-group">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Note'}
          </button>
          
          <button type="button" onClick={() => navigate('/')} className="cancel-btn" disabled={saving}>
            Cancel
          </button>
          
          {!isNewNote && (
            <button type="button" onClick={handleDelete} className="delete-btn" disabled={saving}>
              {saving ? 'Deleting...' : 'Delete Note'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;
