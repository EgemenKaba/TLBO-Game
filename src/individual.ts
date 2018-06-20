import { Action } from './action';

export class Individual {
    id: number;
    name: string;
    cost: number;
    position: Position;
    action: Action = Action.IDLING;

    constructor(x: number, y: number, a: number, b: number, cost: number, id: number = undefined, name: string = '') {
        this.position = {
            x: x,
            y: y,
            a: a,
            b: b
        };
        this.cost = cost;
        this.name = name;
        this.id = id;
    }

    toString() {
        return 'id: ' + this.id + (this.name && 'name: ' + this.name || '') + 'x: ' + this.position.x + ' y: ' + this.position.y + 'a: ' + this.position.a + 'b: ' + this.position.b + ' cost: ' + this.cost;
    }
}

class Position {
    x: number;
    y: number;
    a: number;
    b: number;
}