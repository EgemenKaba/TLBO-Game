import { TLBO } from './tlbo';
import { Individual } from 'individual';
import { GroupedIndividuals } from './individuals-map';
import * as firebase from 'firebase/app';
import 'firebase/database';

interface IPreviousCostsDictionary {
    [index: number]: Individual;
}

export class App {

    debug: boolean = false;
    autopilot: boolean = false;

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    
    tlbo: TLBO;
    population: Individual[] = [];

    studentTeacherMap: GroupedIndividuals[] = [];
    previousPopulationState = {} as IPreviousCostsDictionary;

    selectedTeacher: Individual;

    idleIndividuals: Individual[] = [];
    groupWorkIndividuals: Individual[] = [];
    teachingSessionIndividuals: Individual[] = [];
    upskillingIndividuals: Individual[] = [];

    idleIndividualsSum: number = 0;
    groupWorkIndividualsSum: number = 0;
    teachingSessionIndividualsSum: number = 0;
    upskillingIndividualsSum: number = 0;
    currentTotalCosts: number = 0;

    idleIndividualsSumPrev: number;
    groupWorkIndividualsSumPrev: number;
    teachingSessionIndividualsSumPrev: number;
    upskillingIndividualsSumPrev: number;
    previousTotalCosts: number;

    skillCap: number = 25;
    skillBoost: number = 2;

    gameRef;
    scenario: string = 'level 1 - linear algorithm';

    constructor() {
        this.gameRef = firebase.database().ref('games').push({
            scenario: this.scenario,
            timestamp: Date.now()
          }
        );

        this.tlbo = new TLBO();
        //this.tlbo.cost = this.tlbo.rastrigin;
        //this.tlbo.cost = this.tlbo.linear;

        this.population.push(new Individual(10,11,10,20,    undefined, 1, 'Arnaud'));
        this.population.push(new Individual(18,2,3,9,       undefined, 2, 'Ekkebert'));
        this.population.push(new Individual(7,21,18,10,     undefined, 3, 'Cerdic'));
        this.population.push(new Individual(16,19,12,12,    undefined, 4, 'Vanessa'));
        this.population.push(new Individual(23,5,22,4,      undefined, 5, 'Behiye'));
        this.population.push(new Individual(12,11,17,3,     undefined, 6, 'Alda'));
        this.population.push(new Individual(13,6,8,14,      undefined, 7, 'Kuba'));
        this.population.push(new Individual(18,3,17,21,     undefined, 8, 'Serhat'));
        this.population.push(new Individual(4,5,3,20,       undefined, 9, 'Aritra'));
        this.population.push(new Individual(1,12,17,2,      undefined, 10, 'Theotleip'));

        this.population.forEach(element => {
            element.position.x = this.denormalizePosition(element.position.x);
            element.position.y = this.denormalizePosition(element.position.y);
            element.position.a = this.denormalizePosition(element.position.a);
            element.position.b = this.denormalizePosition(element.position.b);

            element.cost = this.tlbo.cost([element.position.x, element.position.y, element.position.a, element.position.b]);
        });

        this.tlbo.setPopulation(this.population);
        
        //this.tlbo.initMaximalPopulation();

        if (this.debug) {
            this.drawTLBO();
        }
        this.refreshSums();
        this.currentTotalCosts = this.summarizeCost(this.tlbo.population);

        this.tlbo.population.forEach(element => {
            this.idleIndividuals.push(element);
        });

        this.persistState(this.tlbo.population, this.calculateEfficiency(this.currentTotalCosts));
        this.scenario += 1;
    }

    drawTLBO() {
        this.context = this.canvas.getContext('2d');
        this.drawCostFunction();
        this.drawPopulation();
        this.drawTeacher();
    }

