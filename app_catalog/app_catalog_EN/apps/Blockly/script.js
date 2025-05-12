document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el espacio de trabajo de Blockly
    const workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        trashcan: true,
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        }
    });

    // Cargar actividades disponibles
    const activitySelect = document.getElementById('activity-select');
    const instructionsDiv = document.getElementById('instructions');
    const outputDiv = document.getElementById('output');
    const artCanvas = document.getElementById('artCanvas');
    const ctx = artCanvas.getContext('2d');
    
    let currentActivity = null;
    let activityData = {
        math: null,
        art: null,
        logic: null
    };

    // Cargar datos de las actividades
    fetch('activities/math.json')
        .then(response => response.json())
        .then(data => activityData.math = data);
    
    fetch('activities/art.json')
        .then(response => response.json())
        .then(data => activityData.art = data);
    
    fetch('activities/logic.json')
        .then(response => response.json())
        .then(data => activityData.logic = data);

    // Manejar cambio de actividad
    activitySelect.addEventListener('change', function() {
        const activityType = this.value;
        if (!activityType) return;
        
        currentActivity = activityData[activityType];
        if (!currentActivity) return;
        
        // Actualizar interfaz
        instructionsDiv.innerHTML = currentActivity.instructions;
        outputDiv.innerHTML = '';
        
        // Configurar Blockly para esta actividad
        setupWorkspaceForActivity(activityType);
        
        // Mostrar/ocultar canvas según la actividad
        artCanvas.style.display = activityType === 'art' ? 'block' : 'none';
    });

    // Configurar workspace según la actividad
    function setupWorkspaceForActivity(activityType) {
        // Limpiar workspace
        workspace.clear();
        
        // Cargar toolbox específica
        const toolbox = generateToolbox(activityType);
        workspace.updateToolbox(toolbox);
        
        // Cargar bloques iniciales si existen
        if (currentActivity.initialBlocks) {
            const xml = Blockly.Xml.textToDom(currentActivity.initialBlocks);
            Blockly.Xml.domToWorkspace(xml, workspace);
        }
    }

    // Generar toolbox dinámica
    function generateToolbox(activityType) {
        let toolbox = {
            kind: 'categoryToolbox',
            contents: []
        };
        
        // Bloques estándar
        toolbox.contents.push({
            kind: 'category',
            name: 'Lógica',
            colour: '%{BKY_LOGIC_HUE}',
            contents: [
                { kind: 'block', type: 'controls_if' },
                { kind: 'block', type: 'logic_compare' },
                { kind: 'block', type: 'logic_operation' },
                { kind: 'block', type: 'logic_boolean' }
            ]
        });
        
        toolbox.contents.push({
            kind: 'category',
            name: 'Bucles',
            colour: '%{BKY_LOOPS_HUE}',
            contents: [
                { kind: 'block', type: 'controls_repeat_ext' },
                { kind: 'block', type: 'controls_whileUntil' }
            ]
        });
        
        toolbox.contents.push({
            kind: 'category',
            name: 'Matemáticas',
            colour: '%{BKY_MATH_HUE}',
            contents: [
                { kind: 'block', type: 'math_number' },
                { kind: 'block', type: 'math_arithmetic' },
                { kind: 'block', type: 'math_random_int' }
            ]
        });
        
        toolbox.contents.push({
            kind: 'category',
            name: 'Variables',
            colour: '%{BKY_VARIABLES_HUE}',
            custom: 'VARIABLE'
        });
        
        // Bloques específicos de la actividad
        if (activityType === 'math') {
            toolbox.contents.push({
                kind: 'category',
                name: 'Matemáticas Avanzadas',
                colour: '%{BKY_MATH_HUE}',
                contents: [
                    { kind: 'block', type: 'math_prime' },
                    { kind: 'block', type: 'math_fibonacci' },
                    { kind: 'block', type: 'math_factorial' }
                ]
            });
        }
        else if (activityType === 'art') {
            toolbox.contents.push({
                kind: 'category',
                name: 'Arte',
                colour: '#AA56A7',
                contents: [
                    { kind: 'block', type: 'art_draw_circle' },
                    { kind: 'block', type: 'art_draw_rect' },
                    { kind: 'block', type: 'art_set_color' },
                    { kind: 'block', type: 'art_clear_canvas' }
                ]
            });
        }
        else if (activityType === 'logic') {
            toolbox.contents.push({
                kind: 'category',
                name: 'Juegos',
                colour: '#8D6E63',
                contents: [
                    { kind: 'block', type: 'logic_guess_number' },
                    { kind: 'block', type: 'logic_rock_paper_scissors' }
                ]
            });
        }
        
        return toolbox;
    }

    // Ejecutar el código
    document.getElementById('run-btn').addEventListener('click', function() {
        if (!currentActivity) {
            alert('Selecciona una actividad primero');
            return;
        }
        
        // Limpiar resultados anteriores
        outputDiv.innerHTML = '';
        if (currentActivity.type === 'art') {
            ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
        }
        
        // Generar código JavaScript
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        
        // Ejecutar el código con el intérprete seguro
        try {
            const myInterpreter = new Interpreter(code, initApi);
            
            function nextStep() {
                if (myInterpreter.step()) {
                    setTimeout(nextStep, 10);
                }
            }
            
            nextStep();
        } catch (e) {
            outputDiv.innerHTML = `<div class="error">Error: ${e.message}</div>`;
        }
    });

    // API para que los bloques interactúen con la aplicación
    function initApi(interpreter, globalObject) {
        // Función para imprimir en el panel de resultados
        interpreter.setProperty(globalObject, 'print', 
            interpreter.createNativeFunction(function(text) {
                outputDiv.innerHTML += `<div>${text}</div>`;
            })
        );
        
        // Funciones para el arte generativo
        if (currentActivity.type === 'art') {
            interpreter.setProperty(globalObject, 'drawCircle',
                interpreter.createNativeFunction(function(x, y, radius, color) {
                    ctx.beginPath();
                    ctx.fillStyle = color || 'black';
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                })
            );
            
            interpreter.setProperty(globalObject, 'drawRect',
                interpreter.createNativeFunction(function(x, y, width, height, color) {
                    ctx.fillStyle = color || 'black';
                    ctx.fillRect(x, y, width, height);
                })
            );
            
            interpreter.setProperty(globalObject, 'clearCanvas',
                interpreter.createNativeFunction(function() {
                    ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
                })
            );
        }
        
        // Funciones específicas para matemáticas
        if (currentActivity.type === 'math') {
            interpreter.setProperty(globalObject, 'checkSolution',
                interpreter.createNativeFunction(function(result) {
                    if (result == currentActivity.expectedResult) {
                        outputDiv.innerHTML += `<div class="success">¡Correcto! ${currentActivity.successMessage}</div>`;
                    } else {
                        outputDiv.innerHTML += `<div class="error">Incorrecto. Intenta nuevamente.</div>`;
                    }
                })
            );
        }
        
        // Funciones para lógica y juegos
        if (currentActivity.type === 'logic') {
            interpreter.setProperty(globalObject, 'getRandomInt',
                interpreter.createNativeFunction(function(min, max) {
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                })
            );
        }
    }

    // Reiniciar la actividad
    document.getElementById('reset-btn').addEventListener('click', function() {
        if (!currentActivity) return;
        
        outputDiv.innerHTML = '';
        if (currentActivity.type === 'art') {
            ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
        }
        
        workspace.clear();
        if (currentActivity.initialBlocks) {
            const xml = Blockly.Xml.textToDom(currentActivity.initialBlocks);
            Blockly.Xml.domToWorkspace(xml, workspace);
        }
    });

    // Descargar actividad
    document.getElementById('download-activity').addEventListener('click', function() {
        if (!currentActivity) {
            alert('Selecciona una actividad primero');
            return;
        }
        
        const xml = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        
        const activityPackage = {
            activity: currentActivity,
            workspace: xmlText,
            timestamp: new Date().toISOString()
        };
        
        downloadAsJson(activityPackage, 'actividad_blockly.json');
    });

    // Descargar solución
    document.getElementById('download-solution').addEventListener('click', function() {
        if (!currentActivity || !currentActivity.solution) {
            alert('Esta actividad no tiene solución predefinida');
            return;
        }
        
        const solutionPackage = {
            activity: currentActivity,
            solution: currentActivity.solution,
            explanation: currentActivity.explanation,
            timestamp: new Date().toISOString()
        };
        
        downloadAsJson(solutionPackage, 'solucion_actividad.json');
    });

    // Función auxiliar para descargar JSON
    function downloadAsJson(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Bloques personalizados (ejemplo para matemáticas)
    Blockly.Blocks['math_prime'] = {
        init: function() {
            this.appendValueInput('NUMBER')
                .setCheck('Number')
                .appendField('es primo');
            this.setInputsInline(true);
            this.setOutput(true, 'Boolean');
            this.setColour(230);
            this.setTooltip('Devuelve verdadero si el número es primo');
        }
    };

    Blockly.JavaScript['math_prime'] = function(block) {
        const number = Blockly.JavaScript.valueToCode(block, 'NUMBER', 
            Blockly.JavaScript.ORDER_ATOMIC) || '0';
        
        const code = `(function(n) {
            if (n <= 1) return false;
            if (n <= 3) return true;
            if (n % 2 === 0 || n % 3 === 0) return false;
            for (let i = 5; i * i <= n; i += 6) {
                if (n % i === 0 || n % (i + 2) === 0) return false;
            }
            return true;
        })(${number})`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
});