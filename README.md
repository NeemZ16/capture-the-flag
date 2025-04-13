# Team net::ERR_EMPTY_RESPONSE
CSE 312 Project Spring 2025

Members:
- Neem Zaman
- Anthony Arteaga
- Austin Niver
- Sooseok Kim
- Jake Rah

## Run on Docker
Prerequisites: Docker

Steps:
1. Clone repo
2. Navigate to project directory
3. Run `docker compose up`

## Run Locally
Prerequisites:
- Node
- Docker/MongoDB

Steps (if using mongo in docker):
1. Clone repo
2. Navigate to project directory
   - activate venv if using
3. Start the database: `docker compose -f docker-compose.db-only.yml up`
4. `cd react-app`
5. `npm run dev`

Note: to start server and client separately, you can run `npm run start-backend` and `npm run start`, respectively, from the react-app directory.

## Logging
Logs are generated in the `logs` directory in the project root. 

Logs should currently have the following format:  
[Timestamp] [Log level]: [Sender IP] - [Method] [Path]