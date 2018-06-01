import {Individual} from './individual';
import { GroupedIndividuals } from 'individuals-map';

export class TLBO {
    names: string[] = ['Baldr','Signy','Gunnarr','Aida','Merv','Hikmet','Atifa','Ruzha','Lazar','Aurora','Demyan','Lim','Chelo','Subhash','Gaye','Gwenyth','Muhamad','Ranj','Dinesh','Marit','Deepak','Kjeld','Gerard','Klementina','Riina','Marie','Cathleen','Zahir','Daphne','Sibongile','Josué','Rosalinda','Pratima','Krishna','Aishwarya','Gilad','Janina','Shin','Olwyn','Svante','Vanessa','Cerdic','Ekkebert','Arnaud','Theotleip','Aritra','Serhat','Kuba','Alda','Behiye'];
    population: Individual[] = [];
    nMin = -5.12;
    nMax = 5.12;
    nDesignVariables = 2;
    nGenerations = 10;
    nPopulation = 10;

    currentTeacher: Individual;
    bestSolution: Individual = new Individual(0, 0, 0, 0, Number.POSITIVE_INFINITY);

    constructor() {}

    /** for debugging:
     * rastrigin: 93.24081268239809
     * linear: 409.59999999999997
     */
    initMinimalPopulation() {
        this.population = [];
        const minCost = this.cost([this.nMin, this.nMin, this.nMin, this.nMin]);
        
        for (let i = 0; i < 10; i++) {
            this.population.push(new Individual(this.nMin, this.nMin, this.nMin, this.nMin, minCost, 'Dummy'+i));
        }
    }

    /** for debugging: 
     * rastrigin: 8.82483201160156
     * linear: 0
     */
    initMaximalPopulation() {
        this.population = [];
        const maxCost = this.cost([this.nMax, this.nMax, this.nMax, this.nMax]);
        
        for (let i = 0; i < 10; i++) {
            this.population.push(new Individual(this.nMax, this.nMax, this.nMax, this.nMax, maxCost, 'Dummy'+i));
        }
    }

    initRandomPopulation() {
        this.population = [];

        for (let i = 0; i < this.nPopulation; i++) {
            let rndX = Math.random() * (this.nMax - this.nMin) + this.nMin;
            let rndY = Math.random() * (this.nMax - this.nMin) + this.nMin;
            let rndA = Math.random() * (this.nMax - this.nMin) + this.nMin;
            let rndB = Math.random() * (this.nMax - this.nMin) + this.nMin;
            let rndCst = this.cost([rndX, rndY, rndA, rndB]);

            this.population.push(new Individual(rndX, rndY, rndA, rndB, rndCst, this.names.pop()));
        };
        this.assignBestSolution();
    }

    setPopulation(population) {
        this.population = population;
        this.assignBestSolution();
    }

    assignBestSolution() {
        this.population.forEach(element => {
            if (element.cost < this.bestSolution.cost) {
                this.bestSolution = element;
            };
        });
    }

    linear(x) {
        let sum = x.reduce((sum, num) => {return sum += num;});
        return this.nMax * x.length - sum;
    }

    rastrigin(x) {
        const a = 10;
        const b = 0.2;
        const c = 2 * Math.PI;
        const bias = [-a*.5, -a*.5, -a*.5, -a*.5, -a*.5];

        let sum1 = 0;
        let sum2 = 0;

        for (let i = 0; i < x.length; i++) {
            sum1 = sum1 + Math.pow(x[i] + bias[i], 2);
            sum2 = sum2 + Math.cos(c * (x[i]  + bias[i]));
        };

        return - a * Math.exp(-b * Math.sqrt(1 / x.length * sum1)) - Math.exp(1 / x.length * sum2) + a + Math.exp(1) ;
    }

    cost(x) {
        return this.linear(x);
    }

    evaluate(element, newX, newY, newA, newB) {
        newX = Math.max(newX, this.nMin);
        newY = Math.max(newY, this.nMin);
        newA = Math.max(newA, this.nMin);
        newB = Math.max(newB, this.nMin);

        newX = Math.min(newX, this.nMax);
        newY = Math.min(newY, this.nMax);
        newA = Math.min(newA, this.nMax);
        newB = Math.min(newB, this.nMax);

        let newCost = this.cost([newX, newY, newA, newB]);

        if (newCost < element.cost) {
            element.cost = newCost;
            element.position.x = newX;
            element.position.y = newY;
            element.position.a = newA;
            element.position.b = newB;

            if (newCost < this.bestSolution.cost) {
                this.bestSolution = element;
            }
        }
    }

    appointTeacher() {
        this.currentTeacher = new Individual(0, 0, 0, 0, Number.POSITIVE_INFINITY);

        this.population.forEach(element => {
            if (element.cost < this.currentTeacher.cost) {
                this.currentTeacher = element;
            }
        });
    }

    getBestPerformingIndividual(population: Individual[]): Individual {
        let teacher: Individual = new Individual(0, 0, 0, 0, Number.POSITIVE_INFINITY);

        population.forEach(element => {
            if (element.cost < teacher.cost) {
                teacher = element;
            }
        });

        return teacher;
    }

