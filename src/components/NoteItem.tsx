import React from 'react';
import { Link } from 'react-router-dom';
import { Note } from '../models/Note';
import './NoteItem.css';

interface NoteItemProps {
  note: Note;
}

const NoteItem: React.FC<NoteItemProps> = ({ note }) => {
  // Format date to be more readable
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Truncate content if it's too long
  const truncateContent = (content: string, maxLength: number = 100): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="note-item">
      <Link to={`/note/${note.id}`} className="note-link">
        <h3 className="note-title">{note.title}</h3>
        <p className="note-preview">{truncateContent(note.content)}</p>
        <div className="note-meta">
          <span className="note-date">Last updated: {formatDate(note.updatedAt)}</span>
        </div>
      </Link>
    </div>
  );
};

export default NoteItem;
