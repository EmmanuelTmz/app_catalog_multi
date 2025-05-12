document.getElementById('memorama-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const gridSize = parseInt(document.getElementById('num-cards').value); // Tamaño del grid (ejemplo: 4 para 4x4)
    const timeLimit = parseInt(document.getElementById('time-limit').value);
    const imageZip = document.getElementById('image-zip').files[0];

    if (gridSize < 2) {
        alert("El tamaño del grid debe ser al menos 2x2.");
        return;
    }

    // Descomprimir el archivo .zip
    const images = await unzipImages(imageZip);

    if (!images || images.length === 0) {
        alert("No se pudieron cargar las imágenes.");
        return;
    }

    // Asegurarnos de tener suficientes imágenes (repetir si es necesario)
    const requiredImages = (gridSize * gridSize) / 2; // Número de pares necesarios
    const repeatedImages = repeatImages(images, requiredImages);

    // Generar el contenido del memorama
    const memoramaContent = generateMemoramaContent(gridSize, repeatedImages, timeLimit);

    // Descargar el memorama como un archivo .zip
    downloadMemoramaZip(memoramaContent);
});

async function unzipImages(zipFile) {
    const images = [];
    const jsZip = new JSZip();

    try {
        const zipData = await jsZip.loadAsync(zipFile);

        // Recorrer los archivos en el .zip
        for (const [relativePath, file] of Object.entries(zipData.files)) {
            if (!file.dir && file.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
                // Convertir la imagen a una URL
                const blob = await file.async('blob');
                images.push({ name: file.name, blob });
            }
        }

        return images;
    } catch (error) {
        console.error("Error al descomprimir el archivo .zip:", error);
        return null;
    }
}

function repeatImages(images, requiredImages) {
    const repeatedImages = [];
    for (let i = 0; i < requiredImages; i++) {
        repeatedImages.push(images[i % images.length]);
    }
    return repeatedImages;
}

function generateMemoramaContent(gridSize, images, timeLimit) {
    const totalCards = gridSize * gridSize; // Número total de cartas

    // HTML
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Memorama</title>
            <link rel="stylesheet" href="styles.css">
            <style>
                #memorama-grid {
                    display: grid;
                    gap: 10px;
                    grid-template-columns: repeat(${gridSize}, 100px);
                    margin: 20px auto;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Memorama</h1>
                <div id="memorama-grid"></div>
                <div id="timer">Tiempo restante: <span id="time-left">${timeLimit}</span> segundos</div>
                <button id="restart-button">Reiniciar Juego</button>
            </div>
            <script src="script.js"></script>
        </body>
        </html>
    `;

    // CSS
    const cssContent = `
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f4f4f9;
        }
        .container {
            text-align: center;
        }
        .memorama-card {
            width: 100px;
            height: 100px;
            perspective: 1000px;
            cursor: pointer;
        }
        .memorama-card .card-inner {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.5s;
        }
        .memorama-card.flipped .card-inner {
            transform: rotateY(180deg);
        }
        .memorama-card .card-front,
        .memorama-card .card-back {
            width: 100%;
            height: 100%;
            position: absolute;
            backface-visibility: hidden;
            border-radius: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .memorama-card .card-front {
            background-color: #ddd;
        }
        .memorama-card .card-back {
            background-color: #fff;
            transform: rotateY(180deg);
        }
        .memorama-card img {
            max-width: 100%;
            max-height: 100%;
            border-radius: 5px;
        }
        #timer {
            font-size: 1.5em;
            margin-top: 20px;
        }
        #restart-button {
            display: none;
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 1em;
            cursor: pointer;
            background-color: #28a745;
            color: #fff;
            border: none;
            border-radius: 5px;
        }
        #restart-button:hover {
            background-color: #218838;
        }
    `;

    // JavaScript
    const jsContent = `
        const images = ${JSON.stringify(images.map(img => img.name))};
        const gridSize = ${gridSize};
        const timeLimit = ${timeLimit};

        const memoramaGrid = document.getElementById('memorama-grid');
        const timerElement = document.getElementById('time-left');
        const restartButton = document.getElementById('restart-button');

        let flippedCards = [];
        let matchedCards = [];
        let timeLeft = timeLimit;
        let timer;

        // Crear el grid del memorama
        function createMemoramaGrid() {
            memoramaGrid.innerHTML = ''; // Limpiar el grid
            const cards = [...images, ...images];
            cards.sort(() => Math.random() - 0.5).forEach((image, index) => {
                const cardElement = document.createElement('div');
                cardElement.classList.add('memorama-card');
                cardElement.dataset.card = image;

                const cardInner = document.createElement('div');
                cardInner.classList.add('card-inner');

                const cardFront = document.createElement('div');
                cardFront.classList.add('card-front');

                const cardBack = document.createElement('div');
                cardBack.classList.add('card-back');
                cardBack.innerHTML = \`<img src="images/\${image}" alt="Imagen">\`;

                cardInner.appendChild(cardFront);
                cardInner.appendChild(cardBack);
                cardElement.appendChild(cardInner);

                cardElement.addEventListener('click', flipCard);
                memoramaGrid.appendChild(cardElement);
            });
        }

        // Voltear una carta
        function flipCard() {
            if (flippedCards.length < 2 && !flippedCards.includes(this)) {
                this.classList.add('flipped');
                flippedCards.push(this);

                if (flippedCards.length === 2) {
                    checkMatch();
                }
            }
        }

        // Verificar si las cartas coinciden
        function checkMatch() {
            const [card1, card2] = flippedCards;

            if (card1.dataset.card === card2.dataset.card) {
                matchedCards.push(card1, card2);
                flippedCards = [];

                if (matchedCards.length === images.length * 2) {
                    clearInterval(timer);
                    alert("¡Felicidades! Has ganado.");
                    restartButton.style.display = 'block';
                }
            } else {
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    flippedCards = [];
                }, 1000);
            }
        }

        // Iniciar el temporizador
        function startTimer() {
            timerElement.textContent = timeLeft;
            timer = setInterval(() => {
                timeLeft--;
                timerElement.textContent = timeLeft;

                if (timeLeft === 0) {
                    clearInterval(timer);
                    alert("¡Se acabó el tiempo!");
                    restartButton.style.display = 'block';
                }
            }, 1000);
        }

        // Reiniciar el juego
        function restartGame() {
            timeLeft = timeLimit;
            flippedCards = [];
            matchedCards = [];
            timerElement.textContent = timeLeft;
            restartButton.style.display = 'none';
            createMemoramaGrid();
            startTimer();
        }

        // Iniciar el juego
        createMemoramaGrid();
        startTimer();

        // Configurar el botón de reinicio
        restartButton.addEventListener('click', restartGame);
    `;

    return {
        html: htmlContent,
        css: cssContent,
        js: jsContent,
        images: images,
    };
}

async function downloadMemoramaZip(memoramaContent) {
    const zip = new JSZip();

    // Agregar archivos al .zip
    zip.file("index.html", memoramaContent.html);
    zip.file("styles.css", memoramaContent.css);
    zip.file("script.js", memoramaContent.js);

    const imagesFolder = zip.folder("images");
    memoramaContent.images.forEach((img) => {
        imagesFolder.file(img.name, img.blob);
    });

    // Generar el archivo .zip
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "memorama.zip");
}