// Game configuration
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SPEED = 150; // milliseconds between moves

// Game state variables
let canvas, ctx;
let snake = [];
let direction = { x: 1, y: 0 };
let food = {};
let score = 0;
let gameRunning = false;
let lastMoveTime = 0;

// DOM elements
let scoreElement, finalScoreElement, gameOverScreen, restartBtn, soundToggle, startScreen, startBtn;

// Audio context for sound effects
let audioContext;
let soundEnabled = true;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    setupEventListeners();
    showStartScreen();
});

/**
 * Initialize game canvas and DOM elements
 */
function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    finalScoreElement = document.getElementById('finalScore');
    gameOverScreen = document.getElementById('gameOverScreen');
    restartBtn = document.getElementById('restartBtn');
    soundToggle = document.getElementById('soundToggle');
    startScreen = document.getElementById('startScreen');
    startBtn = document.getElementById('startBtn');
    
    // Set up canvas for crisp pixel rendering
    ctx.imageSmoothingEnabled = false;
    
    // Initialize audio context
    initializeAudio();
}

/**
 * Initialize Web Audio API for sound effects
 */
function initializeAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
        soundEnabled = false;
    }
}

/**
 * Play sound effect using Web Audio API
 */
function playSound(type) {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'eat':
            // Cheerful eating sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
            
        case 'move':
            // Subtle movement sound
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
            
        case 'gameOver':
            // Game over sound sequence
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
            
        case 'turn':
            // Direction change sound
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.08);
            break;
    }
}

/**
 * Toggle sound effects on/off
 */
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    soundToggle.classList.toggle('muted', !soundEnabled);
    
    // Resume audio context if needed (browsers require user interaction)
    if (soundEnabled && audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

/**
 * Set up event listeners for keyboard input and restart button
 */
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Restart button
    restartBtn.addEventListener('click', restartGame);
    
    // Sound toggle button
    soundToggle.addEventListener('click', toggleSound);
    
    // Start button
    startBtn.addEventListener('click', startGame);
    
    // Prevent arrow keys from scrolling the page
    document.addEventListener('keydown', function(e) {
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });
}

/**
 * Handle keyboard input for snake direction control
 */
function handleKeyPress(event) {
    if (!gameRunning) return;
    
    const key = event.key;
    const oldDirection = { ...direction };
    
    // Prevent snake from reversing into itself
    switch(key) {
        case 'ArrowUp':
            if (direction.y !== 1) {
                direction = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (direction.y !== -1) {
                direction = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (direction.x !== 1) {
                direction = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (direction.x !== -1) {
                direction = { x: 1, y: 0 };
            }
            break;
    }
    
    // Play turn sound if direction changed
    if (direction.x !== oldDirection.x || direction.y !== oldDirection.y) {
        playSound('turn');
    }
}

/**
 * Show the start screen
 */
function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    gameRunning = false;
    
    // Draw empty canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

/**
 * Start a new game
 */
function startGame() {
    // Initialize snake in the center of the canvas
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    // Reset direction to moving right
    direction = { x: 1, y: 0 };
    
    // Reset score
    score = 0;
    updateScore();
    
    // Generate first food
    generateFood();
    
    // Start game loop
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    lastMoveTime = 0;
    gameLoop();
}

/**
 * Restart the game
 */
function restartGame() {
    startGame();
}

/**
 * Main game loop using requestAnimationFrame for smooth animation
 */
function gameLoop(currentTime = 0) {
    if (!gameRunning) return;
    
    // Control game speed
    if (currentTime - lastMoveTime >= INITIAL_SPEED) {
        update();
        lastMoveTime = currentTime;
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

/**
 * Update game state
 */
function update() {
    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Check wall collisions
    if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE || 
        head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
        gameOver();
        return;
    }
    
    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        // Snake grows (don't remove tail)
        score += 10;
        updateScore();
        generateFood();
        playSound('eat');
    } else {
        // Remove tail (snake doesn't grow)
        snake.pop();
        playSound('move');
    }
}

/**
 * Render the game
 */
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw snake
    drawSnake();
    
    // Draw food
    drawFood();
}

/**
 * Draw the snake on the canvas
 */
function drawSnake() {
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4ecdc4' : '#45b7d1'; // Head is bright cyan, body is blue
        ctx.fillRect(
            segment.x * GRID_SIZE + 1, 
            segment.y * GRID_SIZE + 1, 
            GRID_SIZE - 2, 
            GRID_SIZE - 2
        );
        
        // Add eyes to the head
        if (index === 0) {
            ctx.fillStyle = '#1a1a2e';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            if (direction.x === 1) { // Moving right
                ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 12, eyeSize, eyeSize);
            } else if (direction.x === -1) { // Moving left
                ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 12, eyeSize, eyeSize);
            } else if (direction.y === -1) { // Moving up
                ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
            } else if (direction.y === 1) { // Moving down
                ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + 12, eyeSize, eyeSize);
                ctx.fillRect(segment.x * GRID_SIZE + 12, segment.y * GRID_SIZE + 12, eyeSize, eyeSize);
            }
        }
    });
}

/**
 * Draw the food on the canvas
 */
function drawFood() {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(
        food.x * GRID_SIZE + 2, 
        food.y * GRID_SIZE + 2, 
        GRID_SIZE - 4, 
        GRID_SIZE - 4
    );
    
    // Add a small highlight to make food look more appealing
    ctx.fillStyle = '#feca57';
    ctx.fillRect(
        food.x * GRID_SIZE + 6, 
        food.y * GRID_SIZE + 6, 
        GRID_SIZE - 12, 
        GRID_SIZE - 12
    );
}

/**
 * Generate food at a random position not occupied by the snake
 */
function generateFood() {
    const gridWidth = CANVAS_SIZE / GRID_SIZE;
    const gridHeight = CANVAS_SIZE / GRID_SIZE;
    
    let newFood;
    let validPosition = false;
    
    // Keep generating until we find a position not occupied by the snake
    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Check if this position is occupied by the snake
        validPosition = !snake.some(segment => 
            segment.x === newFood.x && segment.y === newFood.y
        );
    }
    
    food = newFood;
}

/**
 * Update the score display
 */
function updateScore() {
    scoreElement.textContent = score;
}

/**
 * Handle game over
 */
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    playSound('gameOver');
}
