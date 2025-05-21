# Boggle Blitz Online

A real-time multiplayer Boggle-style word game built with Node.js, Express, and Socket.IO.

## Features

- Real-time multiplayer gameplay
- Dynamic 4x4 or 5x5 game boards
- Live scoreboard and word validation
- Room-based matchmaking
- Anti-cheat measures
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/boggle-blitz-online.git
cd boggle-blitz-online
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Game Rules

- Minimum 2 players required to start
- Words must be at least 3 letters long
- Words must be formed using adjacent letters (including diagonals)
- Letters cannot be reused in the same word
- Scoring:
  - 3-4 letters: 1 point
  - 5 letters: 2 points
  - 6 letters: 3 points
  - 7 letters: 5 points
  - 8+ letters: 11 points
- Duplicate words between players score 0 points

## Security

- Server-side word validation
- No client-side scoring
- Input sanitization
- Rate limiting
- XSS protection

## License

MIT License - See LICENSE file for details