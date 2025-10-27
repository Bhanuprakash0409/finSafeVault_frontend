import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import styles from './NoteModal.module.css'; // Import the CSS module

const NoteModal = ({ onClose }) => {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null); // Note being edited or created
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all notes when modal opens
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } }; // ⬅️ FIX: Define config here
        const { data } = await axios.get('http://localhost:5000/api/notes', config);
        setNotes(data);
      } catch (err) {
        setError('Failed to fetch notes.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // ⬅️ FIX: Re-fetch notes if user object changes

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } }; // ⬅️ FIX: Define config here
      if (currentNote._id) {
        // Update existing note
        const { data: updatedNote } = await axios.put(`http://localhost:5000/api/notes/${currentNote._id}`, currentNote, config);
        setNotes((prevNotes) => prevNotes.map((n) => (n._id === updatedNote._id ? updatedNote : n))); // Keep only the correct state update
      } else { // After saving, update the list to reflect the change
        // Create new note
        const { data: newNote } = await axios.post('http://localhost:5000/api/notes', currentNote, config);
        setNotes([newNote, ...notes]);
      }
      setView('list');
      setCurrentNote(null);
    } catch (err) {
      setError('Failed to save the note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } }; // ⬅️ FIX: Define config here
      try {
        await axios.delete(`http://localhost:5000/api/notes/${noteId}`, config);
        setNotes(notes.filter((n) => n._id !== noteId));
      } catch (err) {
        setError('Failed to delete note.');
      }
    }
  };

  const openEditor = (note) => {
    setCurrentNote(note);
    setView('editor');
  };

  const openNewNote = () => {
    openEditor({ title: '', content: '' });
  };

  return (
    <div className={styles.modalBackground} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Universal Close Button */}
        <button onClick={onClose} className={styles.closeButton}>
          &times;
        </button>
        {error && <p className={styles.error}>{error}</p>}

        {view === 'list' && (
          <div>
            <div className={styles.header}>
              <h3>My Notes</h3>
              <button onClick={openNewNote} className={`${styles.button} ${styles.newNoteButton}`}>+ New Note</button>
            </div>
            {isLoading && <p>Loading...</p>}
            <ul className={styles.noteList}>
              {notes.map((note) => (
                <li key={note._id} className={styles.noteItem}>
                  <span onClick={() => openEditor(note)} className={styles.noteTitle}>{note.title}</span>
                  <button onClick={() => handleDelete(note._id)} className={`${styles.button} ${styles.dangerButton}`}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'editor' && currentNote && (
          <div className={styles.editorContainer}>
            <div className={styles.header}>
              <h3>{currentNote._id ? 'Edit Note' : 'Create Note'}</h3>
            </div>
            <input
              type="text"
              value={currentNote.title}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
              placeholder="Note Title"
              className={styles.input}
            />
            <textarea
              value={currentNote.content}
              onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
              className={styles.textarea}
              placeholder="Write your content here..."
            />
            <div className={styles.editorFooter}>
              <button onClick={() => setView('list')} className={`${styles.button} ${styles.secondaryButton}`}>
                Back to List
              </button>
              <button onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={isLoading || !currentNote.title} className={`${styles.button} ${styles.primaryButton}`}>
                {isLoading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteModal;
