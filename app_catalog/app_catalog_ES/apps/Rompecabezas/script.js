document.addEventListener('DOMContentLoaded', function() {
    const imageUpload = document.getElementById('image-upload');
    const fileName = document.getElementById('file-name');
    const originalImage = document.getElementById('original-image');
    const puzzleBoard = document.getElementById('puzzle-board');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const difficultySelect = document.getElementById('difficulty');
    
    let puzzlePieces = [];
    let emptyPosition = { row: 0, col: 0 };
    
    // Configuración de dificultad
    const difficultySettings = {
        easy: { rows: 3, cols: 3, shuffleMoves: 20 },
        medium: { rows: 4, cols: 4, shuffleMoves: 50 },
        hard: { rows: 5, cols: 5, shuffleMoves: 100 }
    };
    
    // Mostrar nombre del archivo subido
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage.src = event.target.result;
                originalImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            fileName.textContent = 'Ningún archivo seleccionado';
        }
    });
    
    // Generar rompecabezas
    generateBtn.addEventListener('click', function() {
        if (!originalImage.src || originalImage.src === '') {
            alert('Por favor, sube una imagen primero.');
            return;
        }
        
        const difficulty = difficultySelect.value;
        const settings = difficultySettings[difficulty];
        
        createPuzzleBoard(settings.rows, settings.cols, settings.shuffleMoves);
    });
    
    // Descargar rompecabezas
    downloadBtn.addEventListener('click', function() {
        if (!puzzlePieces.length) {
            alert('Genera un rompecabezas primero.');
            return;
        }
        
        downloadAsZip();
    });
    
    function createPuzzleBoard(rows, cols, shuffleMoves) {
        puzzleBoard.innerHTML = '';
        puzzleBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        puzzleBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        puzzlePieces = [];
        
        // Crear piezas ordenadas
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.dataset.row = row;
                piece.dataset.col = col;
                piece.dataset.originalRow = row;
                piece.dataset.originalCol = col;
                
                // Calcular posición del background
                const bgPosX = -col * 100;
                const bgPosY = -row * 100;
                piece.style.backgroundImage = `url('${originalImage.src}')`;
                piece.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
                piece.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
                
                piece.addEventListener('click', () => movePiece(row, col));
                
                puzzlePieces.push({
                    element: piece,
                    row,
                    col,
                    originalRow: row,
                    originalCol: col
                });
                
                puzzleBoard.appendChild(piece);
            }
        }
        
        // Mezclar las piezas
        shufflePieces(shuffleMoves);
    }
    
    function shufflePieces(shuffleMoves) {
        const difficulty = difficultySelect.value;
        const { rows, cols } = difficultySettings[difficulty];
        
        // Establecer la última pieza como vacía
        emptyPosition = { row: rows - 1, col: cols - 1 };
        const emptyPiece = puzzlePieces.find(p => p.row === emptyPosition.row && p.col === emptyPosition.col);
        emptyPiece.element.classList.add('empty-piece');
        emptyPiece.element.style.backgroundImage = 'none';
        
        // Realizar movimientos aleatorios
        let lastMove = null;
        for (let i = 0; i < shuffleMoves; i++) {
            const adjacentPieces = getAdjacentPieces(emptyPosition.row, emptyPosition.col)
                .filter(p => !lastMove || p.row !== lastMove.row || p.col !== lastMove.col);
            
            if (adjacentPieces.length > 0) {
                const randomPiece = adjacentPieces[Math.floor(Math.random() * adjacentPieces.length)];
                swapPieces(randomPiece.row, randomPiece.col, emptyPosition.row, emptyPosition.col);
                lastMove = { row: emptyPosition.row, col: emptyPosition.col };
            }
        }
    }
    
    function getAdjacentPieces(row, col) {
        const difficulty = difficultySelect.value;
        const { rows, cols } = difficultySettings[difficulty];
        const adjacent = [];
        
        // Arriba
        if (row > 0) adjacent.push({ row: row - 1, col });
        // Abajo
        if (row < rows - 1) adjacent.push({ row: row + 1, col });
        // Izquierda
        if (col > 0) adjacent.push({ row, col: col - 1 });
        // Derecha
        if (col < cols - 1) adjacent.push({ row, col: col + 1 });
        
        return adjacent.map(pos => puzzlePieces.find(p => p.row === pos.row && p.col === pos.col));
    }
    
    function movePiece(row, col) {
        const piece = puzzlePieces.find(p => p.row === row && p.col === col);
        
        // Verificar si la pieza está adyacente al espacio vacío
        const rowDiff = Math.abs(piece.row - emptyPosition.row);
        const colDiff = Math.abs(piece.col - emptyPosition.col);
        
        if ((rowDiff === 1 && colDiff === 0) || (colDiff === 1 && rowDiff === 0)) {
            swapPieces(piece.row, piece.col, emptyPosition.row, emptyPosition.col);
            checkCompletion();
        }
    }
    
    function swapPieces(row1, col1, row2, col2) {
        const piece1 = puzzlePieces.find(p => p.row === row1 && p.col === col1);
        const piece2 = puzzlePieces.find(p => p.row === row2 && p.col === col2);
        
        // Intercambiar posiciones
        [piece1.row, piece2.row] = [piece2.row, piece1.row];
        [piece1.col, piece2.col] = [piece2.col, piece1.col];
        
        // Actualizar atributos de datos
        piece1.element.dataset.row = piece1.row;
        piece1.element.dataset.col = piece1.col;
        piece2.element.dataset.row = piece2.row;
        piece2.element.dataset.col = piece2.col;
        
        // Actualizar clases de espacio vacío
        if (piece1.element.classList.contains('empty-piece')) {
            piece1.element.classList.remove('empty-piece');
            piece1.element.style.backgroundImage = `url('${originalImage.src}')`;
            piece2.element.classList.add('empty-piece');
            piece2.element.style.backgroundImage = 'none';
            emptyPosition = { row: row2, col: col2 };
        } else if (piece2.element.classList.contains('empty-piece')) {
            piece2.element.classList.remove('empty-piece');
            piece2.element.style.backgroundImage = `url('${originalImage.src}')`;
            piece1.element.classList.add('empty-piece');
            piece1.element.style.backgroundImage = 'none';
            emptyPosition = { row: row1, col: col1 };
        }
    }
    
    function checkCompletion() {
        const isComplete = puzzlePieces.every(piece => 
            piece.row === piece.originalRow && piece.col === piece.originalCol
        );
        
        if (isComplete) {
            setTimeout(() => {
                alert('¡Felicidades! Has completado el rompecabezas.');
                // Mostrar la imagen completa
                puzzlePieces.forEach(piece => {
                    piece.element.classList.remove('empty-piece');
                    piece.element.style.backgroundImage = `url('${originalImage.src}')`;
                });
            }, 100);
        }
    }
    
    function downloadAsZip() {
        const zip = new JSZip();
        const folder = zip.folder("rompecabezas_pixel");
        
        // Agregar los archivos al ZIP
        folder.file("index.html", generateDownloadableHTML());
        
        // Agregar la imagen si existe
        if (originalImage.src && originalImage.src !== '') {
            fetch(originalImage.src)
                .then(response => response.blob())
                .then(blob => {
                    folder.file("imagen_rompecabezas.png", blob);
                    
                    // Generar el ZIP y descargarlo
                    zip.generateAsync({ type: "blob" })
                        .then(content => {
                            saveAs(content, "rompecabezas_pixel.zip");
                        });
                });
        } else {
            // Generar el ZIP sin imagen
            zip.generateAsync({ type: "blob" })
                .then(content => {
                    saveAs(content, "rompecabezas_pixel.zip");
                });
        }
    }
    
    function generateDownloadableHTML() {
        const difficulty = difficultySelect.value;
        const settings = difficultySettings[difficulty];
        
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rompecabezas Pixel</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background-color: #f0f0f0;
            color: #333;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: #444;
            margin-bottom: 30px;
        }
        .puzzle-board {
            display: grid;
            grid-template-columns: repeat(${settings.cols}, 1fr);
            grid-template-rows: repeat(${settings.rows}, 1fr);
            gap: 2px;
            background-color: #ddd;
            margin: 20px auto;
            border: 2px solid #999;
            max-width: ${settings.cols * 80}px;
        }
        .puzzle-piece {
            background-size: cover;
            cursor: pointer;
            width: 80px;
            height: 80px;
            position: relative;
            transition: transform 0.1s;
        }
        .puzzle-piece:hover {
            transform: scale(1.05);
            z-index: 1;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        }
        .empty-piece {
            background-color: #f0f0f0;
            border: 1px dashed #999;
        }
        @media (max-width: 600px) {
            .puzzle-piece {
                width: 60px;
                height: 60px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Rompecabezas Pixel</h1>
        <div id="puzzle-board"></div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const puzzleBoard = document.getElementById('puzzle-board');
            const rows = ${settings.rows};
            const cols = ${settings.cols};
            const imageSrc = 'imagen_rompecabezas.png';
            let puzzlePieces = [];
            let emptyPosition = { row: rows - 1, col: cols - 1 };
            
            // Crear piezas
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const piece = document.createElement('div');
                    piece.className = 'puzzle-piece';
                    piece.dataset.row = row;
                    piece.dataset.col = col;
                    piece.dataset.originalRow = row;
                    piece.dataset.originalCol = col;
                    
                    const bgPosX = -col * 100;
                    const bgPosY = -row * 100;
                    piece.style.backgroundImage = 'url(' + imageSrc + ')';
                    piece.style.backgroundPosition = bgPosX + '% ' + bgPosY + '%';
                    piece.style.backgroundSize = (cols * 100) + '% ' + (rows * 100) + '%';
                    
                    piece.addEventListener('click', function() {
                        const row = parseInt(this.dataset.row);
                        const col = parseInt(this.dataset.col);
                        movePiece(row, col);
                    });
                    
                    puzzlePieces.push({
                        element: piece,
                        row: row,
                        col: col,
                        originalRow: row,
                        originalCol: col
                    });
                    
                    puzzleBoard.appendChild(piece);
                }
            }
            
            // Establecer la última pieza como vacía
            puzzlePieces[rows * cols - 1].element.classList.add('empty-piece');
            puzzlePieces[rows * cols - 1].element.style.backgroundImage = 'none';
            
            // Funciones del juego
            function movePiece(row, col) {
                const piece = puzzlePieces.find(p => p.row === row && p.col === col);
                const rowDiff = Math.abs(piece.row - emptyPosition.row);
                const colDiff = Math.abs(piece.col - emptyPosition.col);
                
                if ((rowDiff === 1 && colDiff === 0) || (colDiff === 1 && rowDiff === 0)) {
                    swapPieces(piece.row, piece.col, emptyPosition.row, emptyPosition.col);
                    checkCompletion();
                }
            }
            
            function swapPieces(row1, col1, row2, col2) {
                const piece1 = puzzlePieces.find(p => p.row === row1 && p.col === col1);
                const piece2 = puzzlePieces.find(p => p.row === row2 && p.col === col2);
                
                [piece1.row, piece2.row] = [piece2.row, piece1.row];
                [piece1.col, piece2.col] = [piece2.col, piece1.col];
                
                piece1.element.dataset.row = piece1.row;
                piece1.element.dataset.col = piece1.col;
                piece2.element.dataset.row = piece2.row;
                piece2.element.dataset.col = piece2.col;
                
                if (piece1.element.classList.contains('empty-piece')) {
                    piece1.element.classList.remove('empty-piece');
                    piece1.element.style.backgroundImage = 'url(' + imageSrc + ')';
                    piece2.element.classList.add('empty-piece');
                    piece2.element.style.backgroundImage = 'none';
                    emptyPosition = { row: row2, col: col2 };
                } else if (piece2.element.classList.contains('empty-piece')) {
                    piece2.element.classList.remove('empty-piece');
                    piece2.element.style.backgroundImage = 'url(' + imageSrc + ')';
                    piece1.element.classList.add('empty-piece');
                    piece1.element.style.backgroundImage = 'none';
                    emptyPosition = { row: row1, col: col1 };
                }
            }
            
            function checkCompletion() {
                const isComplete = puzzlePieces.every(piece => 
                    piece.row === piece.originalRow && piece.col === piece.originalCol
                );
                
                if (isComplete) {
                    setTimeout(() => {
                        alert('¡Felicidades! Has completado el rompecabezas.');
                        puzzlePieces.forEach(piece => {
                            piece.element.classList.remove('empty-piece');
                            piece.element.style.backgroundImage = 'url(' + imageSrc + ')';
                        });
                    }, 100);
                }
            }
        });
    </script>
</body>
</html>`;
    }
});