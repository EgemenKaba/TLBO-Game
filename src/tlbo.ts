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
    bestSolution: Individual = new Individual(0, 0, Number.POSITIVE_INFINITY);

    constructor() {
        for (let i = 0; i < this.nPopulation; i++) {
            let rndX = Math.random() * (this.nMax - this.nMin) + this.nMin;
            let rndY = Math.random() * (this.nMax - this.nMin) + this.nMin;
            let rndCst = this.cost([rndX, rndY]);

            this.population.push(new Individual(rndX, rndY, rndCst, this.names.pop()));

            if (rndCst < this.bestSolution.cost) {
                this.bestSolution = this.population[i];
            };
        };
    }

    rastrigin(x) {
        const a = 10;
        const b = 0.2;
        const c = 2 * Math.PI;
        const bias = [a*0, a*0, a*.5, a*.5, a*.5];

        let sum1 = 0;
        let sum2 = 0;

        for (let i = 0; i < x.length; i++) {
            sum1 = sum1 + Math.pow(x[i] + bias[i], 2);
            sum2 = sum2 + Math.cos(c * (x[i]  + bias[i]));
        };

        return - a * Math.exp(-b * Math.sqrt(1 / x.length * sum1)) - Math.exp(1 / x.length * sum2) + a + Math.exp(1) ;
    }

    cost(x) {
        return this.rastrigin(x);
    }

    evaluate(element, newX, newY) {
        newX = Math.max(newX, this.nMin);
        newY = Math.max(newY, this.nMin);

        newX = Math.min(newX, this.nMax);
        newY = Math.min(newY, this.nMax);

        let newCost = this.cost([newX, newY]);

        if (newCost < element.cost) {
            element.cost = newCost;
            element.position.x = newX;
            element.position.y = newY;

            if (newCost < this.bestSolution.cost) {
                this.bestSolution = element;
            }
        }
    }

    appointTeacher() {
        this.currentTeacher = new Individual(0, 0, Number.POSITIVE_INFINITY);

        this.population.forEach(element => {
            if (element.cost < this.currentTeacher.cost) {
                this.currentTeacher = element;
            }
        });
    }

    getBestPerformingIndividual(population: Individual[]): Individual {
        let teacher: Individual = new Individual(0, 0, Number.POSITIVE_INFINITY);

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

        this.population.forEach(element => {
            sumX += element.position.x;
            sumY += element.position.y;
        });

        let meanX = sumX / this.population.length;
        let meanY = sumY / this.population.length;

        // teacher
        this.population.forEach(element => {
            let teachingFactor = Math.floor(Math.random() * 2 + 1);
            let newX = element.position.x + Math.random() * this.currentTeacher.position.x - teachingFactor * meanX;
            let newY = element.position.y + Math.random() * this.currentTeacher.position.y - teachingFactor * meanY;

            this.evaluate(element, newX, newY);
        });
    }

    teachPopulation(teacher: Individual, population: Individual[]) {
        // initiate
        let sumX = 0;
        let sumY = 0;

        population.forEach(element => {
            sumX += element.position.x;
            sumY += element.position.y;
        });

        let meanX = sumX / population.length;
        let meanY = sumY / population.length;

        // teacher
        population.forEach(element => {
            let teachingFactor = Math.floor(Math.random() * 2 + 1);
            let newX = element.position.x + Math.random() * teacher.position.x - teachingFactor * meanX;
            let newY = element.position.y + Math.random() * teacher.position.y - teachingFactor * meanY;

            this.evaluate(element, newX, newY);
        });
    }

    teacher() {
        // initiate
        let sumX = 0;
        let sumY = 0;
        this.currentTeacher = new Individual(0, 0, Number.POSITIVE_INFINITY);

        this.population.forEach(element => {
            sumX += element.position.x;
            sumY += element.position.y;

            if (element.cost < this.currentTeacher.cost) {
                this.currentTeacher = element;
            }
        });
        let meanX = sumX / this.population.length;
        let meanY = sumY / this.population.length;

        // teacher
        this.population.forEach(element => {
            let teachingFactor = Math.floor(Math.random() * 2 + 1);
            let newX = element.position.x + Math.random() * this.currentTeacher.position.x - teachingFactor * meanX;
            let newY = element.position.y + Math.random() * this.currentTeacher.position.y - teachingFactor * meanY;

            this.evaluate(element, newX, newY);
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

            if (element.teacher.cost < element.student.cost) {
                stepX = -stepX;
                stepY = -stepY;
            }

            let newX = element.student.position.x + Math.random() * stepX;
            let newY = element.student.position.y + Math.random() * stepY;

            this.evaluate(element.student, newX, newY);
        })
    }

    exchangeKnowledge(groupedIndividuals: GroupedIndividuals[]) {
        groupedIndividuals.forEach(group => {
            let stepX = group.student.position.x - group.teacher.position.x;
            let stepY = group.student.position.y - group.teacher.position.y;

            if (group.teacher.cost < group.student.cost) {
                stepX = -stepX;
                stepY = -stepY;
            }

            let newX = group.student.position.x + Math.random() * stepX;
            let newY = group.student.position.y + Math.random() * stepY;

            this.evaluate(group.student, newX, newY);
        });
    }

    cycle() {
        this.teacher();
        this.student();
    }
}