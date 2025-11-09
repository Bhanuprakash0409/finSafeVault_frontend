import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import styles from './NoteModal.module.css'; // Import the CSS module

// ⬅️ CRITICAL FIX: Use the LIVE DEPLOYED API URL
const BASE_URL = 'https://finsafe-tracker-api.onrender.com/api/notes';

const NoteModal = ({ onClose }) => {
    const { user } = useContext(AuthContext);
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState(null); // Note being edited or created
    const [view, setView] = useState('list'); // 'list' or 'editor'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Utility Function to Build Headers ---
    const getConfig = () => ({
        headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json' 
        }
    });

    // Fetch all notes when modal opens
    useEffect(() => {
        if (!user || !user.token) {
            setError('User not authenticated.');
            return;
        }

        const fetchNotes = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch all notes for the logged-in user
                const { data } = await axios.get(BASE_URL, getConfig());
                setNotes(data);
            } catch (err) {
                console.error("Note Fetch Error:", err.response?.data || err.message);
                setError('Failed to fetch notes.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Re-fetch notes if user object changes

    const handleSave = async () => {
        setIsLoading(true);
        setError('');
        try {
            const config = getConfig();
            let savedNote;

            if (currentNote._id) {
                // Update existing note
                const { data } = await axios.put(`${BASE_URL}/${currentNote._id}`, currentNote, config);
                savedNote = data;
                setNotes((prevNotes) => 
                    prevNotes.map((n) => (n._id === savedNote._id ? savedNote : n))
                ); 
            } else {
                // Create new note
                const { data } = await axios.post(BASE_URL, currentNote, config);
                savedNote = data;
                setNotes([savedNote, ...notes]);
            }

            setView('list');
            setCurrentNote(null);
        } catch (err) {
            console.error("Note Save Error:", err.response?.data || err.message);
            setError('Failed to save the note. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await axios.delete(`${BASE_URL}/${noteId}`, getConfig());
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
        // Initialize new note with empty title and content
        openEditor({ title: '', content: '' }); 
    };

    // --- Render Logic ---
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
                        {isLoading && <p>Loading Notes...</p>}
                        <ul className={styles.noteList}>
                            {notes.map((note) => (
                                <li key={note._id} className={styles.noteItem}>
                                    <span onClick={() => openEditor(note)} className={styles.noteTitle}>{note.title}</span>
                                    <button onClick={() => handleDelete(note._id)} className={`${styles.button} ${styles.dangerButton}`}>Delete</button>
                                </li>
                            ))}
                        </ul>
                        {!isLoading && notes.length === 0 && <p className={styles.noNotes}>No notes found. Click '+ New Note' to start.</p>}
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
                            {/* Removed redundant Cancel button */}
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