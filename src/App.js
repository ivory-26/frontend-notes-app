// frontend-notes-app/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; // You can add some basic CSS here

// IMPORTANT: Replace with your deployed Render backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-notes-app-2k55.onrender.com/'; 

function App() {
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    if (useLocalStorage) {
      // Load from localStorage
      const savedNotes = localStorage.getItem('notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setMessage('Backend unavailable. Switching to local storage mode.');
      setUseLocalStorage(true);
      // Load from localStorage as fallback
      const savedNotes = localStorage.getItem('notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      setMessage('Please enter both title and content for the note.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    setIsLoading(true);
    setMessage('');

    if (useLocalStorage) {
      // Local storage mode
      const newNote = {
        _id: Date.now().toString(),
        title: newNoteTitle,
        content: newNoteContent,
        createdAt: new Date().toISOString()
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNewNoteTitle('');
      setNewNoteContent('');
      setMessage('Note added successfully! (Local Storage)');
      setTimeout(() => setMessage(''), 3000);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to add note to:', `${API_BASE_URL}/api/notes`);
      console.log('Note data:', { title: newNoteTitle, content: newNoteContent });
      
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newNoteTitle, content: newNoteContent }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const addedNote = await response.json();
      console.log('Added note:', addedNote);
      setNotes([addedNote, ...notes]); // Add to top
      setNewNoteTitle('');
      setNewNoteContent('');
      setMessage('Note added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Detailed error adding note:", error);
      // Fallback to local storage
      setMessage('Backend error. Switching to local storage mode.');
      setUseLocalStorage(true);
      
      const newNote = {
        _id: Date.now().toString(),
        title: newNoteTitle,
        content: newNoteContent,
        createdAt: new Date().toISOString()
      };
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNewNoteTitle('');
      setNewNoteContent('');
      setMessage('Note added successfully! (Local Storage)');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (useLocalStorage) {
      // Local storage mode
      const updatedNotes = notes.filter(note => note._id !== id);
      setNotes(updatedNotes);
      localStorage.setItem('notes', JSON.stringify(updatedNotes));
      setMessage('Note deleted successfully! (Local Storage)');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNotes(notes.filter(note => note._id !== id));
      setMessage('Note deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error deleting note:", error);
      // Fallback to local storage
      const updatedNotes = notes.filter(note => note._id !== id);
      setNotes(updatedNotes);
      localStorage.setItem('notes', JSON.stringify(updatedNotes));
      setMessage('Note deleted successfully! (Local Storage)');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="App">
      <h1>My Simple Notes App</h1>
      
      {useLocalStorage && (
        <div className="status-indicator">
          📱 Local Mode - Notes saved to browser storage
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleAddNote} className="note-form">
        <input
          type="text"
          placeholder="Note Title"
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
          required
          disabled={isLoading}
        />
        <textarea
          placeholder="Note Content"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          required
          disabled={isLoading}
        ></textarea>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding Note...' : 'Add Note'}
        </button>
      </form>

      <div className="notes-list">
        {notes.length === 0 ? (
            <p>No notes yet. Add one above!</p>
        ) : (
            notes.map((note) => (
                <div key={note._id} className="note-item">
                    <h2>{note.title}</h2>
                    <p>{note.content}</p>
                    <small>Created: {new Date(note.createdAt).toLocaleDateString()}</small>
                    <button onClick={() => handleDeleteNote(note._id)}>Delete</button>
                </div>
            ))
        )}
      </div>
    </div>
  );
}

export default App;