import React from 'react'
import { ListGroup, Button } from 'react-bootstrap'

export default function Controls({ onSimulateKill }) {
  return (
    <div>
      <h3>Controls</h3>
      <ListGroup variant="flush">
        <ListGroup.Item>Move with WASD or arrow keys (hold).</ListGroup.Item>
        <ListGroup.Item>Open dev‑console for live logs.</ListGroup.Item>
      </ListGroup>
      <Button
        variant="danger"
        size="sm"
        onClick={onSimulateKill}
        className="mt-2"
      >
        Simulate Kill
      </Button>
    </div>
  )
}