    drawCostFunction() {
        let pixels = [];
        let maxDepth = Number.NEGATIVE_INFINITY;
        let minDepth = Number.POSITIVE_INFINITY;

        for (let i = this.tlbo.nMin; i < this.tlbo.nMax; i += 0.01) {
            for (let j = this.tlbo.nMin; j < this.tlbo.nMax; j += 0.01) {
                let cost = this.tlbo.cost([i, j]);
                if (cost > maxDepth) { maxDepth = cost; };
                if (cost < minDepth) { minDepth = cost; };

                pixels.push({
                    x: this.scalePosition(i),
                    y: this.scalePosition(j),
                    cost: this.tlbo.cost([i, j])
                });
            }
        };

        pixels.forEach(element => {
            let normalizedCost = (element.cost - minDepth) / (maxDepth - minDepth);
            let cost = Math.floor(normalizedCost * 255);

            this.context.fillStyle = 'rgb(' + cost + ', ' + cost + ',' + cost + ')';
            this.context.fillRect(element.x, element.y, 1, 1);
        });

        // best solution for rastrigin
        //this.context.fillStyle = 'red'
        //this.context.fillRect(this.scalePosition(0)-2.5, this.scalePosition(0)-2.5, 5, 5);
    };

    drawTeacher() {
        if (this.tlbo.currentTeacher) {
            this.drawIndividual(this.tlbo.currentTeacher.position.x, this.tlbo.currentTeacher.position.y, 'green');
        }
    };

    drawIndividual(x, y, color) {
        this.context.fillStyle = color;
        this.context.fillRect(this.scalePosition(x) - 2, this.scalePosition(y) - 2, 4, 4);
    };

    drawPopulation() {
        this.tlbo.population.forEach(element => {
            this.drawIndividual(element.position.x, element.position.y, 'purple');
        });
    };

    simulateTeaching() {
        if (this.teachingSessionIndividuals && this.teachingSessionIndividuals.length > 0) {
            let teacher = this.tlbo.getBestPerformingIndividual(this.teachingSessionIndividuals);
            console.log(teacher);
            this.tlbo.teachPopulation(teacher, this.teachingSessionIndividuals);
        }
    }

    simulateLearning() {
        if (this.studentTeacherMap && this.studentTeacherMap.length > 0) {
            this.fillInEmptyPairings(this.studentTeacherMap, this.groupWorkIndividuals);
            console.log(this.studentTeacherMap);
            this.tlbo.exchangeKnowledge(this.studentTeacherMap);
        }
    }

    persistState(population: Individual[], efficiency: number) {
        let characters: Object = {};
        population.forEach((element) => {
            characters[element.id] = {
                name: element.name,
                eng: Math.round(this.normalizePosition(element.position.x)),
                mec: Math.round(this.normalizePosition(element.position.y)),
                pil: Math.round(this.normalizePosition(element.position.a)),
                nav: Math.round(this.normalizePosition(element.position.b))
            }
        });
        
        firebase.database().ref('games/' + this.gameRef.key + '/turns/').push(
            {
                efficiency: efficiency.toFixed(2),
                characters: characters
            }
        );
        
    };

    simulateNextRound() {
        this.rememberPreviousState();

        if (this.autopilot) {
            this.tlbo.cycle();
        } else {
            this.simulateTeaching();
            this.simulateLearning();
        }

        this.sanitizeStudents();
        this.refreshSums();
        this.updateTotalCosts();

        if (this.debug) {
            this.drawTLBO();
        }

        this.persistState(this.tlbo.population, this.calculateEfficiency(this.currentTotalCosts));
        this.scenario += 1;
    }

    calculateCheating(coord: number) {
        return (this.tlbo.nMax - coord) * (0.2 + Math.random() * 0.05);
    }
    
    cheat() {
        this.tlbo.population.forEach(element => {
            element.position.x += this.calculateCheating(element.position.x);
            element.position.y += this.calculateCheating(element.position.y);
            element.position.a += this.calculateCheating(element.position.a);
            element.position.b += this.calculateCheating(element.position.b);
        });

        this.sanitizeStudents();
        this.refreshSums();
        this.updateTotalCosts();

        if (this.debug) {
            this.drawTLBO();
        }

        this.persistState(this.tlbo.population, this.calculateEfficiency(this.currentTotalCosts));
        this.scenario += 1;
    }

