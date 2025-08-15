import axios from 'axios';
import { Note } from '../models/Note';

// API Gateway URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Do not set Content-Type globally; keep GET/DELETE as simple requests to avoid CORS preflight
});

// API service for notes - connects to Lambda functions
export const noteService = {
  // Get all notes - connects to GetAllNotes Lambda
  getAllNotes: async (): Promise<Note[]> => {
    try {
      const response = await apiClient.get('/notes');
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Fallback to mock data if API is not available
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        console.warn('Using mock data as fallback');
        return mockNotes();
      }
      throw error;
    }
  },
  
  // Get a single note by id - connects to NoteById Lambda
  getNote: async (id: string): Promise<Note> => {
    try {
      const response = await apiClient.get(`/notes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching note ${id}:`, error);
      // Fallback to mock data if API is not available
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        console.warn('Using mock data as fallback');
        return mockNoteById(id);
      }
      throw error;
    }
  },
  
  // Create a new note - connects to CreateNote Lambda
  createNote: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    try {
      console.log('Making POST request to create note:', note);
      console.log('API URL:', API_BASE_URL);
      
      const response = await apiClient.post('/notes', note, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Create note response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error creating note:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      console.error('Status:', error.response?.status || 'No status');
      
      // Temporarily disable mock data fallback to see actual errors
      console.warn('Mock data fallback disabled - showing actual error');
      // if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      //   console.warn('Using mock data as fallback');
      //   return mockCreateNote(note);
      // }
      throw error;
    }
  },
  
  // Update an existing note - will need to implement this Lambda function
  updateNote: async (id: string, note: Partial<Note>): Promise<Note> => {
    try {
      console.log('Making PUT request to update note:', id, note);
      console.log('API URL:', API_BASE_URL);
      
      const response = await apiClient.put(`/notes/${id}`, note, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Update note response:', response);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating note ${id}:`, error);
      console.error('Error details:', error.response?.data || 'No response data');
      console.error('Status:', error.response?.status || 'No status');
      
      // Temporarily disable mock data fallback to see actual errors
      console.warn('Mock data fallback disabled - showing actual error');
      // if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      //   console.warn('Using mock data as fallback');
      //   return mockUpdateNote(id, note);
      // }
      throw error;
    }
  },
  
  // Delete a note - will need to implement this Lambda function
  deleteNote: async (id: string): Promise<void> => {
    try {
      console.log('Making DELETE request to delete note:', id);
      console.log('API URL:', API_BASE_URL);
      
      const response = await apiClient.delete(`/notes/${id}`);
      console.log('Delete note response:', response);
    } catch (error: any) {
      console.error(`Error deleting note ${id}:`, error);
      console.error('Error details:', error.response?.data || 'No response data');
      console.error('Status:', error.response?.status || 'No status');
      
      // Temporarily disable mock data fallback to see actual errors
      console.warn('Mock data fallback disabled - showing actual error');
      // if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      //   console.warn('Using mock data as fallback');
      //   mockDeleteNote(id);
      //   return;
      // }
      throw error;
    }
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
