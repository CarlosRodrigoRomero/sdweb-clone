fetch('version.txt')
  .then((response) => response.text())
  .then((serverVersion) => {
    const localVersion = localStorage.getItem('appVersion');

    if (localVersion !== serverVersion) {
      localStorage.setItem('appVersion', serverVersion);
      location.reload(true); // Forzar recarga de la página, ignorando la caché
    }
  })
  .catch((error) => console.error('Error al verificar la versión de la aplicación:', error));
