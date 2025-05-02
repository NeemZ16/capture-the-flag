import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername]               = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage]                 = useState(null);
  const [variant, setVariant]                 = useState('info');

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setVariant('warning');
      setMessage("Passwords do not match.");
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL + "register";
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include', //will include any cookies that might be added later        
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      //backend returns plain text
      const text = await response.text();   
      if (response.ok) {
        setVariant('success');
        setMessage(text || "Registration successful! Please log in.");
        // Give user a moment to read the message, then redirect: to login page which is at "/"
        setTimeout(() => navigate('/'), 1500);
      } else {
        setVariant('danger');
        setMessage(text || "Registration failed. Try again.");
      }
    } catch (err) {
      setVariant('danger');
      setMessage("Error: " + err.message);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center mt-5">
        <Col md="6">
          <h1 className="text-center mb-4">Register</h1>
          {message && <Alert variant={variant}>{message}</Alert>}

          <Form onSubmit={handleRegister}>
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username</Form.Label>
              <InputGroup>
                <InputGroup.Text>@</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <InputGroup.Text>🔒</InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group controlId="formConfirmPassword" className="mb-4">
              <Form.Label>Confirm Password</Form.Label>
              <InputGroup>
                <InputGroup.Text>🔒</InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Button href="/" variant="outline-primary" type="submit">
              Login
            </Button>
            <Button variant="primary" type="submit">
              Register
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;