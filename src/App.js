import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for login status
  const [username, setUsername] = useState(''); // New state for username
  const [password, setPassword] = useState(''); // New state for password
  const [token, setToken] = useState(null); // New state for JWT token
  const [currentUsername, setCurrentUsername] = useState(''); // To display logged in user

  // Load token from localStorage on initial render
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (storedToken && storedUsername) {
      setToken(storedToken);
      setCurrentUsername(storedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  // fetchNotes now depends on 'token' and 'isLoggedIn'
  const fetchNotes = useCallback(async () => {
    if (!isLoggedIn || !token) {
      setNotes([]); // Clear notes if not logged in
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        headers: {
          'x-auth-token': token // Send the token with the request
        }
      });
      if (!response.ok) {
        // If token is invalid or expired, force logout
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          setMessage('Session expired or invalid. Please log in again.');
          setTimeout(() => setMessage(''), 4000);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setMessage('Error fetching notes. Please try again.'); // More generic error message
      setTimeout(() => setMessage(''), 4000);
    }
  }, [API_BASE_URL, isLoggedIn, token, handleLogout]); // Add handleLogout to useCallback deps

  // Use effect to fetch notes when login status or token changes
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, isLoggedIn, token]); // Add isLoggedIn and token here

  const handleAuth = async (isRegister) => {
    setIsLoading(true);
    setMessage('');
    try {
      const endpoint = isRegister ? 'register' : 'login';
      const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      setToken(data.token);
      setCurrentUsername(data.username);
      setIsLoggedIn(true);
      setMessage(isRegister ? 'Registration successful! You are now logged in.' : 'Login successful!');
      setTimeout(() => setMessage(''), 3000);
      setUsername('');
      setPassword('');
      // After successful auth, fetch notes
      fetchNotes(); 
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(`Error: ${error.message}`);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !token) {
      setMessage('Please log in to add notes.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      setMessage('Please enter both title and content for the note.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token // Send token for protected route
        },
        body: JSON.stringify({ title: newNoteTitle, content: newNoteContent }),
      });

      const addedNote = await response.json();
      if (!response.ok) {
          // If token is invalid or expired, force logout
          if (response.status === 401 || response.status === 403) {
              handleLogout();
              setMessage('Session expired or invalid. Please log in again.');
              setTimeout(() => setMessage(''), 4000);
              return;
          }
          throw new Error(addedNote.message || `HTTP error! status: ${response.status}`);
      }

      setNotes([addedNote, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setMessage('Note added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error adding note:", error);
      setMessage(`Error adding note: ${error.message}`);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!isLoggedIn || !token) {
      setMessage('Please log in to delete notes.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token // Send token for protected route
        }
      });

      const responseData = await response.json();
      if (!response.ok) {
          // If token is invalid or expired, force logout
          if (response.status === 401 || response.status === 403) {
              handleLogout();
              setMessage('Session expired or invalid. Please log in again.');
              setTimeout(() => setMessage(''), 4000);
              return;
          }
          throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      setNotes(notes.filter(note => note._id !== id));
      setMessage('Note deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error deleting note:", error);
      setMessage(`Error deleting note: ${error.message}`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // handleLogout needs to be defined in App.js scope
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setIsLoggedIn(false);
    setCurrentUsername('');
    setNotes([]); // Clear notes on logout
    setMessage('Logged out successfully.');
    setTimeout(() => setMessage(''), 3000);
  }, []); // No dependencies, as it only clears local state/storage

  return (
    <div className="App">
      <h1>My Simple Notes App</h1>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {!isLoggedIn ? (
        <form onSubmit={(e) => { e.preventDefault(); handleAuth(false); }} className="auth-form">
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Login'}
          </button>
          <p>
            Don't have an account?{' '}
            <button type="button" onClick={() => handleAuth(true)} disabled={isLoading}>
              Register
            </button>
          </p>
        </form>
      ) : (
        <>
          <div className="auth-status">
            <p>Logged in as: <strong>{currentUsername}</strong></p>
            <button onClick={handleLogout}>Logout</button>
          </div>

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
        </>
      )}
    </div>
  );
}

export default App;