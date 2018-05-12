import {TLBO} from './tlbo';
import { Individual } from 'individual';
import { IndividualsMap } from './individuals-map';

interface IPreviousCostsDictionary {
    [index: string]: Individual;
}

export class App {

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tlbo: TLBO = new TLBO();

  studentTeacherMap: IndividualsMap[] = [];
  previousPopulationState = {} as IPreviousCostsDictionary;
  
  selectedTeacher: Individual;

  resources: number = 1000;
  currentTotalCosts: number = 0;
  previousTotalCosts: number = 0;

  boostedStudent: Individual;
  boostParameterOne: string = '0';
  boostParameterTwo: string = '0';

  loading: boolean = false;

  attached() {
    this.context = this.canvas.getContext('2d');

    this.drawTLBO();
    this.updateTotalCosts();
  }

  constructor() {
    this.tlbo.population.forEach(element => {
      this.studentTeacherMap.push(new IndividualsMap(element, undefined));
    });
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

  setLoading(loading: boolean) {
      this.loading = loading;
  }

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

  scalePosition(position) {
    return (position + (this.tlbo.nMax - this.tlbo.nMin) / 2) * 100;
  }

  reverseScalePosition(scaledPosition) {
      return (scaledPosition / 100) - ((this.tlbo.nMax - this.tlbo.nMin) / 2);
  }

  getStudents() {
      return this.studentTeacherMap.map(element => {
          return element.student;
      });
  }

  updateTotalCosts() {
      this.previousTotalCosts = this.currentTotalCosts;
      this.currentTotalCosts = this.getSumOfCosts(this.tlbo.population);
  }

  getSumOfCosts(individuals: Individual[]) {
      let sum = 0;

      if (individuals && individuals.length > 0) {
        individuals.forEach(element => {
            sum += element.cost;
          });
      }

      return sum;
  }

  rememberPreviousState() {
      this.tlbo.population.forEach(element => {
          this.previousPopulationState[element.id] = Object.assign({}, element);
      });
  }

  boostStudent() {
      let student: Individual = this.boostedStudent || this.getRandomStudent();

      let rawPixelPositionX = this.scalePosition(student.position.x) + Number.parseFloat(this.boostParameterOne);
      let rawPixelPositionY = this.scalePosition(student.position.y) + Number.parseFloat(this.boostParameterTwo);

      student.position.x = this.reverseScalePosition(rawPixelPositionX);
      student.position.y = this.reverseScalePosition(rawPixelPositionY);
      student.cost = this.tlbo.cost([student.position.x, student.position.y]);

      this.currentTotalCosts = this.getSumOfCosts(this.tlbo.population);
  }

  getRandomStudent() {
    return this.tlbo.population[Math.floor(Math.random()*this.tlbo.population.length)];
  }
}

/*
/////// notes

this.init = function() {
    this.resources = 1000;
    this.nStepped = 0;
};

this.appendBestSolution = function() {
    document.getElementById("result").innerHTML = document.getElementById("result").innerHTML + "<br/>" + "cost: " + this.bestSolution.cost + " x: " + this.bestSolution.position.x + " y: " + this.bestSolution.position.y;
};

this.printBestSolution = function() {
    document.getElementById("result").innerHTML = "cost: " + this.bestSolution.cost + " x: " + this.bestSolution.position.x + " y: " + this.bestSolution.position.y;
};

this.displayPopulation = function() {
    const popContainer = document.getElementById('population');
    popContainer.innerHTML = '';
    this.population.forEach(individual => {
        popContainer.innerHTML = popContainer.innerHTML + '<p>' + individual + '</p>';
    });
};

this.updateResources = function() {
    this.nStepped++;

    let resourceUsage = 0;

    this.population.forEach(element => {
        resourceUsage += element.cost;
    });

    this.resources -= resourceUsage;

    const resContainer = document.getElementById('resources');
    resContainer.innerHTML = 'resources used in turn ' + this.nStepped + ': ' + resourceUsage + '; resources remaining: ' + this.resources;
};
*/
