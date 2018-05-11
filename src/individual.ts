export class Individual {
    id: string
    cost: number;
    position: Position;

    constructor(x: number, y: number, cost: number, id: string = '') {
        this.position = {
            x: x,
            y: y
        };
        this.cost = cost;
        this.id = id;
    }

    toString() {
        return (this.id && 'id: ' + this.id || '') + 'x: ' + this.position.x + ' y: ' + this.position.y + ' cost: ' + this.cost;
    }
}

class Position {
    x: number;
    y: number;
}