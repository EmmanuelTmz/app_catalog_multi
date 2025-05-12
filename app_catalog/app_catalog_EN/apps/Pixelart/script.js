document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const templates = document.querySelectorAll('.template');
    const coloringSection = document.querySelector('.coloring-section');
    const pixelGrid = document.getElementById('pixel-grid');
    const colorPalette = document.getElementById('color-palette');
    const selectedColorDisplay = document.getElementById('selected-color');
    const checkBtn = document.getElementById('check-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // Variables del juego
    let selectedTemplate = null;
    let selectedColor = '#FFFFFF';
    let gridSize = 16;
    let pixelData = [];
    let colorOptions = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
        '#FF00FF', '#00FFFF', '#000000', '#FFFFFF',
        '#FFA500', '#A52A2A', '#808080', '#008000',
        '#800080', '#FFC0CB', '#ADD8E6', '#FFD700'
    ];
    
    // Plantillas predefinidas (simuladas)
    const templateDesigns = {
        cat: generateCatDesign(),
        dog: generateDogDesign(),
        tree: generateTreeDesign(),
        house: generateHouseDesign()
    };
    
    // Inicializar la paleta de colores
    function initColorPalette() {
        colorPalette.innerHTML = '';
        colorOptions.forEach(color => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = color;
            colorOption.dataset.color = color;
            
            colorOption.addEventListener('click', function() {
                selectedColor = color;
                selectedColorDisplay.style.backgroundColor = color;
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
            });
            
            colorPalette.appendChild(colorOption);
        });
        
        // Seleccionar primer color por defecto
        if (colorOptions.length > 0) {
            selectedColor = colorOptions[0];
            selectedColorDisplay.style.backgroundColor = selectedColor;
            colorPalette.firstChild.classList.add('selected');
        }
    }
    
    // Cargar plantilla seleccionada
    templates.forEach(template => {
        template.addEventListener('click', function() {
            selectedTemplate = this.dataset.template;
            coloringSection.style.display = 'block';
            initPixelGrid();
            loadTemplateDesign(selectedTemplate);
            
            // Desplazarse a la sección de coloreado
            coloringSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Inicializar la cuadrícula de píxeles
    function initPixelGrid() {
        pixelGrid.innerHTML = '';
        pixelGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        pixelData = [];
        
        for (let row = 0; row < gridSize; row++) {
            pixelData[row] = [];
            for (let col = 0; col < gridSize; col++) {
                pixelData[row][col] = '#FFFFFF'; // Blanco por defecto
                
                const pixel = document.createElement('div');
                pixel.className = 'pixel';
                pixel.dataset.row = row;
                pixel.dataset.col = col;
                
                pixel.addEventListener('click', function() {
                    const row = parseInt(this.dataset.row);
                    const col = parseInt(this.dataset.col);
                    pixelData[row][col] = selectedColor;
                    this.style.backgroundColor = selectedColor;
                    checkCompletion();
                });
                
                pixelGrid.appendChild(pixel);
            }
        }
    }
    
    // Cargar diseño de plantilla
    function loadTemplateDesign(template) {
        const design = templateDesigns[template];
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (design[row] && design[row][col]) {
                    const color = design[row][col];
                    if (color !== '#FFFFFF') { // No pintar los blancos
                        pixelData[row][col] = color;
                        const pixel = pixelGrid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (pixel) {
                            pixel.style.backgroundColor = color;
                        }
                    }
                }
            }
        }
    }
    
    // Verificar si se ha completado todo el pixel art
    function checkCompletion() {
        let allColored = true;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (pixelData[row][col] === '#FFFFFF') {
                    allColored = false;
                    break;
                }
            }
            if (!allColored) break;
        }
        
        downloadBtn.disabled = !allColored;
        
        if (allColored) {
            const message = document.createElement('div');
            message.className = 'completion-message';
            message.textContent = '¡Pixel Art completado! Ahora puedes descargarlo.';
            checkBtn.insertAdjacentElement('afterend', message);
            message.style.display = 'block';
        }
    }
    
    // Botón de verificación
    checkBtn.addEventListener('click', function() {
        checkCompletion();
        if (downloadBtn.disabled) {
            alert('¡Aún hay áreas sin colorear! Completa todo el Pixel Art para poder descargarlo.');
        }
    });
    
    // Botón de descarga
    downloadBtn.addEventListener('click', function() {
        if (!downloadBtn.disabled) {
            downloadPixelArt();
        }
    });
    
    // Generar archivos para descargar
    function downloadPixelArt() {
        // Crear el HTML completo para el juego
        const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pixel Art Coloring Game</title>
    <style>
        ${getCSS()}
    </style>
</head>
<body>
    <div class="container">
        <h1>Pixel Art Coloring Game</h1>
        
        <div class="coloring-section" style="display: block;">
            <h2>Colorea tu Pixel Art</h2>
            <div class="grid-container">
                <div id="pixel-grid" class="pixel-grid" style="grid-template-columns: repeat(${gridSize}, 1fr);">
                    ${generatePixelGridHTML()}
                </div>
                <div class="controls">
                    <div class="color-palette" id="color-palette">
                        ${generateColorPaletteHTML()}
                    </div>
                    <div class="selected-color" id="selected-color" style="background-color: ${selectedColor};"></div>
                    <button id="check-btn" class="pixel-btn">Verificar</button>
                    <button id="download-btn" class="pixel-btn" disabled>Descargar</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        ${getJS()}
    </script>
</body>
</html>`;

        // Crear el ZIP
        const zip = new JSZip();
        zip.file("index.html", htmlContent);
        zip.file("styles.css", getCSS());
        zip.file("script.js", getJS());
        
        // Generar y descargar el ZIP
        zip.generateAsync({ type: "blob" }).then(function(content) {
            saveAs(content, "pixel-art-game.zip");
        });
    }
    
    // Funciones auxiliares para generar el contenido descargable
    function getCSS() {
        return Array.from(document.styleSheets[0].cssRules)
            .map(rule => rule.cssText)
            .join('\n');
    }
    
    function generatePixelGridHTML() {
        let html = '';
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const color = pixelData[row][col];
                html += `<div class="pixel" data-row="${row}" data-col="${col}" style="background-color: ${color};"></div>`;
            }
        }
        return html;
    }
    
    function generateColorPaletteHTML() {
        let html = '';
        colorOptions.forEach(color => {
            const isSelected = color === selectedColor;
            html += `<div class="color-option ${isSelected ? 'selected' : ''}" style="background-color: ${color};" data-color="${color}"></div>`;
        });
        return html;
    }
    
    function getJS() {
        return `
            document.addEventListener('DOMContentLoaded', function() {
                const pixelGrid = document.getElementById('pixel-grid');
                const colorPalette = document.getElementById('color-palette');
                const selectedColorDisplay = document.getElementById('selected-color');
                const checkBtn = document.getElementById('check-btn');
                const downloadBtn = document.getElementById('download-btn');
                
                let selectedColor = '${selectedColor}';
                let pixelData = ${JSON.stringify(pixelData)};
                const colorOptions = ${JSON.stringify(colorOptions)};
                const gridSize = ${gridSize};
                
                // Inicializar eventos
                Array.from(colorPalette.children).forEach(colorOption => {
                    colorOption.addEventListener('click', function() {
                        selectedColor = this.dataset.color;
                        selectedColorDisplay.style.backgroundColor = selectedColor;
                        Array.from(colorPalette.children).forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        this.classList.add('selected');
                    });
                });
                
                Array.from(pixelGrid.children).forEach(pixel => {
                    pixel.addEventListener('click', function() {
                        const row = parseInt(this.dataset.row);
                        const col = parseInt(this.dataset.col);
                        pixelData[row][col] = selectedColor;
                        this.style.backgroundColor = selectedColor;
                        checkCompletion();
                    });
                });
                
                checkBtn.addEventListener('click', function() {
                    checkCompletion();
                    if (downloadBtn.disabled) {
                        alert('¡Aún hay áreas sin colorear! Completa todo el Pixel Art para poder descargarlo.');
                    }
                });
                
                downloadBtn.addEventListener('click', function() {
                    if (!downloadBtn.disabled) {
                        downloadImage();
                    }
                });
                
                function checkCompletion() {
                    let allColored = true;
                    
                    for (let row = 0; row < gridSize; row++) {
                        for (let col = 0; col < gridSize; col++) {
                            if (pixelData[row][col] === '#FFFFFF') {
                                allColored = false;
                                break;
                            }
                        }
                        if (!allColored) break;
                    }
                    
                    downloadBtn.disabled = !allColored;
                }
                
                function downloadImage() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const pixelSize = 20;
                    
                    canvas.width = gridSize * pixelSize;
                    canvas.height = gridSize * pixelSize;
                    
                    for (let row = 0; row < gridSize; row++) {
                        for (let col = 0; col < gridSize; col++) {
                            ctx.fillStyle = pixelData[row][col];
                            ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
                        }
                    }
                    
                    const link = document.createElement('a');
                    link.download = 'pixel-art.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            });
        `;
    }
    
    // Funciones para generar diseños predefinidos (simplificados)
    function generateCatDesign() {
        const design = Array(gridSize).fill().map(() => Array(gridSize).fill('#FFFFFF'));
        
        // Cuerpo del gato
        for (let i = 5; i < 11; i++) {
            for (let j = 4; j < 12; j++) {
                design[i][j] = '#333333';
            }
        }
        
        // Orejas
        design[4][5] = '#333333';
        design[4][6] = '#333333';
        design[5][5] = '#333333';
        design[5][6] = '#333333';
        
        design[4][9] = '#333333';
        design[4][10] = '#333333';
        design[5][9] = '#333333';
        design[5][10] = '#333333';
        
        // Ojos
        design[6][6] = '#FFD700';
        design[6][7] = '#FFD700';
        design[6][9] = '#FFD700';
        design[6][10] = '#FFD700';
        
        // Nariz
        design[7][8] = '#FF69B4';
        
        // Bigotes
        design[7][5] = '#333333';
        design[7][4] = '#333333';
        design[8][5] = '#333333';
        design[8][4] = '#333333';
        
        design[7][10] = '#333333';
        design[7][11] = '#333333';
        design[8][10] = '#333333';
        design[8][11] = '#333333';
        
        return design;
    }
    
    function generateDogDesign() {
        const design = Array(gridSize).fill().map(() => Array(gridSize).fill('#FFFFFF'));
        
        // Cuerpo del perro
        for (let i = 5; i < 11; i++) {
            for (let j = 4; j < 12; j++) {
                design[i][j] = '#8B4513';
            }
        }
        
        // Orejas
        design[4][5] = '#8B4513';
        design[4][6] = '#8B4513';
        design[5][5] = '#8B4513';
        design[5][6] = '#8B4513';
        
        design[4][9] = '#8B4513';
        design[4][10] = '#8B4513';
        design[5][9] = '#8B4513';
        design[5][10] = '#8B4513';
        
        // Ojos
        design[6][6] = '#FFFFFF';
        design[6][7] = '#000000';
        design[6][9] = '#FFFFFF';
        design[6][10] = '#000000';
        
        // Nariz
        design[7][8] = '#000000';
        
        return design;
    }
    
    function generateTreeDesign() {
        const design = Array(gridSize).fill().map(() => Array(gridSize).fill('#FFFFFF'));
        
        // Tronco
        for (let i = 8; i < 16; i++) {
            design[i][7] = '#8B4513';
            design[i][8] = '#8B4513';
        }
        
        // Copa del árbol
        for (let i = 4; i < 8; i++) {
            for (let j = 5 + (i - 4); j < 11 - (i - 4); j++) {
                design[i][j] = '#228B22';
            }
        }
        
        return design;
    }
    
    function generateHouseDesign() {
        const design = Array(gridSize).fill().map(() => Array(gridSize).fill('#FFFFFF'));
        
        // Base de la casa
        for (let i = 8; i < 14; i++) {
            for (let j = 5; j < 11; j++) {
                design[i][j] = '#CD853F';
            }
        }
        
        // Techo
        for (let i = 5; i < 8; i++) {
            for (let j = 6 + (i - 5); j < 10 - (i - 5); j++) {
                design[i][j] = '#B22222';
            }
        }
        
        // Puerta
        design[10][7] = '#8B4513';
        design[10][8] = '#8B4513';
        design[11][7] = '#8B4513';
        design[11][8] = '#8B4513';
        
        // Ventanas
        design[8][6] = '#87CEEB';
        design[8][9] = '#87CEEB';
        design[9][6] = '#87CEEB';
        design[9][9] = '#87CEEB';
        
        return design;
    }
    
    // Inicializar la paleta de colores al cargar
    initColorPalette();
    
    // Cargar JSZip y FileSaver.js dinámicamente
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }
    
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', function() {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js', function() {
            console.log('Librerías de compresión cargadas');
        });
    });
});