    cleanupPairings(studentTeacherMap: GroupedIndividuals[]) {
        studentTeacherMap.forEach(element => {
            element.teacher = undefined;
        })
    };

    fillInEmptyPairings(studentTeacherMap: GroupedIndividuals[], workers: Individual[]) {
        studentTeacherMap.forEach((element, index) => {
            if (!element.teacher) {
                let candidates = Array.apply(null, {length: workers.length}).map(Number.call, Number);
                candidates.splice(index,1);
                let teacherIndex = candidates[Math.floor(Math.random() * (workers.length - 1))];

                element.teacher = workers[teacherIndex];
            }
        });
    }

    normalizePosition(position) {
        return (position - this.tlbo.nMin) / (this.tlbo.nMax - this.tlbo.nMin) * this.skillCap;
    }

    denormalizePosition(normPosition) {
        return normPosition / this.skillCap * (this.tlbo.nMax - this.tlbo.nMin) + this.tlbo.nMin;
    }

    normalizeCost(cost) {
        return (cost - 0) / (409.60 - 0) * 100;
    }

    scalePosition(position) {
        return (position + (this.tlbo.nMax - this.tlbo.nMin) / 2) * 100;
    }

    reverseScalePosition(scaledPosition) {
        return (scaledPosition) - ((this.tlbo.nMax - this.tlbo.nMin) / 2);
    }

    getStudents(studentTeacherMap: GroupedIndividuals[]) {
        return studentTeacherMap.map(element => {
            return element.student;
        });
    }

    updateTotalCosts() {
        this.previousTotalCosts = this.currentTotalCosts;
        this.currentTotalCosts = this.summarizeCost(this.tlbo.population);
    }

    rememberPreviousState() {
        this.population.forEach(element => {
            this.previousPopulationState[element.id] = Object.assign({}, element);
        });
        this.idleIndividualsSumPrev = this.idleIndividualsSum;
        this.groupWorkIndividualsSumPrev = this.groupWorkIndividualsSum;
        this.teachingSessionIndividualsSumPrev = this.teachingSessionIndividualsSum;
    }

    starGazing(i: Individual) {
        this.boostStudent(i, 0, 0, this.skillBoost, this.skillBoost);
    }

    tinkering(i: Individual) {
        this.boostStudent(i, this.skillBoost, this.skillBoost, 0, 0);
    }

    buildingSandCastles(i: Individual) {
        this.boostStudent(i, this.skillBoost, 0, 0, 0);
    }

    sanitizeStudents() {
        this.tlbo.population.forEach(student => {
            let normalizedPositionX = this.normalizePosition(student.position.x);
            let normalizedPositionY = this.normalizePosition(student.position.y);
            let normalizedPositionA = this.normalizePosition(student.position.a);
            let normalizedPositionB = this.normalizePosition(student.position.b);
    
            student.position.x = this.sanitizeSkillBoundaries(normalizedPositionX, 1, this.skillCap);
            student.position.y = this.sanitizeSkillBoundaries(normalizedPositionY, 1, this.skillCap);
            student.position.a = this.sanitizeSkillBoundaries(normalizedPositionA, 1, this.skillCap);
            student.position.b = this.sanitizeSkillBoundaries(normalizedPositionB, 1, this.skillCap);
    
            student.position.x = this.denormalizePosition(student.position.x);
            student.position.y = this.denormalizePosition(student.position.y);
            student.position.a = this.denormalizePosition(student.position.a);
            student.position.b = this.denormalizePosition(student.position.b);
    
            student.cost = this.tlbo.cost([student.position.x, student.position.y, student.position.a, student.position.b]);
        });
    }

