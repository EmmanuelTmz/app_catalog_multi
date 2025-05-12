document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    const textUploadArea = document.getElementById('text-upload-area');
    const textFileInput = document.getElementById('text-file');
    const storyContent = document.getElementById('story-content');
    const storyPreview = document.getElementById('story-preview');
    const nextStep1Btn = document.getElementById('next-step1');
    
    const imageCountInput = document.getElementById('image-count');
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageFilesInput = document.getElementById('image-files');
    const imagePreviewGrid = document.getElementById('image-preview-grid');
    const prevStep2Btn = document.getElementById('prev-step2');
    const nextStep2Btn = document.getElementById('next-step2');
    
    const storyDisplay = document.getElementById('story-display');
    const imageSlots = document.getElementById('image-slots');
    const imagePool = document.getElementById('image-pool');
    const checkOrderBtn = document.getElementById('check-order');
    const resultMessage = document.getElementById('result-message');
    const restartGameBtn = document.getElementById('restart-game');
    const newGameBtn = document.getElementById('new-game');
    
    // Variables de estado
    let appState = {
        storyText: '',
        images: [],
        requiredImageCount: 3,
        currentStep: 1
    };
    
    // Event Listeners
    textUploadArea.addEventListener('click', () => textFileInput.click());
    textFileInput.addEventListener('change', handleTextFileUpload);
    
    nextStep1Btn.addEventListener('click', () => navigateToStep(2));
    prevStep2Btn.addEventListener('click', () => navigateToStep(1));
    nextStep2Btn.addEventListener('click', () => navigateToStep(3));
    
    imageCountInput.addEventListener('change', updateRequiredImageCount);
    imageUploadArea.addEventListener('click', () => imageFilesInput.click());
    imageFilesInput.addEventListener('change', handleImageUpload);
    
    checkOrderBtn.addEventListener('click', checkImageOrder);
    restartGameBtn.addEventListener('click', restartGame);
    newGameBtn.addEventListener('click', () => window.location.reload());
    
    // Drag and drop para el área de texto
    setupDragAndDrop(textUploadArea, textFileInput, handleTextFileDrop);
    
    // Drag and drop para el área de imágenes
    setupDragAndDrop(imageUploadArea, imageFilesInput, handleImageDrop);
    
    // Funciones
    function handleTextFileUpload(e) {
        const file = e.target.files[0];
        if (file && file.type === 'text/plain') {
            readTextFile(file);
        } else {
            alert('Por favor, sube un archivo válido en formato TXT.');
        }
    }
    
    function handleTextFileDrop(files) {
        const file = files[0];
        if (file && file.type === 'text/plain') {
            readTextFile(file);
            textFileInput.files = files;
        } else {
            alert('Por favor, sube un archivo válido en formato TXT.');
        }
    }
    
    function readTextFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            appState.storyText = e.target.result;
            storyContent.textContent = appState.storyText;
            storyPreview.style.display = 'block';
            nextStep1Btn.disabled = false;
            
            // Resaltar números en el texto que podrían corresponder a imágenes
            highlightPotentialImageReferences();
        };
        reader.readAsText(file);
    }
    
    function highlightPotentialImageReferences() {
        let text = appState.storyText;
        // Resaltar números entre corchetes como [1], [2], etc.
        text = text.replace(/\[(\d+)\]/g, '<span class="image-reference">[$1]</span>');
        storyContent.innerHTML = text;
    }
    
    function updateRequiredImageCount() {
        const count = parseInt(imageCountInput.value);
        if (count >= 1 && count <= 20) {
            appState.requiredImageCount = count;
        } else {
            imageCountInput.value = appState.requiredImageCount;
        }
    }
    
    function handleImageUpload(e) {
        processImageFiles(e.target.files);
    }
    
    function handleImageDrop(files) {
        processImageFiles(files);
        imageFilesInput.files = files;
    }
    
    function processImageFiles(files) {
        const validImages = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (validImages.length === 0) {
            alert('Por favor, sube archivos de imagen válidos.');
            return;
        }
        
        // Limitar al número requerido de imágenes
        const imagesToAdd = validImages.slice(0, appState.requiredImageCount - appState.images.length);
        
        if (imagesToAdd.length === 0) {
            alert(`Ya has subido el número requerido de imágenes (${appState.requiredImageCount}).`);
            return;
        }
        
        imagesToAdd.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageNumber = appState.images.length + 1;
                const imageObj = {
                    number: imageNumber,
                    url: e.target.result,
                    file: file
                };
                
                appState.images.push(imageObj);
                addImageToPreview(imageObj);
                
                // Habilitar el botón siguiente si se alcanza el número requerido
                if (appState.images.length === appState.requiredImageCount) {
                    nextStep2Btn.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        });
    }
    
    function addImageToPreview(imageObj) {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.innerHTML = `
            <img src="${imageObj.url}" alt="Imagen ${imageObj.number}">
            <div class="image-number">${imageObj.number}</div>
        `;
        imagePreviewGrid.appendChild(previewItem);
    }
    
    function navigateToStep(step) {
        if (step === 2 && !appState.storyText) return;
        if (step === 3 && appState.images.length < appState.requiredImageCount) return;
        
        // Ocultar todos los pasos
        step1.style.display = 'none';
        step2.style.display = 'none';
        step3.style.display = 'none';
        
        // Mostrar el paso actual
        document.getElementById(`step${step}`).style.display = 'flex';
        appState.currentStep = step;
        
        // Configurar el juego si es el paso 3
        if (step === 3) {
            setupGame();
        }
    }
    
    function setupGame() {
        // Mostrar la historia
        storyDisplay.innerHTML = `
            <h2>Historia</h2>
            <div class="story-text">${appState.storyText.replace(/\n/g, '<br>')}</div>
        `;
        
        // Limpiar contenedores
        imageSlots.innerHTML = '';
        imagePool.innerHTML = '';
        resultMessage.textContent = '';
        resultMessage.className = '';
        
        // Crear slots para las imágenes
        for (let i = 1; i <= appState.images.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.dataset.slotNumber = i;
            slot.dataset.expectedImage = i;
            imageSlots.appendChild(slot);
            
            // Configurar drag and drop para los slots
            setupSlotDragAndDrop(slot);
        }
        
        // Barajar las imágenes y añadirlas al pool
        const shuffledImages = [...appState.images].sort(() => Math.random() - 0.5);
        
        shuffledImages.forEach(img => {
            const imgElement = document.createElement('div');
            imgElement.className = 'image-item';
            imgElement.dataset.imageNumber = img.number;
            imgElement.draggable = true;
            imgElement.innerHTML = `<img src="${img.url}" alt="Imagen ${img.number}">`;
            imagePool.appendChild(imgElement);
            
            // Configurar drag and drop para las imágenes
            setupImageDragAndDrop(imgElement);
        });
    }
    
    function setupSlotDragAndDrop(slot) {
        slot.addEventListener('dragover', e => {
            e.preventDefault();
            slot.classList.add('highlight');
        });
        
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('highlight');
        });
        
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.classList.remove('highlight');
            
            const imageNumber = e.dataTransfer.getData('text/plain');
            const imageElement = document.querySelector(`.image-item[data-image-number="${imageNumber}"]`);
            
            if (imageElement) {
                // Si el slot ya tiene una imagen, devolverla al pool
                if (slot.firstChild && slot.firstChild.tagName === 'IMG') {
                    const existingImgNumber = slot.firstChild.parentElement.dataset.imageNumber;
                    returnImageToPool(existingImgNumber);
                }
                
                // Mover la imagen al slot
                slot.innerHTML = '';
                slot.appendChild(imageElement);
                
                // Verificar si todas las imágenes están en slots
                checkAllImagesPlaced();
            }
        });
    }
    
    function setupImageDragAndDrop(imageElement) {
        imageElement.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', imageElement.dataset.imageNumber);
            imageElement.classList.add('dragging');
        });
        
        imageElement.addEventListener('dragend', () => {
            imageElement.classList.remove('dragging');
        });
    }
    
    function returnImageToPool(imageNumber) {
        const imageElement = document.createElement('div');
        imageElement.className = 'image-item';
        imageElement.dataset.imageNumber = imageNumber;
        imageElement.draggable = true;
        
        const originalImg = appState.images.find(img => img.number == imageNumber);
        if (originalImg) {
            imageElement.innerHTML = `<img src="${originalImg.url}" alt="Imagen ${imageNumber}">`;
            imagePool.appendChild(imageElement);
            
            // Configurar drag and drop para la nueva imagen
            setupImageDragAndDrop(imageElement);
        }
    }
    
    function checkAllImagesPlaced() {
        const slots = document.querySelectorAll('.slot');
        let allPlaced = true;
        
        slots.forEach(slot => {
            if (!slot.firstChild || slot.firstChild.tagName !== 'DIV') {
                allPlaced = false;
            }
        });
        
        checkOrderBtn.disabled = !allPlaced;
    }
    
    function checkImageOrder() {
        const slots = document.querySelectorAll('.slot');
        let allCorrect = true;
        
        slots.forEach(slot => {
            const expectedImage = slot.dataset.expectedImage;
            const actualImage = slot.firstChild ? slot.firstChild.dataset.imageNumber : null;
            
            if (actualImage === expectedImage) {
                slot.classList.add('correct');
                slot.classList.remove('incorrect');
            } else {
                slot.classList.add('incorrect');
                slot.classList.remove('correct');
                allCorrect = false;
            }
        });
        
        if (allCorrect) {
            resultMessage.textContent = '¡Felicidades! Todas las imágenes están en el orden correcto.';
            resultMessage.className = 'success';
        } else {
            resultMessage.textContent = 'Algunas imágenes no están en el orden correcto. Intenta nuevamente.';
            resultMessage.className = 'error';
        }
    }
    
    function restartGame() {
        setupGame();
    }
    
    function setupDragAndDrop(dropArea, fileInput, dropHandler) {
        dropArea.addEventListener('dragover', e => {
            e.preventDefault();
            dropArea.style.borderColor = 'var(--accent-color)';
            dropArea.style.backgroundColor = 'rgba(79, 195, 247, 0.1)';
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.borderColor = 'var(--light-gray)';
            dropArea.style.backgroundColor = '';
        });
        
        dropArea.addEventListener('drop', e => {
            e.preventDefault();
            dropArea.style.borderColor = 'var(--light-gray)';
            dropArea.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                dropHandler(files);
            }
        });
    }
});