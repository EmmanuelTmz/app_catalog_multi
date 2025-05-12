// Diccionario de palabras
const wordDictionary = {
    easy: {
        animales: ['perro', 'gato', 'pato', 'oso', 'rata'],
        frutas: ['manzana', 'pera', 'uva', 'kiwi', 'mango']
    },
    medium: {
        paises: ['argentina', 'brasil', 'canada', 'españa', 'japon'],
        profesiones: ['doctor', 'ingeniero', 'maestro', 'arquitecto', 'programador']
    },
    hard: {
        ciencia: ['astronomia', 'biologia', 'quimica', 'fisica', 'matematicas'],
        tecnologia: ['javascript', 'computadora', 'algoritmo', 'aplicacion', 'internet']
    }
};

// Elementos del DOM
const elements = {
    newGameBtn: document.getElementById('newGameBtn'),
    hintBtn: document.getElementById('hintBtn'),
    difficulty: document.getElementById('difficulty'),
    hangmanDrawing: document.getElementById('hangmanDrawing'),
    wordDisplay: document.getElementById('wordDisplay'),
    keyboard: document.getElementById('keyboard'),
    attempts: document.getElementById('attempts'),
    usedLetters: document.getElementById('usedLetters'),
    category: document.getElementById('category'),
    message: document.getElementById('message'),
    messageText: document.getElementById('messageText'),
    playAgainBtn: document.getElementById('playAgainBtn')
};

// Variables del juego
let gameState = {
    word: '',
    category: '',
    guessedLetters: [],
    wrongAttempts: 0,
    maxAttempts: 6,
    gameOver: false
};

// Dibujos del ahorcado
const hangmanDrawings = [
    `
      +---+
      |   |
          |
          |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
          |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
      |   |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|   |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|\\  |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|\\  |
     /    |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|\\  |
     / \\  |
          |
    =========
    `
];

// Inicializar el juego
initGame();

// Event listeners
elements.newGameBtn.addEventListener('click', handleNewGame);
elements.hintBtn.addEventListener('click', showHint);
elements.playAgainBtn.addEventListener('click', initGame);

// Función para manejar nuevo juego
function handleNewGame() {
    const userChoice = confirm("¿Quieres descargar el juego completo?\n(Cancelar para jugar aquí mismo)");
    
    if (userChoice) {
        downloadGameFiles();
    } else {
        initGame();
    }
}

// Función para descargar archivos
function downloadGameFiles() {
    const zip = new JSZip();
    
    // Crear HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juego del Ahorcado</title>
    <link rel="stylesheet" href="ahorcado.css">
</head>
<body>
    ${document.querySelector('.container').outerHTML}
    <script src="ahorcado.js"></script>
</body>
</html>`;
    
    // Crear CSS
    let cssContent = '';
    const styles = document.querySelectorAll('style');
    styles.forEach(style => cssContent += style.textContent);
    
    // Agregar archivos al ZIP
    zip.file("ahorcado.html", htmlContent);
    zip.file("ahorcado.css", cssContent);
    zip.file("ahorcado.js", document.querySelector('script').textContent);
    zip.file("palabras.json", JSON.stringify(wordDictionary));
    
    // Generar y descargar ZIP
    zip.generateAsync({type:"blob"}).then(function(content) {
        const a = document.createElement("a");
        const url = URL.createObjectURL(content);
        a.href = url;
        a.download = "juego-ahorcado.zip";
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0);
    });
}

// [Resto de las funciones del juego permanecen igual...]
function initGame() {
    resetGameState();
    selectRandomWord();
    updateDisplay();
    createKeyboard();
    elements.message.classList.add('hidden');
}

function resetGameState() {
    gameState = {
        word: '',
        category: '',
        guessedLetters: [],
        wrongAttempts: 0,
        maxAttempts: 6,
        gameOver: false
    };
}

function selectRandomWord() {
    const difficulty = elements.difficulty.value;
    const categories = Object.keys(wordDictionary[difficulty]);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const words = wordDictionary[difficulty][randomCategory];
    
    gameState.word = words[Math.floor(Math.random() * words.length)].toLowerCase();
    gameState.category = randomCategory;
}

function updateDisplay() {
    let displayWord = '';
    for (const letter of gameState.word) {
        if (gameState.guessedLetters.includes(letter) || letter === ' ') {
            displayWord += letter + ' ';
        } else {
            displayWord += '_ ';
        }
    }
    elements.wordDisplay.textContent = displayWord.trim();
    
    elements.hangmanDrawing.textContent = hangmanDrawings[gameState.wrongAttempts];
    elements.attempts.textContent = gameState.maxAttempts - gameState.wrongAttempts;
    elements.usedLetters.textContent = gameState.guessedLetters.join(', ');
    elements.category.textContent = gameState.category.charAt(0).toUpperCase() + gameState.category.slice(1);
    
    checkGameStatus();
}

function createKeyboard() {
    elements.keyboard.innerHTML = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    
    for (const letter of alphabet) {
        const button = document.createElement('button');
        button.textContent = letter;
        button.addEventListener('click', () => handleLetterClick(letter));
        
        if (gameState.guessedLetters.includes(letter)) {
            button.disabled = true;
            if (gameState.word.includes(letter)) {
                button.classList.add('correct-letter');
            } else {
                button.classList.add('used-letter');
            }
        }
        
        elements.keyboard.appendChild(button);
    }
}

function handleLetterClick(letter) {
    if (gameState.gameOver) return;
    
    if (!gameState.guessedLetters.includes(letter)) {
        gameState.guessedLetters.push(letter);
        
        if (!gameState.word.includes(letter)) {
            gameState.wrongAttempts++;
        }
        
        updateDisplay();
        createKeyboard();
    }
}

function checkGameStatus() {
    const wordGuessed = [...gameState.word].every(letter => 
        gameState.guessedLetters.includes(letter) || letter === ' '
    );
    
    if (wordGuessed) {
        endGame(true);
        return;
    }
    
    if (gameState.wrongAttempts >= gameState.maxAttempts) {
        endGame(false);
    }
}

function endGame(win) {
    gameState.gameOver = true;
    elements.message.classList.remove('hidden');
    
    if (win) {
        elements.messageText.textContent = `¡Ganaste! La palabra era: ${gameState.word}`;
    } else {
        elements.messageText.textContent = `¡Perdiste! La palabra era: ${gameState.word}`;
    }
}

function showHint() {
    if (gameState.gameOver || gameState.guessedLetters.length === 0) return;
    
    const unguessedLetters = [...gameState.word].filter(letter => 
        !gameState.guessedLetters.includes(letter) && letter !== ' '
    );
    
    if (unguessedLetters.length > 0) {
        const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
        gameState.guessedLetters.push(randomLetter);
        updateDisplay();
        createKeyboard();
    }
}

// Manejar entrada de teclado
document.addEventListener('keydown', function(e) {
    if (gameState.gameOver) return;
    
    const key = e.key.toLowerCase();
    if (/^[a-z]$/.test(key) && !gameState.guessedLetters.includes(key)) {
        handleLetterClick(key);
    }
});