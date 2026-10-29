class Juego { 
    constructor(canvasId) { 
        this.canvas = document.getElementById(canvasId); 
        this.ctx = this.canvas.getContext('2d'); 

        // Geometría medida sobre tablero.png (1024x1024) y sus 33 casillas en cruz.
        const escalaX = this.canvas.width / 1024;
        const escalaY = this.canvas.height / 1024;
        this.cellWidth = 104.929 * escalaX;
        this.cellHeight = 93.018 * escalaY;
        this.offsetX = 147.321 * escalaX;
        this.offsetY = 145.080 * escalaY;

        this.modelo = new Tablero(); 
        this.fichas = []; 
        this.fichaSeleccionada = null; 
        this.movimientosSugeridos = [];

        // Elementos del menú de inicio, fin de partida y temporizador
        this.menuInicio = document.getElementById('game-start-menu');
        this.menuFin = document.getElementById('game-end-menu');
        this.timerElemento = document.getElementById('game-timer');
        this.mensajeFin = document.getElementById('game-end-message');
        this.tiempoFinalElemento = document.getElementById('final-time');
        this.btnPlay = document.getElementById('btn-play');
        this.btnReplay = document.getElementById('btn-replay');

        this.iniciado = false;
        this.terminado = false;
        this.segundos = 0;
        this.intervaloTimer = null;
        this.tiempoInicio = null;
        this.rippleInicio = 0;
        this.rippleRAF = null;
        
        this.bgImage = new Image();
        this.bgImage.onload = () => this.drawAll();
        this.bgImage.src = 'assets/fichasytablero/tablero.png';

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
        this.actualizarTimer();
        this.drawAll();
        this.initEvents();
    }

    //traduce coordenadas en pixeles(x,y) a celda de la matrix {f,c}
    pixelAMatriz(x,y){
        const c = Math.floor((x - this.offsetX) / this.cellWidth);
        const f = Math.floor((y - this.offsetY) / this.cellHeight);
        if(f>=0 && f <7 && c>=0 && c<7){
            return {f,c};
    
        }
        return null;
    }

    //traduce celda de la matriz{f,c} a coordenadas del centro en pixeles
    matrizAPixel(f,c){
        return{
            x: this.offsetX + c * this.cellWidth + this.cellWidth / 2, 
            y: this.offsetY + f * this.cellHeight + this.cellHeight / 2
        }
    }

    inicializarFichasDesdeModelo() { 
        this.fichas = []; 
        const radio = Math.min(this.cellWidth, this.cellHeight) * 0.3; 
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
        if (this.btnPlay) {
            this.btnPlay.addEventListener('click', () => this.iniciarJuego());
        }
        if (this.btnReplay) {
            this.btnReplay.addEventListener('click', () => this.reiniciarJuego());
        }
    }

    iniciarJuego() {
        this.iniciado = true;
        this.terminado = false;
        this.segundos = 0;
        this.actualizarTimer();
        if (this.menuInicio) {
            this.menuInicio.hidden = true;
        }
        if (this.menuFin) {
            this.menuFin.hidden = true;
        }
        this.iniciarTimer();
    }

    reiniciarJuego() {
        this.detenerTimer();
        this.detenerRipples();
        this.modelo.reset();
        this.fichaSeleccionada = null;
        this.movimientosSugeridos = [];
        this.inicializarFichasDesdeModelo();
        this.drawAll();
        this.iniciarJuego();
    }

    iniciarTimer() {
        this.detenerTimer();
        this.tiempoInicio = Date.now();
        this.intervaloTimer = setInterval(() => {
            this.segundos = Math.floor((Date.now() - this.tiempoInicio) / 1000);
            this.actualizarTimer();
        }, 1000);
    }

    detenerTimer() {
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = null;
        }
    }

    actualizarTimer() {
        if (this.timerElemento) {
            this.timerElemento.textContent = `Tiempo: ${this.formatearTiempo(this.segundos)}`;
        }
    }

    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
        const resto = (segundos % 60).toString().padStart(2, '0');
        return `${minutos}:${resto}`;
    }

    iniciarRipples() {
        this.rippleInicio = performance.now();
        if (this.rippleRAF !== null) {
            return;
        }
        const animar = () => {
            if (this.movimientosSugeridos.length === 0) {
                this.rippleRAF = null;
                return;
            }
            this.drawAll();
            this.rippleRAF = requestAnimationFrame(animar);
        };
        this.rippleRAF = requestAnimationFrame(animar);
    }

    detenerRipples() {
        if (this.rippleRAF !== null) {
            cancelAnimationFrame(this.rippleRAF);
            this.rippleRAF = null;
        }
    }

    finalizarJuego() {
        if (this.terminado) {
            return;
        }
        this.terminado = true;
        this.detenerTimer();
        this.detenerRipples();
        if (this.tiempoInicio !== null) {
            this.segundos = Math.floor((Date.now() - this.tiempoInicio) / 1000);
        }
        this.actualizarTimer();
        const tiempoFinal = this.formatearTiempo(this.segundos);
        const fichasRestantes = this.modelo.contarFichasRestantes();
        if (this.mensajeFin) {
            this.mensajeFin.textContent = fichasRestantes === 1
                ? '¡Excelente! Dejaste una sola ficha en el tablero.'
                : 'No quedan más movimientos posibles.';
        }
        if (this.tiempoFinalElemento) {
            this.tiempoFinalElemento.textContent = tiempoFinal;
        }
        if (this.menuFin) {
            this.menuFin.hidden = false;
        }
        console.log("[CONTROLADOR] El juego ha finalizado. Tiempo:", tiempoFinal);
    }

    getCanvasCoordinates(e) { 
        const rect = this.canvas.getBoundingClientRect(); 
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        }; 
    }

    onMouseDown(e) { 
        if (!this.iniciado || this.terminado) {
            return;
        }
        const mouse = this.getCanvasCoordinates(e); 
        for (let i = this.fichas.length - 1; i >= 0; i--) { 
            const ficha = this.fichas[i]; 
            if (ficha.isPointInside(mouse.x, mouse.y)) { 
                this.fichaSeleccionada = ficha; 
                this.fichaSeleccionada.estaSiendoArrastrada = true; 
                // Consultar al Modelo los movimientos posibles para mostrar hints 
                this.movimientosSugeridos = this.modelo.obtenerMovimientosPosibles(ficha.fila, ficha.columna); 
                console.log("[CONTROLADOR] Ficha cliqueada en:", { f: ficha.fila, c: ficha.columna }, "Movimientos posibles:", this.movimientosSugeridos);
                if (this.movimientosSugeridos.length > 0) {
                    this.iniciarRipples();
                }
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
                this.finalizarJuego(); 
            } 
        } else { 
            console.log("[CONTROLADOR] Movimiento inválido. La ficha regresa a su posición original."); 
            this.fichaSeleccionada.resetPosition(); 
        } 
        this.fichaSeleccionada.estaSiendoArrastrada = false; 
        this.fichaSeleccionada = null; 
        this.movimientosSugeridos = []; 
        this.detenerRipples();
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
        const radioBase = Math.min(this.cellWidth, this.cellHeight);
        for (let r = 0; r < 7; r++) { 
            for (let c = 0; c < 7; c++) {
                if (this.modelo.matriz[r][c] !== undefined) { 
                    const pos = this.matrizAPixel(r, c); 
                    // Dibuja el hueco si está vacío (0) 
                    if (this.modelo.matriz[r][c] === 0) { 
                        this.ctx.beginPath(); 
                        this.ctx.arc(pos.x, pos.y, radioBase * 0.22, 0, 2 * Math.PI); 
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
                        this.ctx.fill(); 
                        this.ctx.closePath(); 
                    } 
                } 
            } 
        } 
        // Dibujar Hints/Sugerencias de movimientos válidos con ondas expansivas
        const tiempo = this.rippleInicio
            ? (performance.now() - this.rippleInicio) / 1000
            : 0;
        this.movimientosSugeridos.forEach((dest, indice) => {
            const pos = this.matrizAPixel(dest.f, dest.c);
            const pulso = 0.5 + 0.5 * Math.sin(tiempo * 5 + indice);

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radioBase * 0.32, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(0, 255, 128, ${0.2 + pulso * 0.1})`;
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            this.ctx.closePath();

            [0, 0.5].forEach(desfase => {
                const progreso = ((tiempo / 1.2) + desfase + indice * 0.08) % 1;
                const radio = radioBase * (0.22 + progreso * 0.36);
                const alpha = (1 - progreso) * 0.55;

                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, radio, 0, 2 * Math.PI);
                this.ctx.strokeStyle = `rgba(0, 255, 160, ${alpha})`;
                this.ctx.lineWidth = 2.5 * (1 - progreso) + 0.5;
                this.ctx.stroke();
                this.ctx.closePath();
            });
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