const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let images = []; // Tableau pour stocker toutes les images avec leurs positions et tailles
let draggingImage = null;
let resizingImage = null;
let selectedImage = null;

let startX, startY;

// Charger l'image via l'input de fichier
document.getElementById('uploadImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                // Ajouter la nouvelle image avec des coordonnées par défaut
                images.push({
                    img: img,
                    x: 50,
                    y: 50,
                    width: img.width / 2,
                    height: img.height / 2,
                    isDragging: false,
                    isResizing: false
                });
                drawCanvas(); // Redessiner le canvas avec toutes les images
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Fonction pour dessiner toutes les images sur le canvas
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Efface le canvas avant de redessiner
    images.forEach(imageData => {
        ctx.drawImage(imageData.img, imageData.x, imageData.y, imageData.width, imageData.height);
        drawResizeHandle(imageData);
        if (imageData === selectedImage) {
            drawSelectionBorder(imageData);
        }
    });
}

// Dessiner la poignée de redimensionnement pour une image
function drawResizeHandle(imageData) {
    ctx.fillStyle = 'red';
    ctx.fillRect(imageData.x + imageData.width - 10, imageData.y + imageData.height - 10, 10, 10);  // Poignée en bas à droite
}

// Dessiner une bordure autour de l'image sélectionnée
function drawSelectionBorder(imageData) {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(imageData.x, imageData.y, imageData.width, imageData.height);
}

// Gestion du clic de souris pour commencer le déplacement ou le redimensionnement
canvas.addEventListener('mousedown', function (e) {
    const mousePos = getMousePos(canvas, e);
    startX = mousePos.x;
    startY = mousePos.y;

    selectedImage = null; // Réinitialiser l'image sélectionnée

    // Vérifier si la souris est sur une poignée de redimensionnement
    images.forEach(imageData => {
        if (isInResizeHandle(mousePos, imageData)) {
            resizingImage = imageData;
            imageData.isResizing = true;
            selectedImage = imageData;
        } else if (isInImage(mousePos, imageData)) {
            draggingImage = imageData;
            imageData.isDragging = true;
            selectedImage = imageData;
        }
    });

    drawCanvas(); // Redessiner le canvas pour montrer la sélection
});

// Déplacement de la souris pour déplacer ou redimensionner l'image
canvas.addEventListener('mousemove', function (e) {
    if (!draggingImage && !resizingImage) return;

    const mousePos = getMousePos(canvas, e);
    const dx = mousePos.x - startX;
    const dy = mousePos.y - startY;

    if (draggingImage) {
        draggingImage.x += dx;
        draggingImage.y += dy;
    } else if (resizingImage) {
        resizingImage.width += dx;
        resizingImage.height += dy;
    }

    startX = mousePos.x;
    startY = mousePos.y;

    drawCanvas();  // Redessiner toutes les images après modification
});

// Relâcher la souris pour arrêter le déplacement ou le redimensionnement
canvas.addEventListener('mouseup', function () {
    if (draggingImage) draggingImage.isDragging = false;
    if (resizingImage) resizingImage.isResizing = false;

    draggingImage = null;
    resizingImage = null;
});

// Fonction pour obtenir la position de la souris dans le canvas
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// Vérifier si la souris est dans une image donnée
function isInImage(pos, imageData) {
    return pos.x >= imageData.x && pos.x <= imageData.x + imageData.width &&
           pos.y >= imageData.y && pos.y <= imageData.y + imageData.height;
}

// Vérifier si la souris est sur la poignée de redimensionnement d'une image donnée
function isInResizeHandle(pos, imageData) {
    return pos.x >= imageData.x + imageData.width - 10 && pos.x <= imageData.x + imageData.width &&
           pos.y >= imageData.y + imageData.height - 10 && pos.y <= imageData.y + imageData.height;
}

// Fonction pour supprimer l'image sélectionnée
function deleteSelectedImage() {
    if (selectedImage) {
        images = images.filter(imageData => imageData !== selectedImage);
        selectedImage = null;
        drawCanvas(); // Redessiner le canvas après suppression
    }
}

// Fonction pour dupliquer l'image sélectionnée
function duplicateSelectedImage() {
    if (selectedImage) {
        // Ajouter une copie de l'image sélectionnée avec un léger décalage
        images.push({
            img: selectedImage.img,
            x: selectedImage.x + 20, // Décaler légèrement la copie pour la distinguer de l'originale
            y: selectedImage.y + 20,
            width: selectedImage.width,
            height: selectedImage.height,
            isDragging: false,
            isResizing: false
        });
        drawCanvas(); // Redessiner le canvas avec la nouvelle image dupliquée
    }
}// Fonction pour imprimer le contenu du canvas
function printCanvas() {
    // Enlever temporairement la sélection de l'image et les poignées de redimensionnement pour l'impression
    const previouslySelectedImage = selectedImage;
    selectedImage = null;

    // Redessiner sans la sélection ni les poignées de redimensionnement
    drawCanvas(false); // Passer 'false' pour indiquer que nous ne voulons pas les poignées

    // Générer l'URL de l'image du canvas
    const dataUrl = canvas.toDataURL("image/png");

    // Contenu de la nouvelle fenêtre pour l'impression
    const windowContent = `
        <html>
        <head>
            <title>Print canvas</title>
            <style>
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                img {
                    width: 794px; /* Dimensions pour correspondre à A4 à 96 DPI */
                    height: 1123px;
                }
            </style>
        </head>
        <body>
            <img src="${dataUrl}" />
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>`;
    
    // Ouvrir une nouvelle fenêtre et imprimer
    const printWin = window.open('', '', 'width=794,height=1123');
    printWin.document.open();
    printWin.document.write(windowContent);
    printWin.document.close();

    // Restaurer la sélection après l'impression
    selectedImage = previouslySelectedImage;
    drawCanvas(); // Redessiner avec la sélection et les poignées
}

// Modification de la fonction drawCanvas() pour supporter un paramètre pour les poignées
function drawCanvas(showHandles = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Efface le canvas avant de redessiner
    images.forEach(imageData => {
        ctx.drawImage(imageData.img, imageData.x, imageData.y, imageData.width, imageData.height);
        if (showHandles) {
            drawResizeHandle(imageData);
        }
        if (imageData === selectedImage) {
            drawSelectionBorder(imageData);
        }
    });
}
