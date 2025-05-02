import React, { useEffect, useState, useRef } from 'react';
import { Container, Form, Button, Spinner, Image, Alert } from 'react-bootstrap';

// Base URL for API calls
const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Profile({ username }) {
  // local state for avatar URL, loading state, and messages
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [busy, setBusy]           = useState(false);
  const [message, setMessage]     = useState(null);
  const fileRef                   = useRef();  // reference to file input

  // on mount, fetch current profile data (avatar URL)
  useEffect(() => {
    fetch(`${API}/profile`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAvatarUrl(data.avatarUrl))
      .catch(() => setMessage("Failed to load profile"));
  }, []);

  // handle form submission to upload a new avatar
  const handleSubmit = async e => {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return;  // do nothing if no file chosen

    setBusy(true);
    const form = new FormData();
    form.append('avatar', file);

    try {
      // send POST /avatar with the file
      const res = await fetch(`${API}/avatar`, {
        method: 'POST',
        body: form,
        credentials: 'include'
      });

      if (!res.ok) {
        // display server error message
        const txt = await res.text();
        setMessage(txt);
      } else {
        // on success, update displayed avatar
        const { avatarUrl: newUrl } = await res.json();
        setAvatarUrl(newUrl);
        setMessage("Avatar updated!");
      }
    } catch {
      setMessage("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container
      className="mt-5 d-flex flex-column align-items-center text-center"
      style={{ maxWidth: '400px' }}
    >
      {/* Page title */}
      <h2 className="mb-4">Profile: {username}</h2>

      {/* Show feedback messages */}
      {message && <Alert variant="info" className="w-100">{message}</Alert>}

      <div className="mb-4">
        {avatarUrl ? (
          <Image
            src={`${API}${avatarUrl}`}
            roundedCircle
            width={150}
            height={150}
            style={{ objectFit: 'cover' }} // crop to fill circle
          />
        ) : (
          <div
            style={{
              width: 150,
              height: 150,
              background: '#ccc',      // gray placeholder
              borderRadius: '50%'
            }}
          />
        )}
      </div>

      {/* Upload form */}
      <Form onSubmit={handleSubmit} className="w-100">
        <Form.Group
          controlId="formAvatar"
          className="mb-3 d-flex justify-content-center"
        >
          {/* constrain input width */}
          <Form.Control
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            disabled={busy}
            style={{ maxWidth: '300px' }}
          />
        </Form.Group>

        {/* center the upload button */}
        <div className="d-flex justify-content-center">
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner animation="border" size="sm" /> : 'Upload'}
          </Button>
        </div>
      </Form>
    </Container>
  );
}
