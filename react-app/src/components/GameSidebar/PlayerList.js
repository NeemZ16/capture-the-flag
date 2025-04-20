import React from 'react'
import { ListGroup } from 'react-bootstrap'

export default function PlayerList({ players }) {
  return (
    <div>
      <h3>Players</h3>
      <ListGroup variant="flush">
        {Object.entries(players).map(([id, p]) => (
          <ListGroup.Item key={id}>
            {p.username} {p.team && `(${p.team.toUpperCase()})`}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  )
}