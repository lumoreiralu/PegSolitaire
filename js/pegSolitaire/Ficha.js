class Ficha extends Figura { 
    constructor(posX, posY, radio, imagen, contexto, fila , columna ) {
        super(posX, posY, null, contexto);
        this.radio = radio; 
        this.imagen = imagen; 
        this.initialX = posX; 
        this.initialY = posY; 
        this.fila = fila; 
        this.columna = columna; 
        this.estaSiendoArrastrada = false;
    } 

    draw() { 
        super.draw(); 
        if (this.imagen && this.imagen.complete && this.imagen.naturalWidth > 0) { 
            this.context.drawImage( 
                this.imagen, 
                this.posX - this.radio, 
                this.posY - this.radio, 
                this.radio * 2, 
                this.radio * 2 
            ); 
        } 
        // Si la ficha está seleccionada (arrastrándose), dibujamos un anillo de resaltado 
        if (this.estaSiendoArrastrada) { 
            this.context.beginPath(); 
            this.context.arc(
                this.posX, 
                this.posY, 
                this.radio + 4, 0, 2 * Math.PI); 
                this.context.strokeStyle = '#00ffff'; 
                this.context.lineWidth = 3; 
                this.context.stroke(); 
                this.context.closePath(); 
        } 
    } 

    //Restaura la ficha a su posición inicial previa al arrastre 
    resetPosition() { 
        this.posX = this.initialX; 
        this.posY = this.initialY; 
    } 
        
    updateInitialPosition(newX, newY, nuevaFila, nuevaCol){
        this.posX=newX;
        this.posY = newY;
        this.initialX = newX;
        this.initialY=newY;
        this.fila = nuevaFila;
        this.columna = nuevaCol;
    }

    //Detecta si el clic/cursor (x, y) está dentro de la ficha circular
    //mediante la distancia euclidiana entre dos puntos
    isPointInside(x, y) { 
        let dx = this.posX - x; 
        let dy = this.posY - y; 
        return Math.sqrt(dx * dx + dy * dy) < this.radio; 
    }
}