    teachLearners() {
        // initiate
        let sumX = 0;
        let sumY = 0;
        let sumA = 0;
        let sumB = 0;

        this.population.forEach(element => {
            sumX += element.position.x;
            sumY += element.position.y;
            sumA += element.position.a;
            sumB += element.position.b;
        });

        let meanX = sumX / this.population.length;
        let meanY = sumY / this.population.length;
        let meanA = sumA / this.population.length;
        let meanB = sumB / this.population.length;

        // teacher
        this.population.forEach(element => {
            let teachingFactor = Math.floor(Math.random() * 2 + 1);
            let newX = element.position.x + Math.random() * this.currentTeacher.position.x - teachingFactor * meanX;
            let newY = element.position.y + Math.random() * this.currentTeacher.position.y - teachingFactor * meanY;
            let newA = element.position.a + Math.random() * this.currentTeacher.position.a - teachingFactor * meanA;
            let newB = element.position.b + Math.random() * this.currentTeacher.position.b - teachingFactor * meanB;

            this.evaluate(element, newX, newY, newA, newB);
        });
    }

    teachPopulation(teacher: Individual, population: Individual[]) {
        // initiate
        let sumX = 0;
        let sumY = 0;
        let sumA = 0;
        let sumB = 0;

        population.forEach(element => {
            sumX += element.position.x;
            sumY += element.position.y;
            sumA += element.position.a;
            sumB += element.position.b;
        });

        let meanX = sumX / population.length;
        let meanY = sumY / population.length;
        let meanA = sumA / population.length;
        let meanB = sumB / population.length;

        // teacher
        population.forEach(element => {
            let teachingFactor = Math.floor(Math.random() * 2 + 1);
            let newX = element.position.x + Math.random() * teacher.position.x - teachingFactor * meanX;
            let newY = element.position.y + Math.random() * teacher.position.y - teachingFactor * meanY;
            let newA = element.position.a + Math.random() * teacher.position.a - teachingFactor * meanA;
            let newB = element.position.b + Math.random() * teacher.position.b - teachingFactor * meanB;

            this.evaluate(element, newX, newY, newA, newB);
        });
    }

    teacher() {
        // initiate
        let sumX = 0;
        let sumY = 0;
        let sumA = 0;
        let sumB = 0;

        this.currentTeacher = new Individual(0, 0, 0, 0, Number.POSITIVE_INFINITY);

        this.population.forEach(element => {
            sumX += element.position.x;
            sumY += element.position.y;
            sumA += element.position.a;
            sumB += element.position.b;

            if (element.cost < this.currentTeacher.cost) {
                this.currentTeacher = element;
            }
        });
        let meanX = sumX / this.population.length;
        let meanY = sumY / this.population.length;
        let meanA = sumA / this.population.length;
        let meanB = sumB / this.population.length;

        // teacher
        this.population.forEach(element => {
            let teachingFactor = Math.floor(Math.random() * 2 + 1);
            let newX = element.position.x + Math.random() * this.currentTeacher.position.x - teachingFactor * meanX;
            let newY = element.position.y + Math.random() * this.currentTeacher.position.y - teachingFactor * meanY;
            let newA = element.position.a + Math.random() * this.currentTeacher.position.a - teachingFactor * meanA;
            let newB = element.position.b + Math.random() * this.currentTeacher.position.b - teachingFactor * meanB;

            this.evaluate(element, newX, newY, newA, newB);
        });
    }

    student(studentTeacherMap: GroupedIndividuals[] = undefined) {
        let mapping: GroupedIndividuals[] = [];

        this.population.forEach((element, index) => {
            let teacher: Individual;
            
            let suppliedTeacher = studentTeacherMap && studentTeacherMap.find(map => {
                return map.student.id == element.id;
            });
            
            if (suppliedTeacher && suppliedTeacher.teacher) { 
                teacher = suppliedTeacher.teacher;
            } else {
                let candidates = Array.apply(null, {length: this.population.length}).map(Number.call, Number);
                candidates.splice(index,1);
                let teacherIndex = candidates[Math.floor(Math.random() * (this.population.length - 1))];

                teacher = this.population[teacherIndex];
            }

            mapping.push(new GroupedIndividuals(element, teacher));
        });

        mapping.forEach(element => {
            let stepX = element.student.position.x - element.teacher.position.x;
            let stepY = element.student.position.y - element.teacher.position.y;
            let stepA = element.student.position.a - element.teacher.position.a;
            let stepB = element.student.position.b - element.teacher.position.b;

            if (element.teacher.cost < element.student.cost) {
                stepX = -stepX;
                stepY = -stepY;
                stepA = -stepA;
                stepB = -stepB;
            }

            let newX = element.student.position.x + Math.random() * stepX;
            let newY = element.student.position.y + Math.random() * stepY;
            let newA = element.student.position.a + Math.random() * stepA;
            let newB = element.student.position.b + Math.random() * stepB;

            this.evaluate(element.student, newX, newY, newA, newB);
        })
    }

    exchangeKnowledge(groupedIndividuals: GroupedIndividuals[]) {
        groupedIndividuals.forEach(group => {
            let stepX = group.student.position.x - group.teacher.position.x;
            let stepY = group.student.position.y - group.teacher.position.y;
            let stepA = group.student.position.a - group.teacher.position.a;
            let stepB = group.student.position.b - group.teacher.position.b;

            if (group.teacher.cost < group.student.cost) {
                stepX = -stepX;
                stepY = -stepY;
                stepA = -stepA;
                stepB = -stepB;
            }

            let newX = group.student.position.x + Math.random() * stepX;
            let newY = group.student.position.y + Math.random() * stepY;
            let newA = group.student.position.a + Math.random() * stepA;
            let newB = group.student.position.b + Math.random() * stepB;

            this.evaluate(group.student, newX, newY, newA, newB);
        });
    }

    cycle() {
        this.teacher();
        this.student();
    }
}