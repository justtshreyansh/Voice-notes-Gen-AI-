import React, { useEffect, useState } from "react";
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  summarizeNote,
} from "./api";
import Recorder from "./components/Recorder";
import "./index.css";
const api = import.meta.env.VITE_API_BASE;

function NoteItem({ note, onUpdate, onDelete, onSummarize }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [transcript, setTranscript] = useState(note.transcript);

  useEffect(() => {
    setTitle(note.title);
    setTranscript(note.transcript);
  }, [note._id]);

  const save = async () => {
    const payload = {};
    if (title !== note.title) payload.title = title;
    if (transcript !== note.transcript) payload.transcript = transcript;
    if (Object.keys(payload).length === 0) return setEditing(false);
    const updated = await onUpdate(note._id, payload);
    setEditing(false);
  };

  return (
    <div className="note-card">
      {editing ? (
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="input"
          />
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={5}
            className="textarea"
          />
          <div className="btn-group">
            <button onClick={save} className="btn btn-primary">
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setTitle(note.title);
                setTranscript(note.transcript);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="note-header">
            <h3>{note.title}</h3>
            <div className="btn-group">
              <button onClick={() => setEditing(true)} className="btn btn-edit">
                Edit
              </button>
              <button
                onClick={() => onDelete(note._id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>

          {note.audioPath && (
            <audio
              controls
              className="audio-player"
              src={`${api}/${note.audioPath}`}
            ></audio>
          )}

          <p className="transcript">
            <strong>Transcript:</strong> {note.transcript}
          </p>

          <div>
            {note.summary ? (
              <div className="summary-box">
                <strong>Summary:</strong>
                <div>{note.summary}</div>
              </div>
            ) : (
              <button
                onClick={() => onSummarize(note._id)}
                disabled={!!note.summary}
                className="btn btn-success"
              >
                Generate Summary
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (e) {
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (blob, title) => {
    const fd = new FormData();
    fd.append("audio", blob, `recording_${Date.now()}.webm`);
    if (title) fd.append("title", title);
    const created = await createNote(fd);
    setNotes((prev) => [created, ...prev]);
  };

  const onUpdate = async (id, payload) => {
    const updated = await updateNote(id, payload);
    setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
    return updated;
  };

  const onDelete = async (id) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  const onSummarize = async (id) => {
    const updated = await summarizeNote(id);
    setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
  };

  return (
    <div className="container">
      <h1 className="app-title">🎙️ Voice Notes + AI</h1>

      <div className="recorder-box">
        <Recorder onUpload={handleUpload} />
      </div>

      <hr />

      {loading ? (
        <p className="status-text">Loading…</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="notes-grid">
          {notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h2>No Notes Yet</h2>
              <p>Your voice notes will appear here after you record one above.</p>
              <small>Tip: Give your note a title before recording for better organization.</small>
            </div>
          ) : (
            notes.map((n) => (
              <NoteItem
                key={n._id}
                note={n}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSummarize={onSummarize}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
