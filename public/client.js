// Game state
let socket;
let currentRoom = null;
let isHost = false;
let gameStarted = false;
let timerInterval = null;
let selectedCells = new Set();
let currentWord = '';

// DOM Elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
    endRound: document.getElementById('end-round-screen')
};

const elements = {
    nicknameInput: document.getElementById('nickname-input'),
    createRoomBtn: document.getElementById('create-room-btn'),
    joinRoomBtn: document.getElementById('join-room-btn'),
    roomCodeInput: document.getElementById('room-code-input'),
    roomCode: document.getElementById('room-code'),
    submitJoinBtn: document.getElementById('submit-join-btn'),
    roomCodeDisplay: document.getElementById('room-code-display'),
    copyRoomCodeBtn: document.getElementById('copy-room-code'),
    gridSize: document.getElementById('grid-size'),
    playerCount: document.getElementById('player-count'),
    playersList: document.getElementById('players'),
    startGameBtn: document.getElementById('start-game-btn'),
    leaveLobbyBtn: document.getElementById('leave-lobby-btn'),
    timer: document.getElementById('timer'),
    leaveGameBtn: document.getElementById('leave-game-btn'),
    gameBoard: document.getElementById('game-board'),
    wordInput: document.getElementById('word-input'),
    submitWordBtn: document.getElementById('submit-word-btn'),
    scoreboardList: document.getElementById('scoreboard-list'),
    playerWords: document.getElementById('player-words'),
    finalScoreboard: document.getElementById('final-scoreboard'),
    playAgainBtn: document.getElementById('play-again-btn'),
    leaveGameEndBtn: document.getElementById('leave-game-end-btn'),
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    errorCloseBtn: document.getElementById('error-close-btn')
};

// Initialize Socket.IO
function initializeSocket() {
    socket = io({
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('disconnect', () => {
        showError('Disconnected from server. Please refresh the page.');
        resetGame();
    });

    socket.on('error', (message) => {
        showError(message);
    });

    socket.on('roomCreated', ({ roomCode }) => {
        currentRoom = roomCode;
        isHost = true;
        elements.roomCodeDisplay.textContent = roomCode;
        elements.gridSize.disabled = false;
        showScreen('lobby');
    });

    socket.on('playerList', (players) => {
        updatePlayerList(players);
        elements.playerCount.textContent = players.length;
        elements.startGameBtn.disabled = !isHost || players.length < 2;
    });

    socket.on('gameStart', ({ board, endTime }) => {
        gameStarted = true;
        initializeGame(board, endTime);
        showScreen('game');
    });

    socket.on('wordAccepted', ({ playerId, nickname, word, score, totalScore }) => {
        if (playerId === socket.id) {
            addWordToList(word, score);
        }
        updateScoreboard();
    });

    socket.on('roundEnd', ({ scores }) => {
        gameStarted = false;
        clearInterval(timerInterval);
        showFinalScores(scores);
        showScreen('endRound');
    });
}

// Screen Management
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.add('active');
}

// Game Initialization
function initializeGame(board, endTime) {
    // Clear previous game state
    selectedCells.clear();
    currentWord = '';
    elements.wordInput.value = '';
    elements.playerWords.innerHTML = '';
    elements.scoreboardList.innerHTML = '';
    
    // Create game board
    elements.gameBoard.innerHTML = '';
    elements.gameBoard.className = `grid-${Math.sqrt(board.length)}`;
    
    board.forEach((letter, index) => {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.textContent = letter;
        cell.dataset.index = index;
        
        cell.addEventListener('click', () => handleCellClick(cell, letter));
        elements.gameBoard.appendChild(cell);
    });

    // Enable word input
    elements.wordInput.disabled = false;
    elements.submitWordBtn.disabled = false;

    // Start timer
    const endTimeMs = new Date(endTime).getTime();
    updateTimer(endTimeMs);
    timerInterval = setInterval(() => updateTimer(endTimeMs), 1000);
}

// Game Logic
function handleCellClick(cell, letter) {
    if (!gameStarted || elements.wordInput.disabled) return;

    const index = parseInt(cell.dataset.index);
    
    if (selectedCells.has(index)) {
        // Deselect cell
        selectedCells.delete(index);
        cell.classList.remove('selected');
    } else {
        // Check if cell is adjacent to last selected cell
        if (selectedCells.size === 0 || isAdjacent(index, Array.from(selectedCells).pop())) {
            selectedCells.add(index);
            cell.classList.add('selected');
        }
    }

    // Update current word
    currentWord = Array.from(selectedCells)
        .sort((a, b) => a - b)
        .map(i => elements.gameBoard.children[i].textContent)
        .join('');
    
    elements.wordInput.value = currentWord;
}

function isAdjacent(index1, index2) {
    const size = Math.sqrt(elements.gameBoard.children.length);
    const row1 = Math.floor(index1 / size);
    const col1 = index1 % size;
    const row2 = Math.floor(index2 / size);
    const col2 = index2 % size;

    return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
}

function submitWord() {
    const word = elements.wordInput.value.trim().toUpperCase();
    if (word.length < 3) return;

    socket.emit('submitWord', { roomCode: currentRoom, word });
    
    // Clear selection
    selectedCells.clear();
    currentWord = '';
    elements.wordInput.value = '';
    Array.from(elements.gameBoard.children).forEach(cell => {
        cell.classList.remove('selected');
    });
}

// UI Updates
function updatePlayerList(players) {
    elements.playersList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.nickname;
        if (player.isHost) {
            li.innerHTML += ' <span class="host-indicator">(Host)</span>';
        }
        elements.playersList.appendChild(li);
    });
}

