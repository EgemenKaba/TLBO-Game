import {TLBO} from './tlbo';
import { Individual } from 'individual';
import { GroupedIndividuals } from './individuals-map';

interface IPreviousCostsDictionary {
    [index: string]: Individual;
}

export class App {

    debug: boolean = true;
    autopilot: boolean = true;

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tlbo: TLBO = new TLBO();

  studentTeacherMap: GroupedIndividuals[] = [];
  previousPopulationState = {} as IPreviousCostsDictionary;
  
  selectedTeacher: Individual;

  resources: number = 1000;

  boostedStudent: Individual;
  boostParameterOne: string = '0';
  boostParameterTwo: string = '0';

  loading: boolean = false;

  idleIndividuals: Individual[] = [];
  groupWorkIndividuals: Individual[] = [];
  teachingSessionIndividuals: Individual[] = [];

  idleIndividualsSum: number = 0;
  groupWorkIndividualsSum: number = 0;
  teachingSessionIndividualsSum: number = 0;
  currentTotalCosts: number = 0;

  idleIndividualsSumPrev: number;
  groupWorkIndividualsSumPrev: number;
  teachingSessionIndividualsSumPrev: number;
  previousTotalCosts: number;

  skillCap: number = 25;

  attached() {
    if (this.debug) {
        this.context = this.canvas.getContext('2d');
        this.drawTLBO();
    }
    this.refreshSums();
    this.updateTotalCosts();
  }

  constructor() {
    this.idleIndividuals = this.tlbo.population;
  }

  drawTLBO() {
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
/*
  advanceCycle() {
    this.rememberPreviousState();
    this.tlbo.cycle();
    this.context.clearRect(0, 0, 1024, 1024);
    this.drawTLBO();
    this.updateTotalCosts();
    this.resources -= this.currentTotalCosts;
  };

  performAppointment() {
    this.tlbo.appointTeacher();
    this.drawTLBO();
  };

  performTeaching() {
    this.rememberPreviousState();
    this.tlbo.currentTeacher = this.selectedTeacher || this.getRandomStudent();
    this.tlbo.teachLearners();
    this.drawTLBO();
    this.updateTotalCosts();
    this.resources -= this.currentTotalCosts;
  };

  performLearning() {
    this.rememberPreviousState();
    this.tlbo.student(this.studentTeacherMap);
    this.drawTLBO();
    this.updateTotalCosts();
    this.resources -= this.currentTotalCosts;
  }
*/

  simulateNextRound() {
      this.rememberPreviousState();

      if (this.autopilot) {
        this.tlbo.cycle();
      } else {
        if (this.teachingSessionIndividuals && this.teachingSessionIndividuals.length > 0) {
            this.selectedTeacher = this.selectedTeacher || this.getRandomStudent(this.teachingSessionIndividuals);
            this.tlbo.teachPopulation(this.selectedTeacher, this.teachingSessionIndividuals);
          }
          
          if (this.studentTeacherMap && this.studentTeacherMap.length > 0) {
            this.fillInEmptyPairings(this.studentTeacherMap, this.groupWorkIndividuals);
            this.tlbo.exchangeKnowledge(this.studentTeacherMap);
          }
      }
      
      this.refreshSums();
      this.updateTotalCosts();

      if (this.debug) {
          this.drawTLBO();
      }

      this.resources -= Math.trunc(this.currentTotalCosts);
  }

  fillInEmptyPairings(studentTeacherMap: GroupedIndividuals[], workers: Individual[]) {
      studentTeacherMap.forEach(element => {
          if (!element.teacher) {
              console.log('filling in');
              element.teacher = this.getRandomStudent(workers);
              console.log('filled in ' + element.teacher);
          }
      });
  }

  normalizePosition(position) {  
        return (position - this.tlbo.nMin) / (this.tlbo.nMax - this.tlbo.nMin) * this.skillCap;
  }

  denormalizePosition(normPosition) {
        return normPosition / this.skillCap * (this.tlbo.nMax - this.tlbo.nMin) + this.tlbo.nMin;
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
        this.idleIndividualsSumPrev = this.idleIndividualsSum;
        this.groupWorkIndividualsSumPrev = this.groupWorkIndividualsSum;
        this.teachingSessionIndividualsSumPrev = this.teachingSessionIndividualsSum;
  }

  boostStudent(individual: Individual) {
      let student: Individual = individual || this.getRandomStudent(this.tlbo.population);

      let normalizedPositionX = this.normalizePosition(student.position.x) + Number.parseFloat(this.boostParameterOne);
      let normalizedPositionY = this.normalizePosition(student.position.y) + Number.parseFloat(this.boostParameterTwo);

      student.position.x = this.denormalizePosition(normalizedPositionX);
      student.position.y = this.denormalizePosition(normalizedPositionY);

      student.position.x = this.sanitizeSkillBoundaries(student.position.x, 0, this.skillCap);
      student.position.y = this.sanitizeSkillBoundaries(student.position.y, 0, this.skillCap);
      
      student.cost = this.tlbo.cost([student.position.x, student.position.y]);

      this.currentTotalCosts = this.summarizeCost(this.tlbo.population);
  }

  getRandomStudent(pop: Individual[] = undefined) {
      if (pop) {
          return pop[Math.floor(Math.random()*pop.length)];
      }
      
      return this.tlbo.population[Math.floor(Math.random()*this.tlbo.population.length)];
  }

  changeGroups(source: Individual[], destination: Individual[], individual: Individual) {
      source.splice(source.indexOf(individual), 1);
      destination.push(individual);

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

        // this is dirty
        this.groupWorkIndividuals.splice(this.groupWorkIndividuals.indexOf(individual), 1);
        this.refreshSums();
  }

  changeGroupsToGroupWork(source: Individual[], destination: GroupedIndividuals[], individual: Individual) {
    source.splice(source.indexOf(individual), 1);
    destination.push(new GroupedIndividuals(individual, undefined));

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

}