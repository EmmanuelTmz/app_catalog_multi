document.getElementById('generate').addEventListener('click', async function () {
    const rows = parseInt(document.getElementById('rows').value);
    const columns = parseInt(document.getElementById('columns').value);
    const instructionsFile = document.getElementById('instructions').files[0];

    if (instructionsFile) {
        const reader = new FileReader();
        reader.onload = async function (e) {
            const instructions = e.target.result;

            // Crear un nuevo archivo ZIP
            const zip = new JSZip();

            // Generar el contenido del archivo HTML
            const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sudoku Generado</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Sudoku</h1>
        <div id="instructions-display">${instructions}</div>
        <div id="sudoku-grid"></div>
    </div>
    <script src="script.js"></script>
</body>
</html>
            `;
            zip.file("index.html", htmlContent);

            // Generar el contenido del archivo CSS
            const cssContent = `
body {
    font-family: 'Arial', sans-serif;
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

#instructions-display {
    margin-bottom: 25px;
    font-style: italic;
    color: #7f8c8d;
    font-size: 14px;
    line-height: 1.5;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 5px;
    border: 1px solid #ecf0f1;
}

#sudoku-grid {
    display: grid;
    gap: 3px;
    justify-content: center;
    margin-top: 20px;
    grid-template-columns: repeat(${columns}, 40px);
}

.cell {
    width: 40px;
    height: 40px;
    text-align: center;
    font-size: 18px;
    border: 1px solid #bdc3c7;
    background-color: #ffffff;
    color: #2c3e50;
    border-radius: 5px;
    transition: border-color 0.3s ease, background-color 0.3s ease;
}

.cell:focus {
    outline: none;
    border-color: #3498db;
    background-color: #e6f3ff;
}

.cell[readonly] {
    background-color: #ecf0f1;
    color: #34495e;
    font-weight: bold;
    cursor: not-allowed;
}
            `;
            zip.file("style.css", cssContent);

            // Generar el contenido del archivo JS
            const jsContent = `
function generateSudoku(rows, columns) {
    const grid = document.getElementById('sudoku-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = \`repeat(\${columns}, 40px)\`;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.classList.add('cell');
            cell.maxLength = 1;
            if (Math.random() > 0.6) {
                cell.value = Math.floor(Math.random() * 9) + 1;
                cell.readOnly = true;
            }
            grid.appendChild(cell);
        }
    }
}

generateSudoku(${rows}, ${columns});
            `;
            zip.file("script.js", jsContent);

            // Generar y descargar el archivo ZIP
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = "sudoku.zip";
            a.click();
            URL.revokeObjectURL(url);

            alert('Archivo ZIP generado y descargado correctamente.');
        };
        reader.readAsText(instructionsFile);
    } else {
        alert('Por favor, carga un archivo de instrucciones.');
    }
});