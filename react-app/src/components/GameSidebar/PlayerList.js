import React from 'react'
import { ListGroup } from 'react-bootstrap'

export default function PlayerList({ players }) {
  const list = Object.values(players)
  return (
    <div>
      <h3>Players</h3>
      <ListGroup variant="flush">
        {list.map(p => (
          <ListGroup.Item key={p.playerId || p.id}>
            {p.username} {p.team && `(${p.team.toUpperCase()})`}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  )
}