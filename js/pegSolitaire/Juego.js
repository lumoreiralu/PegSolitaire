class Juego { 
    constructor(canvasId) { 
        this.canvas = document.getElementById(canvasId); 
        this.ctx = this.canvas.getContext('2d'); 

        // Geometría del tablero sobre el canvas 
        this.cellSize = 77; // Ancho/alto de cada celda (px) 
        this.offsetX = (this.canvas.width - (7 * this.cellSize)) / 2; // Centrado horizontal 
        this.offsetY = (this.canvas.height - (7 * this.cellSize)) / 2; // Centrado vertical 

        this.modelo = new Tablero(); 
        this.fichas = []; 
        this.fichaSeleccionada = null; 
        this.movimientosSugeridos = [];
        
        this.bgImage = new Image();
        this.bgImage.onload = () => this.drawAll();
        this.bgImage.src = 'assets/fichasytablero/tablero.jpg';

        this.skins = {
            pacman: 'assets/fichasytablero/pacman.png',
            fantasma: 'assets/fichasytablero/fantasma.png'

        };
        this.currentSkinSrc = this.skins.pacman;
        this.fichaImage = new Image();
        this.fichaImageSrc = this.currentSkinSrc;

        this.fichaImage.onload = () => {
            this.drawAll();
        };
        this.fichaImage.src = this.fichaImageSrc;
        this.inicializarFichasDesdeModelo();
        this.drawAll();
        this.initEvents();
    }

    //traduce coordenadas en pixeles(x,y) a celda de la matrix {f,c}
    pixelAMatriz(x,y){
        const c = Math.floor((x-this.offsetX)/this.cellSize);
        const f = Math.floor((y - this.offsetY) / this.cellSize);
        if(f>=0 && f <7 && c>=0 && c<7){
            return {f,c};
    
        }
        return null;
    }

    //traduce celda de la matriz{f,c} a coordenadas del centro en pixeles
    matrizAPixel(f,c){
        return{
            x: this.offsetX + c * this.cellSize + this.cellSize / 2, 
            y: this.offsetY + f * this.cellSize + this.cellSize / 2
        }
    }

    inicializarFichasDesdeModelo() { 
        this.fichas = []; 
        const radio = this.cellSize * 0.21; 
        for (let r = 0; r <7; r++) { 
            for (let c = 0; c < 7; c++) { 
                if (this.modelo.matriz[r][c] === 1) { 
                    const posPixel = this.matrizAPixel(r, c); 
                    const ficha = new Ficha(posPixel.x, posPixel.y, radio, this.fichaImage, this.ctx, r, c); 
                    this.fichas.push(ficha); 
                } 
            } 
        } 
    }

    initEvents() { 
        // mousedown se escucha en el Canvas 
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e)); 
        // mousemove y mouseup se escuchan en WINDOW para no perder el evento fuera del lienzo
        window.addEventListener('mousemove', (e) => this.onMouseMove(e)); 
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        // Selector de Skins/Imágenes de fichas 
        const skinSelector = document.getElementById('skin-select');
        if (skinSelector) { 
            skinSelector.addEventListener('change', (e) => this.cambiarSkin(e.target.value)); 
        } 
    }

    getCanvasCoordinates(e) { 
        const rect = this.canvas.getBoundingClientRect(); 
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        }; 
    }

    onMouseDown(e) { 
        const mouse = this.getCanvasCoordinates(e); 
        for (let i = this.fichas.length - 1; i >= 0; i--) { 
            const ficha = this.fichas[i]; 
            if (ficha.isPointInside(mouse.x, mouse.y)) { 
                this.fichaSeleccionada = ficha; 
                this.fichaSeleccionada.estaSiendoArrastrada = true; 
                // Consultar al Modelo los movimientos posibles para mostrar hints 
                this.movimientosSugeridos = this.modelo.obtenerMovimientosPosibles(ficha.fila, ficha.columna); 
                console.log("[CONTROLADOR] Ficha cliqueada en:", { f: ficha.fila, c: ficha.columna }, "Movimientos posibles:", this.movimientosSugeridos);
                this.drawAll(); 
                break; 
            } 
        } 
    }
    onMouseMove(e) { 
        if (this.fichaSeleccionada && this.fichaSeleccionada.estaSiendoArrastrada) { 
            const mouse = this.getCanvasCoordinates(e); 
            this.fichaSeleccionada.setPosition(mouse.x, mouse.y); 
            this.drawAll(); 
        } 
    }

    onMouseUp(e) { 
        if (!this.fichaSeleccionada || !this.fichaSeleccionada.estaSiendoArrastrada) 
            return; 
        const mouse = this.getCanvasCoordinates(e); 
        const destinoMatriz = this.pixelAMatriz(mouse.x, mouse.y); 
        const origenMatriz = { 
            f: this.fichaSeleccionada.fila, 
            c: this.fichaSeleccionada.columna 
        }; 
        if (destinoMatriz && this.modelo.esMovimientoValido(origenMatriz, destinoMatriz)) {
            const fichaComidaCoords = this.modelo.ejecutarMovimiento(origenMatriz, destinoMatriz); 
            this.fichas = this.fichas.filter(f => !(f.fila === fichaComidaCoords.f && f.columna === fichaComidaCoords.c));
            const nuevoPixel = this.matrizAPixel(destinoMatriz.f, destinoMatriz.c); 
            this.fichaSeleccionada.updateInitialPosition(nuevoPixel.x, nuevoPixel.y, destinoMatriz.f, destinoMatriz.c); 
            if (this.modelo.esJuegoTerminado()) { 
                console.log("[CONTROLADOR] El juego ha finalizado."); 
                setTimeout(() => alert("¡Fin del Juego! No quedan más movimientos."), 100); 
            } 
        } else { 
            console.log("[CONTROLADOR] Movimiento inválido. La ficha regresa a su posición original."); 
            this.fichaSeleccionada.resetPosition(); 
        } 
        this.fichaSeleccionada.estaSiendoArrastrada = false; 
        this.fichaSeleccionada = null; 
        this.movimientosSugeridos = []; 
        this.drawAll(); 
    }

    drawAll() { 
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
         // Dibujar Fondo (manejado por la Vista) 
         if (this.bgImage.complete) { 
            this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height); 
        } 
        //Dibujar Huecos (donde la matriz es 0 o 1) y Hints 
        this.drawHuecosYHints(); 
        // Dibujar Fichas Quietas 
        const fichasQuietas = this.fichas.filter(f => !f.estaSiendoArrastrada); 
        fichasQuietas.forEach(f => f.draw()); 
        //Dibujar Ficha en Movimiento 
        if (this.fichaSeleccionada && this.fichaSeleccionada.estaSiendoArrastrada) { 
            this.fichaSeleccionada.draw(); 
        } 
    }

    drawHuecosYHints() { 
        for (let r = 0; r < 7; r++) { 
            for (let c = 0; c < 7; c++) {
                if (this.modelo.matriz[r][c] !== undefined) { 
                    const pos = this.matrizAPixel(r, c); 
                    // Dibuja el hueco si está vacío (0) 
                    if (this.modelo.matriz[r][c] === 0) { 
                        this.ctx.beginPath(); 
                        this.ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI); 
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
                        this.ctx.fill(); 
                        this.ctx.closePath(); 
                    } 
                } 
            } 
        } 
        // Dibujar Hints/Sugerencias de movimientos válidos 
        this.movimientosSugeridos.forEach(dest => { 
            const pos = this.matrizAPixel(dest.f, dest.c); 
            this.ctx.beginPath(); 
            this.ctx.arc(pos.x, pos.y, 18, 0, 2 * Math.PI); 
            this.ctx.fillStyle = 'rgba(0, 255, 128, 0.7)'; 
            this.ctx.fill(); 
            this.ctx.strokeStyle = '#ffffff'; 
            this.ctx.lineWidth = 2; 
            this.ctx.stroke(); 
            this.ctx.closePath(); 
        }); 
    }
    cambiarSkin(skinKey) { 
        if (this.skins[skinKey]) { 
            this.currentSkinSrc = this.skins[skinKey]; 
            this.fichaImage = new Image(); 
            this.fichaImage.src = this.currentSkinSrc; 
            this.fichaImage.onload = () => { 
                this.fichas.forEach(f => f.imagen = this.fichaImage); 
                this.drawAll(); 
            }; 
        } 
    }
}