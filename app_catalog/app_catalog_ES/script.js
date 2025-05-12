document.addEventListener('DOMContentLoaded', function() {
    const dropdownLinks = document.querySelectorAll('.dropdown-content a');
    const currentAppDisplay = document.getElementById('current-app');
    const appContainer = document.getElementById('app-container');
    
    // Cargar aplicación seleccionada
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const appName = this.getAttribute('data-app');
            const appSrc = this.getAttribute('data-src');
            
            // Actualizar el texto del botón
            currentAppDisplay.textContent = appName;
            
            // Crear el iframe con la aplicación
            appContainer.innerHTML = `
                <h2 class="app-title">${appName}</h2>
                <iframe 
                    src="${appSrc}" 
                    class="app-frame" 
                    title="${appName}"
                    loading="lazy"
                    allowfullscreen>
                </iframe>
            `;
        });
    });
    
    // Opcional: Cargar la última app vista desde localStorage
    const lastApp = localStorage.getItem('lastViewedApp');
    if (lastApp) {
        const lastAppLink = document.querySelector(`[data-app="${lastApp}"]`);
        if (lastAppLink) {
            lastAppLink.click();
        }
    }
    
    // Guardar la selección actual
    window.addEventListener('beforeunload', function() {
        const currentApp = currentAppDisplay.textContent;
        if (currentApp !== 'Seleccionar App') {
            localStorage.setItem('lastViewedApp', currentApp);
        }
    });
});