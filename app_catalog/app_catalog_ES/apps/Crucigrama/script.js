document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const fileInput = document.getElementById('fileInput');
    const errorContainer = document.getElementById('errorContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const crosswordGrid = document.getElementById('crosswordGrid');
    const acrossClues = document.getElementById('acrossClues');
    const downClues = document.getElementById('downClues');
    const checkBtn = document.getElementById('checkBtn');
    const solutionBtn = document.getElementById('solutionBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const completionMessage = document.getElementById('completionMessage');
    
    // Variables de estado
    let crosswordData = null;
    let solutionGrid = [];
    let currentActiveWord = null;
    
    // Event Listeners
    fileInput.addEventListener('change', handleFileUpload);
    checkBtn.addEventListener('click', checkAnswers);
    solutionBtn.addEventListener('click', showSolution);
    downloadBtn.addEventListener('click', downloadCrossword);
    
    // Manejar subida de archivo
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        showLoading();
        clearError();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const words = parseWordFile(content);
                generateCrossword(words);
            } catch (error) {
                showError(error.message);
            } finally {
                hideLoading();
            }
        };
        reader.readAsText(file);
    }
    
    // Parsear archivo de palabras
    function parseWordFile(content) {
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        return lines.map(line => {
            const parts = line.split(':');
            if (parts.length < 1) {
                throw new Error(`Formato inválido en línea: "${line}"`);
            }
            
            const word = parts[0].trim().toUpperCase();
            if (!word.match(/^[A-ZÁÉÍÓÚÑ]+$/)) {
                throw new Error(`Palabra inválida: "${word}" - Solo letras mayúsculas`);
            }
            
            const clue = parts.slice(1).join(':').trim() || 'Sin pista';
            return { word, clue };
        });
    }
    
    // Generar crucigrama
    function generateCrossword(words) {
        if (words.length < 3) {
            throw new Error("Se necesitan al menos 3 palabras para generar un crucigrama");
        }
        
        // Ordenar palabras por longitud (mayor primero)
        words.sort((a, b) => b.word.length - a.word.length);
        
        // Calcular tamaño del grid
        const gridSize = calculateGridSize(words);
        
        // Crear grid vacío
        const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
        const placedWords = [];
        
        // Colocar primera palabra horizontalmente en el centro
        const firstWord = words[0];
        const firstRow = Math.floor(gridSize / 2);
        const firstCol = Math.floor((gridSize - firstWord.word.length) / 2);
        
        placeWord(grid, firstWord, firstRow, firstCol, 'across', placedWords);
        
        // Intentar colocar las demás palabras
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            if (!tryPlaceWord(grid, word, placedWords)) {
                console.warn(`No se pudo colocar la palabra: ${word.word}`);
            }
        }
        
        // Guardar solución
        solutionGrid = JSON.parse(JSON.stringify(grid));
        
        // Crear grid vacío para el usuario
        const userGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
        placedWords.forEach(word => {
            for (let i = 0; i < word.word.length; i++) {
                const r = word.direction === 'across' ? word.row : word.row + i;
                const c = word.direction === 'across' ? word.col + i : word.col;
                userGrid[r][c] = ''; // Celda vacía para que el usuario complete
            }
        });
        
        // Guardar datos y renderizar
        crosswordData = {
            grid: userGrid,
            words: placedWords,
            size: gridSize
        };
        
        renderCrossword();
        resultContainer.classList.remove('d-none');
    }
    
    // Calcular tamaño del grid
    function calculateGridSize(words) {
        const longestWord = Math.max(...words.map(w => w.word.length));
        const wordCount = words.length;
        
        // Tamaño mínimo: longitud de la palabra más larga + margen
        const minSize = longestWord + 4;
        
        // Tamaño basado en cantidad de palabras
        const wordCountSize = Math.ceil(Math.sqrt(wordCount * 10));
        
        // Usar el mayor de los dos cálculos
        return Math.max(minSize, wordCountSize);
    }
    
    // Intentar colocar una palabra en el grid
    function tryPlaceWord(grid, wordObj, placedWords) {
        const word = wordObj.word;
        
        // Probar diferentes posiciones y direcciones
        for (let attempt = 0; attempt < 100; attempt++) {
            const direction = Math.random() > 0.5 ? 'across' : 'down';
            
            // Buscar posibles intersecciones con palabras existentes
            for (const placedWord of placedWords) {
                if (placedWord.direction === direction) continue;
                
                for (let i = 0; i < word.length; i++) {
                    const letter = word[i];
                    
                    for (let j = 0; j < placedWord.word.length; j++) {
                        if (placedWord.word[j] === letter) {
                            // Calcular posición potencial
                            let row, col;
                            
                            if (direction === 'across') {
                                row = placedWord.row + (placedWord.direction === 'down' ? j : -i);
                                col = placedWord.col + (placedWord.direction === 'across' ? -i : j);
                            } else {
                                row = placedWord.row + (placedWord.direction === 'down' ? -i : j);
                                col = placedWord.col + (placedWord.direction === 'across' ? j : -i);
                            }
                            
                            // Verificar si la posición es válida
                            if (isValidPosition(grid, word, row, col, direction)) {
                                placeWord(grid, wordObj, row, col, direction, placedWords);
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // Verificar si una posición es válida para una palabra
    function isValidPosition(grid, word, row, col, direction) {
        // Verificar límites del grid
        if (direction === 'across') {
            if (col < 0 || col + word.length > grid.length) return false;
            if (row < 0 || row >= grid.length) return false;
        } else {
            if (row < 0 || row + word.length > grid.length) return false;
            if (col < 0 || col >= grid.length) return false;
        }
        
        // Verificar caracteres existentes
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            
            // Si la celda está ocupada con una letra diferente, no es válido
            if (grid[r][c] !== null && grid[r][c] !== word[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    // Colocar una palabra en el grid
    function placeWord(grid, wordObj, row, col, direction, placedWords) {
        const { word, clue } = wordObj;
        
        // Colocar letras en el grid
        for (let i = 0; i < word.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            grid[r][c] = word[i];
        }
        
        // Registrar la palabra colocada
        placedWords.push({
            word,
            clue,
            row,
            col,
            direction,
            number: placedWords.length + 1
        });
    }
    
    // Renderizar el crucigrama
    function renderCrossword() {
        crosswordGrid.innerHTML = '';
        crosswordGrid.style.gridTemplateColumns = `repeat(${crosswordData.size}, 35px)`;
        
        acrossClues.innerHTML = '';
        downClues.innerHTML = '';
        
        // Mapear números de pista
        const wordNumbers = {};
        crosswordData.words.forEach(word => {
            wordNumbers[`${word.row},${word.col}`] = word.number;
        });
        
        // Renderizar celdas
        for (let row = 0; row < crosswordData.size; row++) {
            for (let col = 0; col < crosswordData.size; col++) {
                const cell = document.createElement('div');
                
                if (crosswordData.grid[row][col] === null) {
                    cell.className = 'crossword-cell black';
                } else {
                    cell.className = 'crossword-cell';
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.dataset.row = row;
                    input.dataset.col = col;
                    
                    // Event listeners para la entrada
                    input.addEventListener('input', handleInput);
                    input.addEventListener('focus', () => highlightWord(row, col));
                    input.addEventListener('keydown', handleKeyDown);
                    
                    cell.appendChild(input);
                    
                    // Agregar número de pista si corresponde
                    const key = `${row},${col}`;
                    if (wordNumbers[key]) {
                        const number = document.createElement('span');
                        number.className = 'cell-number';
                        number.textContent = wordNumbers[key];
                        cell.appendChild(number);
                    }
                }
                
                crosswordGrid.appendChild(cell);
            }
        }
        
        // Renderizar pistas
        crosswordData.words.forEach(word => {
            const clueElement = document.createElement('div');
            clueElement.className = 'clue-item';
            clueElement.innerHTML = `<strong>${word.number}.</strong> ${word.clue}`;
            clueElement.dataset.wordNumber = word.number;
            
            clueElement.addEventListener('click', () => {
                highlightWord(word.row, word.col, word.direction);
                focusFirstLetter(word.row, word.col, word.direction);
            });
            
            if (word.direction === 'across') {
                acrossClues.appendChild(clueElement);
            } else {
                downClues.appendChild(clueElement);
            }
        });
    }
    
    // Manejar entrada de texto
    function handleInput(e) {
        const input = e.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        
        // Convertir a mayúsculas
        input.value = input.value.toUpperCase();
        
        // Mover al siguiente input si se ingresó un carácter
        if (input.value.length > 0) {
            moveToNextInput(row, col);
        }
        
        // Verificar si se completó el crucigrama
        checkCompletion();
    }
    
    // Manejar teclas especiales
    function handleKeyDown(e) {
        const input = e.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        
        // Mover con flechas
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveToInput(row - 1, col);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveToInput(row + 1, col);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            moveToInput(row, col - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            moveToInput(row, col + 1);
        } else if (e.key === 'Backspace' && input.value === '') {
            e.preventDefault();
            moveToPreviousInput(row, col);
        }
    }
    
    // Mover al siguiente input
    function moveToNextInput(row, col) {
        // Primero intentar horizontal (derecha)
        if (isValidCell(row, col + 1)) {
            moveToInput(row, col + 1);
        } 
        // Luego vertical (abajo)
        else if (isValidCell(row + 1, col)) {
            moveToInput(row + 1, col);
        }
    }
    
    // Mover al input anterior
    function moveToPreviousInput(row, col) {
        // Primero intentar horizontal (izquierda)
        if (isValidCell(row, col - 1)) {
            moveToInput(row, col - 1);
        } 
        // Luego vertical (arriba)
        else if (isValidCell(row - 1, col)) {
            moveToInput(row - 1, col);
        }
    }
    
    // Mover a un input específico
    function moveToInput(row, col) {
        if (isValidCell(row, col)) {
            const input = document.querySelector(`.crossword-cell input[data-row="${row}"][data-col="${col}"]`);
            if (input) {
                input.focus();
                input.select();
            }
        }
    }
    
    // Verificar si una celda es válida
    function isValidCell(row, col) {
        return row >= 0 && row < crosswordData.size && 
               col >= 0 && col < crosswordData.size && 
               crosswordData.grid[row][col] !== null;
    }
    
    // Resaltar palabra
    function highlightWord(row, col, direction = null) {
        // Quitar resaltado anterior
        document.querySelectorAll('.clue-item').forEach(el => {
            el.classList.remove('active');
        });
        
        document.querySelectorAll('.crossword-cell').forEach(cell => {
            cell.classList.remove('active');
        });
        
        // Encontrar la palabra correspondiente
        let word = null;
        if (direction) {
            word = crosswordData.words.find(w => 
                w.row === row && w.col === col && w.direction === direction);
        } else {
            // Buscar en ambas direcciones
            word = crosswordData.words.find(w => 
                (w.direction === 'across' && w.row === row && col >= w.col && col < w.col + w.word.length) ||
                (w.direction === 'down' && w.col === col && row >= w.row && row < w.row + w.word.length));
        }
        
        if (!word) return;
        
        currentActiveWord = word;
        
        // Resaltar pista
        document.querySelector(`.clue-item[data-word-number="${word.number}"]`).classList.add('active');
        
        // Resaltar celdas
        for (let i = 0; i < word.word.length; i++) {
            const r = word.direction === 'across' ? word.row : word.row + i;
            const c = word.direction === 'across' ? word.col + i : word.col;
            
            const cell = document.querySelector(`.crossword-cell input[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.parentElement.classList.add('active');
            }
        }
    }
    
    // Enfocar primera letra de una palabra
    function focusFirstLetter(row, col, direction) {
        const input = document.querySelector(`.crossword-cell input[data-row="${row}"][data-col="${col}"]`);
        if (input) {
            input.focus();
            input.select();
        }
    }
    
    // Verificar respuestas
    function checkAnswers() {
        let allCorrect = true;
        
        // Limpiar estilos anteriores
        document.querySelectorAll('.crossword-cell').forEach(cell => {
            cell.classList.remove('correct', 'incorrect');
        });
        
        // Verificar cada celda
        for (let row = 0; row < crosswordData.size; row++) {
            for (let col = 0; col < crosswordData.size; col++) {
                if (crosswordData.grid[row][col] !== null) {
                    const input = document.querySelector(`.crossword-cell input[data-row="${row}"][data-col="${col}"]`);
                    if (input) {
                        const userValue = input.value.toUpperCase();
                        const correctValue = solutionGrid[row][col];
                        
                        if (userValue === correctValue) {
                            input.parentElement.classList.add('correct');
                        } else if (userValue !== '') {
                            input.parentElement.classList.add('incorrect');
                            allCorrect = false;
                        } else {
                            allCorrect = false;
                        }
                    }
                }
            }
        }
        
        if (allCorrect) {
            completionMessage.classList.remove('d-none');
        } else {
            completionMessage.classList.add('d-none');
        }
        
        return allCorrect;
    }
    
    // Mostrar solución
    function showSolution() {
        for (let row = 0; row < crosswordData.size; row++) {
            for (let col = 0; col < crosswordData.size; col++) {
                if (crosswordData.grid[row][col] !== null) {
                    const input = document.querySelector(`.crossword-cell input[data-row="${row}"][data-col="${col}"]`);
                    if (input) {
                        input.value = solutionGrid[row][col];
                        input.parentElement.classList.add('correct');
                    }
                }
            }
        }
        
        completionMessage.classList.remove('d-none');
    }
    
    // Verificar si se completó el crucigrama
    function checkCompletion() {
        let complete = true;
        
        for (let row = 0; row < crosswordData.size; row++) {
            for (let col = 0; col < crosswordData.size; col++) {
                if (crosswordData.grid[row][col] !== null) {
                    const input = document.querySelector(`.crossword-cell input[data-row="${row}"][data-col="${col}"]`);
                    if (input && input.value === '') {
                        complete = false;
                        break;
                    }
                }
            }
            if (!complete) break;
        }
        
        if (complete) {
            const isCorrect = checkAnswers();
            if (isCorrect) {
                completionMessage.classList.remove('d-none');
            }
        } else {
            completionMessage.classList.add('d-none');
        }
    }
    
    // Descargar crucigrama
    function downloadCrossword() {
        if (!crosswordData) return;
        
        const zip = new JSZip();
        
        // HTML
        const htmlContent = generateHTMLExport();
        zip.file("crucigrama.html", htmlContent);
        
        // JSON
        const jsonContent = JSON.stringify({
            words: crosswordData.words,
            size: crosswordData.size,
            solution: solutionGrid
        }, null, 2);
        zip.file("crucigrama.json", jsonContent);
        
        // Generar ZIP
        zip.generateAsync({ type: "blob" })
            .then(content => {
                saveAs(content, "crucigrama.zip");
            });
    }
    
    // Generar HTML para exportación
    function generateHTMLExport() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crucigrama Generado</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .crossword-grid { display: grid; gap: 2px; background-color: #343a40; 
                         padding: 5px; border-radius: 5px; margin-bottom: 20px; }
        .crossword-cell { width: 35px; height: 35px; display: flex; 
                         align-items: center; justify-content: center; 
                         background-color: white; position: relative; font-weight: bold; }
        .crossword-cell input { width: 100%; height: 100%; border: none; 
                              text-align: center; font-size: 1.2rem; 
                              text-transform: uppercase; background: transparent; }
        .crossword-cell.black { background-color: #212529; }
        .cell-number { position: absolute; top: 2px; left: 2px; 
                      font-size: 0.6rem; color: #6c757d; }
        .clues-container { display: flex; gap: 30px; margin-top: 20px; }
        .clue-item { padding: 5px 0; border-bottom: 1px dashed #dee2e6; }
        .completion-message { margin-top: 20px; padding: 15px; 
                             background-color: #d4edda; color: #155724; 
                             border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <h1>Crucigrama Generado</h1>
    
    <div class="crossword-grid" style="grid-template-columns: repeat(${crosswordData.size}, 35px);">
        ${generateGridHTML()}
    </div>
    
    <div class="clues-container">
        <div>
            <h3>Horizontales</h3>
            ${generateCluesHTML('across')}
        </div>
        <div>
            <h3>Verticales</h3>
            ${generateCluesHTML('down')}
        </div>
    </div>
    
    <div class="completion-message d-none">
        ¡Felicidades! Has completado el crucigrama correctamente.
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Resaltar palabra al hacer clic en pista
            document.querySelectorAll('.clue-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.querySelectorAll('.clue-item').forEach(el => {
                        el.classList.remove('active');
                    });
                    item.classList.add('active');
                });
            });
            
            // Manejar entrada de texto
            document.querySelectorAll('.crossword-cell input').forEach(input => {
                input.addEventListener('input', function(e) {
                    this.value = this.value.toUpperCase();
                    
                    if (this.value.length > 0) {
                        const row = parseInt(this.dataset.row);
                        const col = parseInt(this.dataset.col);
                        
                        // Mover al siguiente input
                        const nextInput = document.querySelector(
                            '.crossword-cell input[data-row="' + row + '"][data-col="' + (col + 1) + '"]') ||
                            document.querySelector(
                            '.crossword-cell input[data-row="' + (row + 1) + '"][data-col="0"]');
                        
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                });
                
                // Manejar teclas de flecha
                input.addEventListener('keydown', function(e) {
                    const row = parseInt(this.dataset.row);
                    const col = parseInt(this.dataset.col);
                    
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevInput = document.querySelector(
                            '.crossword-cell input[data-row="' + (row - 1) + '"][data-col="' + col + '"]');
                        if (prevInput) prevInput.focus();
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextInput = document.querySelector(
                            '.crossword-cell input[data-row="' + (row + 1) + '"][data-col="' + col + '"]');
                        if (nextInput) nextInput.focus();
                    } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const prevInput = document.querySelector(
                            '.crossword-cell input[data-row="' + row + '"][data-col="' + (col - 1) + '"]');
                        if (prevInput) prevInput.focus();
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        const nextInput = document.querySelector(
                            '.crossword-cell input[data-row="' + row + '"][data-col="' + (col + 1) + '"]');
                        if (nextInput) nextInput.focus();
                    }
                });
            });
        });
    </script>
</body>
</html>`;
    }
    
    function generateGridHTML() {
        let html = '';
        const wordNumbers = {};
        
        crosswordData.words.forEach(word => {
            wordNumbers[`${word.row},${word.col}`] = word.number;
        });
        
        for (let row = 0; row < crosswordData.size; row++) {
            for (let col = 0; col < crosswordData.size; col++) {
                if (crosswordData.grid[row][col] === null) {
                    html += '<div class="crossword-cell black"></div>';
                } else {
                    const key = `${row},${col}`;
                    const number = wordNumbers[key] ? 
                        `<span class="cell-number">${wordNumbers[key]}</span>` : '';
                    html += `
                        <div class="crossword-cell">
                            <input type="text" data-row="${row}" data-col="${col}" maxlength="1">
                            ${number}
                        </div>`;
                }
            }
        }
        
        return html;
    }
    
    function generateCluesHTML(direction) {
        return crosswordData.words
            .filter(word => word.direction === direction)
            .map(word => 
                `<div class="clue-item" data-word-number="${word.number}">
                    <strong>${word.number}.</strong> ${word.clue}
                </div>`
            )
            .join('');
    }
    
    // Helpers
    function showLoading() {
        loadingIndicator.classList.remove('d-none');
        resultContainer.classList.add('d-none');
    }
    
    function hideLoading() {
        loadingIndicator.classList.add('d-none');
    }
    
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('d-none');
    }
    
    function clearError() {
        errorContainer.textContent = '';
        errorContainer.classList.add('d-none');
    }
});