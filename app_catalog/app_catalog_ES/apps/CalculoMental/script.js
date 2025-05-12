document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const generatorScreen = document.getElementById('generator-screen');
    const gameScreen = document.getElementById('game-screen');
    const fileInput = document.getElementById('fileInput');
    const validateBtn = document.getElementById('validateBtn');
    const validationResult = document.getElementById('validationResult');
    const startGameBtn = document.getElementById('startGameBtn');
    const operationDisplay = document.getElementById('operation-display');
    const optionsContainer = document.getElementById('options-container');
    const restartBtn = document.getElementById('restart-btn');
    const scoreDisplay = document.getElementById('score-display');
    const backBtn = document.getElementById('back-btn');

    // Variables del juego
    let gameData = {
        operation: "",
        options: [],
        displayTime: 500
    };
    let score = 0;
    let currentOperation = [];
    let correctAnswer = 0;

    // Event Listeners
    validateBtn.addEventListener('click', validateFile);
    startGameBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    backBtn.addEventListener('click', backToGenerator);

    // Función para validar el archivo
    function validateFile() {
        const file = fileInput.files[0];
        if (!file) {
            showValidationResult('❌ Selecciona un archivo primero', false);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const lines = content.split('\n').map(line => line.trim()).filter(line => line !== '');

            if (lines.length < 2) {
                showValidationResult('❌ El archivo debe tener al menos 2 líneas', false);
                return;
            }

            // Validar operación
            const operation = lines[0];
            if (!/^(\d+)(,[+\-*/]\d+)*$/.test(operation)) {
                showValidationResult('❌ Formato de operación inválido', false);
                return;
            }

            // Validar opciones
            const options = lines.slice(1);
            let hasCorrect = false;
            const validOptions = options.map(option => {
                const isCorrect = option.endsWith('*');
                if (isCorrect) hasCorrect = true;
                return {
                    text: option.replace('*', ''),
                    isCorrect: isCorrect
                };
            });

            if (!hasCorrect) {
                showValidationResult('❌ Falta la respuesta correcta (marcar con *)', false);
                return;
            }

            gameData.operation = operation;
            gameData.options = validOptions;
            showValidationResult('✅ Archivo válido!', true);
            document.getElementById('game-options').classList.remove('hidden');
        };
        reader.readAsText(file);
    }

    function showValidationResult(message, isSuccess) {
        validationResult.textContent = message;
        validationResult.className = isSuccess ? 'success' : 'error';
    }

    function startGame() {
        gameData.displayTime = parseInt(document.getElementById('displayTime').value) || 500;
        score = 0;
        updateScore();
        parseOperation();
        showGameScreen();
        showCurrentOperation();
    }

    function parseOperation() {
        const parts = gameData.operation.split(',');
        currentOperation = parts.map((part, index) => {
            if (index === 0) {
                return { type: 'number', value: parseFloat(part) };
            } else {
                return {
                    type: 'operation',
                    operator: part[0],
                    value: parseFloat(part.slice(1))
                };
            }
        });
        correctAnswer = calculateResult();
    }

    function calculateResult() {
        let result = currentOperation[0].value;
        
        // Primero multiplicaciones y divisiones
        for (let i = 1; i < currentOperation.length; i++) {
            const { operator, value } = currentOperation[i];
            if (operator === '*' || operator === '/') {
                if (operator === '*') {
                    result *= value;
                } else {
                    result /= value;
                }
            }
        }
        
        // Luego sumas y restas
        for (let i = 1; i < currentOperation.length; i++) {
            const { operator, value } = currentOperation[i];
            if (operator === '+' || operator === '-') {
                if (operator === '+') {
                    result += value;
                } else {
                    result -= value;
                }
            }
        }
        
        return result;
    }

    function showGameScreen() {
        generatorScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
    }

    function showCurrentOperation() {
        operationDisplay.textContent = '';
        let operationText = '';
        
        currentOperation.forEach((part, index) => {
            if (index === 0) {
                operationText += part.value;
            } else {
                operationText += ` ${part.operator} ${part.value}`;
            }
        });
        
        operationDisplay.textContent = operationText;
        showOptions();
    }

    function showOptions() {
        optionsContainer.innerHTML = '';
        
        gameData.options.forEach(option => {
            const btn = document.createElement('button');
            btn.textContent = option.text;
            
            btn.addEventListener('click', () => {
                checkAnswer(option.isCorrect, btn);
            });
            
            optionsContainer.appendChild(btn);
        });
    }

    function checkAnswer(isCorrect, button) {
        if (isCorrect) {
            button.classList.add('correct');
            score++;
            updateScore();
            setTimeout(() => {
                parseOperation();
                showCurrentOperation();
            }, 1000);
        } else {
            button.classList.add('incorrect');
            // Mostrar la correcta
            document.querySelectorAll('#options-container button').forEach(btn => {
                if (parseFloat(btn.textContent) === correctAnswer) {
                    btn.classList.add('correct');
                }
            });
        }
    }

    function updateScore() {
        scoreDisplay.textContent = `Puntos: ${score}`;
    }

    function restartGame() {
        parseOperation();
        showCurrentOperation();
    }

    function backToGenerator() {
        gameScreen.classList.add('hidden');
        generatorScreen.classList.remove('hidden');
        validationResult.textContent = '';
    }
});