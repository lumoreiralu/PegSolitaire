class Tablero { 
    constructor() { 
        this.matriz = []; 
        this.reset(); 
    }

    reset() { 
        const U = undefined;
        this.matriz = [ 
            [U, U, 1, 1, 1, U, U], 
            [U, U, 1, 1, 1, U, U], 
            [1, 1, 1, 1, 1, 1, 1], 
            [1, 1, 1, 0, 1, 1, 1], 
            [1, 1, 1, 1, 1, 1, 1], 
            [U, U, 1, 1, 1, U, U], 
            [U, U, 1, 1, 1, U, U] 
        ]; 
    } 

    esPosicionValida(f, c) { 
        return f >= 0 && f < 7 && c >= 0 && c < 7 && this.matriz[f][c] !== undefined; 
    
    }

    esMovimientoValido(origen, destino) { 
        if (!this.esPosicionValida(origen.f, origen.c) || !this.esPosicionValida(destino.f, destino.c)) 
            return false; 
        // Origen debe ser 1 (ficha) y Destino debe ser 0 (vacío) 
        if (this.matriz[origen.f][origen.c] !== 1 || this.matriz[destino.f][destino.c] !== 0) {
            return false; 
        } 
        const df = destino.f - origen.f; 
        const dc = destino.c - origen.c; 
        const esVertical = Math.abs(df) === 2 && dc === 0; 
        const esHorizontal = Math.abs(dc) === 2 && df === 0; 
        if (!esVertical && !esHorizontal) 
            return false; 
        // Ver que en el casillero del medio tenga una ficha  
        const middleF = origen.f + df / 2; 
        const middleC = origen.c + dc / 2; 
        return this.matriz[middleF][middleC] === 1;
    }

    ejecutarMovimiento(origen, destino) { 
        if (!this.esMovimientoValido(origen, destino)) 
            return null; 
        const middleF = origen.f + (destino.f - origen.f) / 2; 
        const middleC = origen.c + (destino.c - origen.c) / 2; 
        //actualiza los estados de la matriz
        this.matriz[origen.f][origen.c] = 0; //el origen queda vacio
        this.matriz[middleF][middleC] = 0; //la ficha comida desaparece
        this.matriz[destino.f][destino.c] = 1; //el destino ahora tiene la ficha
        
        console.log(`[MODELO] Movimiento ejecutado: de (${origen.f},${origen.c}) a (${destino.f},${destino.c}). Ficha comida en (${middleF},${middleC})`);
        
        return { 
            f: middleF, 
            c: middleC 
        }; 
    }
    obtenerMovimientosPosibles(f,c) { 
        const movimientos = []; 
        const direcciones = [ 
                { df: -2, dc: 0 }, // Arriba 
                { df: 2, dc: 0 }, // Abajo 
                { df: 0, dc: -2 }, // Izquierda 
                { df: 0, dc: 2 } // Derecha 
            ];
        direcciones.forEach(dir => { 
            const destino = { 
                    f: f + dir.df, 
                    c: c + dir.dc 
            };
            if (this.esMovimientoValido({f,c}, destino)) { 
                movimientos.push(destino); 
            } 
        }); 
        return movimientos; 
    } 

    contarFichasRestantes(){
        let contador = 0;
        for(let r = 0; r<7 ; r++){
            for(let c = 0; c<7; c++){
                if(this.matriz[r][c]===1)
                    contador++;
            }
        }
        return contador;
    }

    esJuegoTerminado(){
        if(this.contarFichasRestantes()===1)
            return true;
        for(let r=0; r<7; r++){
            for(let c=0; c<7; c++){
                if(this.matriz[r][c]===1){
                    if(this.obtenerMovimientosPosibles(r,c).length >0){
                        return false; //todavia quedan movimientos
                    }
                }
            }
        }
        return true; //no hay mas movimientos
    }
}