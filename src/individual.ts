export class Individual {
    id: string
    cost: number;
    position: Position;

    constructor(x: number, y: number, a: number, b: number, cost: number, id: string = '') {
        this.position = {
            x: x,
            y: y,
            a: a,
            b: b
        };
        this.cost = cost;
        this.id = id;
    }

    toString() {
        return (this.id && 'id: ' + this.id || '') + 'x: ' + this.position.x + ' y: ' + this.position.y + 'a: ' + this.position.a + 'b: ' + this.position.b + ' cost: ' + this.cost;
    }
}

class Position {
    x: number;
    y: number;
    a: number;
    b: number;
}