    boostStudent(individual: Individual, eng: number, mech: number, pilot: number, nav: number) {
        let student: Individual = individual || this.getRandomStudent(this.tlbo.population);

        let normalizedPositionX = this.normalizePosition(student.position.x) + eng;
        let normalizedPositionY = this.normalizePosition(student.position.y) + mech;
        let normalizedPositionA = this.normalizePosition(student.position.a) + pilot;
        let normalizedPositionB = this.normalizePosition(student.position.b) + nav;

        student.position.x = this.sanitizeSkillBoundaries(normalizedPositionX, 1, this.skillCap);
        student.position.y = this.sanitizeSkillBoundaries(normalizedPositionY, 1, this.skillCap);
        student.position.a = this.sanitizeSkillBoundaries(normalizedPositionA, 1, this.skillCap);
        student.position.b = this.sanitizeSkillBoundaries(normalizedPositionB, 1, this.skillCap);

        student.position.x = this.denormalizePosition(student.position.x);
        student.position.y = this.denormalizePosition(student.position.y);
        student.position.a = this.denormalizePosition(student.position.a);
        student.position.b = this.denormalizePosition(student.position.b);

        student.cost = this.tlbo.cost([student.position.x, student.position.y, student.position.a, student.position.b]);

        this.previousPopulationState[individual.id] = individual;
        this.currentTotalCosts = this.summarizeCost(this.tlbo.population);
        this.upskillingIndividualsSumPrev = this.upskillingIndividualsSumPrev;
        this.upskillingIndividualsSum = this.summarizeCost(this.upskillingIndividuals);
    }

    getRandomStudent(pop: Individual[] = undefined) {
        if (pop) {
            return pop[Math.floor(Math.random() * pop.length)];
        }

        return this.tlbo.population[Math.floor(Math.random() * this.tlbo.population.length)];
    }

    setAllIndividualsToIdling() {
        this.teachingSessionIndividuals.forEach(element => {
            this.idleIndividuals.push(element);
        });
        this.teachingSessionIndividuals = [];

        this.studentTeacherMap.forEach(element => {
            this.idleIndividuals.push(element.student);
        });
        this.studentTeacherMap = [];
        this.groupWorkIndividuals = [];

        this.upskillingIndividuals.forEach(element => {
            this.idleIndividuals.push(element);
        });
        this.upskillingIndividuals = [];

        this.idleIndividuals.sort(this.individualsComparatorById);
        this.refreshSums();
    }

    changeGroups(source: Individual[], destination: Individual[], individual: Individual) {
        source.splice(source.indexOf(individual), 1);
        destination.push(individual);
        destination.sort(this.individualsComparatorById);

        // this is dirty
        this.refreshSums();
    }

    changeGroupsFromGroupwork(source: GroupedIndividuals[], destination: Individual[], individual: Individual) {
        source.splice(source.findIndex(
            element => {
                return element.student.id == individual.id;
            }
        ), 1);
        destination.push(individual);
        destination.sort(this.individualsComparatorById);

        // this is dirty
        this.groupWorkIndividuals.splice(this.groupWorkIndividuals.indexOf(individual), 1);
        this.refreshSums();
    }

    changeGroupsToGroupWork(source: Individual[], destination: GroupedIndividuals[], individual: Individual) {
        source.splice(source.indexOf(individual), 1);
        destination.push(new GroupedIndividuals(individual, undefined));
        destination.sort((a, b) => {
            return a.student.id - b.student.id;
        });

        // this is dirty
        this.groupWorkIndividuals.push(individual);
        this.refreshSums();
    }

    refreshSums() {
        this.idleIndividualsSum = this.summarizeCost(this.idleIndividuals);
        this.groupWorkIndividualsSum = this.summarizeCost(this.groupWorkIndividuals);
        this.teachingSessionIndividualsSum = this.summarizeCost(this.teachingSessionIndividuals);
    }

    summarizeCost(pop: Individual[]) {
        let sum: number = 0;

        if (pop && pop.length > 0) {
            pop.forEach(element => {
                sum += element.cost;
            });
        }

        return sum;
    }

    sanitizeSkillBoundaries(pos: number, lowerLimit: number, upperLimit: number) {
        return Math.min(upperLimit, Math.max(lowerLimit, pos));
    }    

    calculateEfficiency(cost: number): number {
        if (!cost) return undefined;
        return ((cost - this.tlbo.getMinCost()) / (this.tlbo.getMaxCost() - this.tlbo.getMinCost()) * 100);
    }

    individualsComparatorById(a: Individual, b:Individual) {
        return a.id - b.id;
    }

}
