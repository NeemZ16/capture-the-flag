import React from 'react'
import { Button } from 'react-bootstrap'
import PlayerList from './PlayerList'
import ScoreBoard from './ScoreBoard'
import Controls   from './Controls'

export default function GameSidebar({
  username,
  onLogout,
  players,
  teamData,
  remaining,
  onSimulateKill
}) {
  return (
    <div>
      <div className="mb-3">
        <h2>Welcome, {username}!</h2>
        <Button variant="secondary" onClick={onLogout}>
          Logout
        </Button>
      </div>

      <p className="mb-3">
        <strong>Time Left:</strong> {remaining}s
      </p>

      <ScoreBoard   teamData={teamData}   />
      <PlayerList   players={players}     />
      <Controls     onSimulateKill={onSimulateKill} />
    </div>
  )
}