document.getElementById('generate').addEventListener('click', async function () {
    const question = document.getElementById('question').value;
    const correctAnswerText = document.getElementById('correct-answer-text').value;
    const correctAnswerImage = document.getElementById('correct-answer-image').files[0];
    const wrongAnswer1Text = document.getElementById('wrong-answer1-text').value;
    const wrongAnswer1Image = document.getElementById('wrong-answer1-image').files[0];
    const wrongAnswer2Text = document.getElementById('wrong-answer2-text').value;
    const wrongAnswer2Image = document.getElementById('wrong-answer2-image').files[0];

    if (question && (correctAnswerText || correctAnswerImage) && (wrongAnswer1Text || wrongAnswer1Image) && (wrongAnswer2Text || wrongAnswer2Image)) {
        // Crear un nuevo archivo ZIP
        const zip = new JSZip();

        // Generar el contenido del archivo HTML
        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acertijo Generado</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Acertijo</h1>
        <div id="riddle-display">
            <h2>${question}</h2>
            <div id="answers">
                <div class="answer-option" data-correct="true">
                    ${correctAnswerImage ? `<img src="correct-answer-image.jpg" alt="Respuesta Correcta">` : `<p>${correctAnswerText}</p>`}
                </div>
                <div class="answer-option" data-correct="false">
                    ${wrongAnswer1Image ? `<img src="wrong-answer1-image.jpg" alt="Respuesta Incorrecta 1">` : `<p>${wrongAnswer1Text}</p>`}
                </div>
                <div class="answer-option" data-correct="false">
                    ${wrongAnswer2Image ? `<img src="wrong-answer2-image.jpg" alt="Respuesta Incorrecta 2">` : `<p>${wrongAnswer2Text}</p>`}
                </div>
            </div>
            <p id="result-message"></p>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
        `;
        zip.file("index.html", htmlContent);

        // Generar el contenido del archivo CSS
        const cssContent = `
body {
    font-family: Arial, sans-serif;
    background-color: #e6f0ff;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

.container {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 600px;
    width: 100%;
}

h1 {
    margin-bottom: 25px;
    color: #2c3e50;
    font-size: 28px;
    font-weight: bold;
}

#riddle-display {
    margin-top: 20px;
}

#answers {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.answer-option {
    flex: 1;
    padding: 15px;
    border: 1px solid #bdc3c7;
    border-radius: 5px;
    cursor: pointer;
    text-align: center;
    background-color: #f9f9f9;
    transition: background-color 0.3s ease, border-color 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.answer-option:hover {
    background-color: #e6f3ff;
    border-color: #3498db;
}

.answer-option img {
    width: 100px; /* Tamaño fijo para las imágenes */
    height: 100px; /* Tamaño fijo para las imágenes */
    object-fit: cover; /* Mantiene la relación de aspecto */
    border-radius: 5px; /* Bordes redondeados para las imágenes */
}

.answer-option p {
    margin: 0;
    font-size: 16px;
    color: #2c3e50;
}

#result-message {
    margin-top: 20px;
    font-weight: bold;
    color: #2c3e50;
}
        `;
        zip.file("style.css", cssContent);

        // Generar el contenido del archivo JS
        const jsContent = `
document.querySelectorAll('.answer-option').forEach(option => {
    option.addEventListener('click', function () {
        if (option.getAttribute('data-correct') === 'true') {
            document.getElementById('result-message').innerText = 'Respuesta correcta';
        } else {
            document.getElementById('result-message').innerText = 'Intenta nuevamente';
        }
    });
});
        `;
        zip.file("script.js", jsContent);

        // Agregar imágenes al ZIP si se subieron
        if (correctAnswerImage) {
            const imgData = await readFileAsArrayBuffer(correctAnswerImage);
            zip.file("correct-answer-image.jpg", imgData);
        }
        if (wrongAnswer1Image) {
            const imgData = await readFileAsArrayBuffer(wrongAnswer1Image);
            zip.file("wrong-answer1-image.jpg", imgData);
        }
        if (wrongAnswer2Image) {
            const imgData = await readFileAsArrayBuffer(wrongAnswer2Image);
            zip.file("wrong-answer2-image.jpg", imgData);
        }

        // Generar y descargar el archivo ZIP
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "acertijo.zip";
        a.click();
        URL.revokeObjectURL(url);

        alert('Archivo ZIP generado y descargado correctamente.');
    } else {
        alert('Por favor, completa todos los campos.');
    }
});

// Función para leer un archivo como ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}