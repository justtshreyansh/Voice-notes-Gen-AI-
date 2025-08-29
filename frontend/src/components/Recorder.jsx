import React, { useRef, useState } from 'react'
import './Reorder.css';

export default function Recorder({ onUpload }) {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const [recording, setRecording] = useState(false)
  const [title, setTitle] = useState('')

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      await onUpload(blob, title)
      setTitle('')
    }
    mr.start()
    mediaRecorderRef.current = mr
    setRecording(true)
  }

  const stop = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
    setRecording(false)
  }

  return (
    <div className="recorder-container">
      <input
        placeholder="Note title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      {!recording ? (
        <button onClick={start}>Start Recording</button>
      ) : (
        <button onClick={stop}>Stop</button>
      )}
    </div>
  )
}
