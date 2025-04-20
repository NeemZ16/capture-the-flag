import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUsername }) => {
  const [username, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Endpoint URL – adjust if necessary
    const endpoint = 'http://localhost:8000/login';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include', //will include the auth_token cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }), //might have to encrypt just sample for now
      });

      
      
      if (response.ok) {
        const data = response.body; //backend returns plain text
        setMessage(data.message);

        setUsername(username);

        setTimeout(() => navigate('/game'), 1500);//on login redirects to game page
      } else {
        const err = await response.text();
        setMessage(err || "Error during login. Please check your credentials.");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center mt-5">
        <Col md="6">
          <h1 className="text-center mb-4">Login</h1>

          <Form onSubmit={handleLogin}>
            {message && <Alert variant="info">{message}</Alert>}
            
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username</Form.Label>
              <InputGroup>
                <InputGroup.Text>@</InputGroup.Text>
                <Form.Control 
                  type="text"
                  placeholder="Enter username" 
                  value={username}
                  onChange={(e) => setLocalUsername(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>
            
            <Button variant="primary" type="submit">
              Login
            </Button>

            <Button href="/register" variant="outline-primary" type="submit">
              Register
            </Button>
            
          </Form>

        </Col>
      </Row>
    </Container>
  );
};

export default Login;