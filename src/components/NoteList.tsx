import React from 'react';
import { Note } from '../models/Note';
import NoteItem from './NoteItem';
import './NoteList.css';

interface NoteListProps {
  notes: Note[];
}

const NoteList: React.FC<NoteListProps> = ({ notes }) => {
  if (notes.length === 0) {
    return (
      <div className="empty-notes">
        <p>No notes found. Create your first note!</p>
      </div>
    );
  }

  return (
    <div className="note-list">
      {notes.map(note => (
        <NoteItem key={note.id} note={note} />
      ))}
    </div>
  );
};

export default NoteList;