function updateScoreboard() {
    // This will be populated by the server's wordAccepted event
}

function addWordToList(word, score) {
    const li = document.createElement('li');
    li.textContent = `${word} (${score} points)`;
    li.classList.add('word-accepted');
    elements.playerWords.appendChild(li);
}

function showFinalScores(scores) {
    elements.finalScoreboard.innerHTML = '';
    scores.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'player-score';
        div.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="nickname">${player.nickname}</span>
            <span class="score">${player.score} points</span>
        `;
        elements.finalScoreboard.appendChild(div);
    });
}

function updateTimer(endTimeMs) {
    const now = Date.now();
    const timeLeft = Math.max(0, Math.floor((endTimeMs - now) / 1000));
    
    if (timeLeft === 0) {
        clearInterval(timerInterval);
        elements.timer.textContent = '0';
        elements.wordInput.disabled = true;
        elements.submitWordBtn.disabled = true;
    } else {
        elements.timer.textContent = timeLeft;
    }
}

// Event Listeners
elements.createRoomBtn.addEventListener('click', () => {
    const nickname = elements.nicknameInput.value.trim();
    if (!nickname) {
        showError('Please enter a nickname');
        return;
    }
    socket.emit('createRoom', { nickname });
});

elements.joinRoomBtn.addEventListener('click', () => {
    elements.roomCodeInput.classList.remove('hidden');
});

elements.submitJoinBtn.addEventListener('click', () => {
    const nickname = elements.nicknameInput.value.trim();
    const roomCode = elements.roomCode.value.trim();
    
    if (!nickname) {
        showError('Please enter a nickname');
        return;
    }
    if (!roomCode.match(/^\d{6}$/)) {
        showError('Please enter a valid 6-digit room code');
        return;
    }
    
    socket.emit('joinRoom', { roomCode, nickname });
});

elements.copyRoomCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.roomCodeDisplay.textContent)
        .then(() => {
            const originalText = elements.copyRoomCodeBtn.textContent;
            elements.copyRoomCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
                elements.copyRoomCodeBtn.textContent = originalText;
            }, 2000);
        })
        .catch(() => showError('Failed to copy room code'));
});

elements.startGameBtn.addEventListener('click', () => {
    if (!isHost) return;
    socket.emit('startGame', { roomCode: currentRoom });
});

elements.leaveLobbyBtn.addEventListener('click', resetGame);
elements.leaveGameBtn.addEventListener('click', resetGame);
elements.leaveGameEndBtn.addEventListener('click', resetGame);

elements.playAgainBtn.addEventListener('click', () => {
    if (!isHost) return;
    socket.emit('startGame', { roomCode: currentRoom });
});

elements.submitWordBtn.addEventListener('click', submitWord);
elements.wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitWord();
});

elements.errorCloseBtn.addEventListener('click', () => {
    elements.errorModal.classList.remove('active');
});

// Game Reset
function resetGame() {
    currentRoom = null;
    isHost = false;
    gameStarted = false;
    selectedCells.clear();
    currentWord = '';
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    elements.nicknameInput.value = '';
    elements.roomCode.value = '';
    elements.roomCodeInput.classList.add('hidden');
    elements.gridSize.disabled = true;
    elements.wordInput.disabled = true;
    elements.submitWordBtn.disabled = true;
    
    showScreen('welcome');
    
    if (socket) {
        socket.disconnect();
        initializeSocket();
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', initializeSocket); 