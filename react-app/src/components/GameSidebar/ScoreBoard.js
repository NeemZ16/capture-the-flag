import React from 'react'
import { ListGroup } from 'react-bootstrap'

export default function ScoreBoard({ teamData }) {
  return (
    <div>
      <h3>Scores</h3>
      <ListGroup variant="flush">
        {Object.entries(teamData).map(([team, info]) => (
          <ListGroup.Item key={team}>
            <strong>{team.toUpperCase()}:</strong> {info.score}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  )
}