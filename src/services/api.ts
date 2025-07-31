import axios from 'axios';
import { Note } from '../models/Note';

// This would be your API Gateway URL in production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-gateway-url.execute-api.region.amazonaws.com/stage';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API service for notes
export const noteService = {
  // Get all notes
  getAllNotes: async (): Promise<Note[]> => {
    // For development without backend, return mock data
    if (!process.env.REACT_APP_API_URL) {
      return mockNotes();
    }
    
    const response = await apiClient.get('/notes');
    return response.data;
  },
  
  // Get a single note by id
  getNote: async (id: string): Promise<Note> => {
    // For development without backend, return mock data
    if (!process.env.REACT_APP_API_URL) {
      return mockNoteById(id);
    }
    
    const response = await apiClient.get(`/notes/${id}`);
    return response.data;
  },
  
  // Create a new note
  createNote: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    // For development without backend, return mock data
    if (!process.env.REACT_APP_API_URL) {
      return mockCreateNote(note);
    }
    
    const response = await apiClient.post('/notes', note);
    return response.data;
  },
  
  // Update an existing note
  updateNote: async (id: string, note: Partial<Note>): Promise<Note> => {
    // For development without backend, return mock data
    if (!process.env.REACT_APP_API_URL) {
      return mockUpdateNote(id, note);
    }
    
    const response = await apiClient.put(`/notes/${id}`, note);
    return response.data;
  },
  
  // Delete a note
  deleteNote: async (id: string): Promise<void> => {
    // For development without backend, do nothing
    if (!process.env.REACT_APP_API_URL) {
      mockDeleteNote(id);
      return;
    }
    
    await apiClient.delete(`/notes/${id}`);
  }
};

// Mock data functions for development without backend
// In a real app, these would be replaced by actual API calls

// Mock notes storage
let mockNotesData: Note[] = [
  {
    id: '1',
    title: 'Welcome to Noter',
    content: 'This is your first note! You can edit or delete this note, or create new ones.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'How to use Noter',
    content: 'Create, edit, and delete notes easily. Your notes will be stored in the cloud and accessible from anywhere.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function mockNotes(): Promise<Note[]> {
  return Promise.resolve([...mockNotesData]);
}

function mockNoteById(id: string): Promise<Note> {
  const note = mockNotesData.find(note => note.id === id);
  
  if (!note) {
    return Promise.reject(new Error('Note not found'));
  }
  
  return Promise.resolve({...note});
}

function mockCreateNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const now = new Date().toISOString();
  const newNote: Note = {
    id: Date.now().toString(),
    ...noteData,
    createdAt: now,
    updatedAt: now
  };
  
  mockNotesData.push(newNote);
  return Promise.resolve({...newNote});
}

function mockUpdateNote(id: string, noteData: Partial<Note>): Promise<Note> {
  const index = mockNotesData.findIndex(note => note.id === id);
  
  if (index === -1) {
    return Promise.reject(new Error('Note not found'));
  }
  
  const updatedNote: Note = {
    ...mockNotesData[index],
    ...noteData,
    updatedAt: new Date().toISOString()
  };
  
  mockNotesData[index] = updatedNote;
  return Promise.resolve({...updatedNote});
}

function mockDeleteNote(id: string): Promise<void> {
  mockNotesData = mockNotesData.filter(note => note.id !== id);
  return Promise.resolve();
}
