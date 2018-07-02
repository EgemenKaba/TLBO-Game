# Gamiﬁcation of an Optimisation Algorithm - Prototype Game Client

This is the repository of the prototype artefact containing the code for the game engine. The game engine was developed as part of the module "Innovation Thinking Project" for the Business Information Systems master degree program at the [University of Applied Science Northwestern Switzerland](https://www.fhnw.ch/en/degree-programmes/business/msc-bis).

## Getting Started

### Prerequisits

* [Node.js/npm](https://nodejs.org/en/download/)

### In npm client
Install Aurelia CLI and Yarn:

```
npm install aurelia-cli -g
npm install yarn -g
```

Load node modules:
```
yarn install
```

Start app:
```
au run --watch
```
### In your browser
```
http://localhost:8080
```

## Manual
In the following section, we will go over how to use the game engine to prepare and control a running game session and where to change the Firebase API key in order to move to a different Firebase instance.

### Prepare a Game Session
#### Population
The variable holding the population can be found in the file [tlbo.ts](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/tlbo.ts#L6), which holds the algorithm.
This variable is meant to be overwritten in the constructor of the file [app.ts](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L86). This file also holds the logic to control game elements.
Currently it is initialized with the initial data set of the experiment:
```javascript
this.population.push(new Individual(10,11,10,20,    undefined, 1, 'Anna'));
this.population.push(new Individual(18,2,3,9,       undefined, 2, 'Phillip'));
this.population.push(new Individual(7,21,18,10,     undefined, 3, 'Toshi'));
this.population.push(new Individual(16,19,12,12,    undefined, 4, 'Vanessa'));
this.population.push(new Individual(23,5,22,4,      undefined, 5, 'Natasha'));
this.population.push(new Individual(12,11,17,3,     undefined, 6, 'Andy'));
this.population.push(new Individual(13,6,8,14,      undefined, 7, 'Susan'));
this.population.push(new Individual(18,3,17,21,     undefined, 8, 'Laura'));
this.population.push(new Individual(4,5,3,20,       undefined, 9, 'Patricia'));
this.population.push(new Individual(1,12,17,2,      undefined, 10, 'Silvester'));
```

#### Cost function
The cost function is located [here](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/tlbo.ts#L94).
It can be overwritten in the constructor of the file [app.ts](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L64).
However, it is easier to just delegate to the [linear](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/tlbo.ts#L72) or the [rastrigin](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/tlbo.ts#L77) cost function as presented in the following:
```javascript
cost(x) {
    return this.linear(x);
}
```
```javascript
cost(x) {
    return this.rastrigin(x);
}
```
#### Skill interaction
There are a few important parameters for the skill interaction:
* The skills are capped - it can be parameterized [here](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L45)
* The boost for the upskilling part is a static number - it can be parameterized [here](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L46)

### Control a Game Session
#### Population
The population starts out idling.
Three actions can be taken:
* "Plane" - the individual is moved to the plane, the learning part of TLBO
* "Campfire" - the individual is moved to the campfire, the teaching part of TLBO
* "Upskilling" - the individual is moved to upskilling, the distracting part of the Game

While in upskilling, one must assign the individual on of three actions to partake:
* Stargazing
* Sandcastles
* Tinkering

#### Simulation
The button "Simulate the next round" takes the different groups as inputs for the different logical parts of the algorithm.
The plane and campfire population need at least two individuals to process.
The upskilling population is not being processed in the algorithm, instead they are being boosted with the previously defined static number:
* [Stargazing](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L340)
* [Sandcastles](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L348)
* [Tinkering](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L344)

Important note for maintenance:
* Simulation is done [here](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L221)
* There is a static boost in skills after the calculation of the algorithm, which is located [here](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L166)

#### Added features
There are a few added features, which helped understanding the algorithm and design levels.

An autopilot, which can be found at the top of the page.
It bypasses the inputs of the game master and processes the algorithm by the rules of the algorithm.
Important code lines for maintenance:
* Variable in the view model: [autopilot](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L15)
* Bypass here: [cycle](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L226)
* Phase [teacher](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/tlbo.ts#L208)
* Phase [learner](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/tlbo.ts#L244) without a parameter

The algorithm can be visualised by a checkbox at the top of the page.
This helped understand the algorithm and how the population behaves in different cost functions.
However, enabling this slows down the process significantly.
The visualisation is redrawn when the next round is simulated.
Important code lines for maintenance:
* Variable in the view model: [debug](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L14)
* Drawn during the simulation of the next round: [drawTLBO](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L104)

A cheat functionality is located at the bottom of the page.
This was intended to be used in the first round. However, parts of it were utilised to help out the actual algorithm.
It adds a static bump to all skill levels of the population.
Important code lines for maintenance:
* Function: [cheat](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L250)
* Increase can be controlled through the static numbers on this [line](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/app.ts#L247)

### Change Firebase API Key

If you want to use your own Firebase instance to host the realtime database, simply replace the following code block that can be found [here](https://github.com/EgemenKaba/TLBO-Game/blob/master/src/main.ts#L36) with your own API configuration:
```javascript
var config = {
    apiKey: "AIzaSyDxbyj1sNwfR12hPl5fxDEoh_4UBJzZ9Mo",
    authDomain: "itp-tlbo.firebaseapp.com",
    databaseURL: "https://itp-tlbo.firebaseio.com",
    projectId: "itp-tlbo",
    storageBucket: "itp-tlbo.appspot.com",
    messagingSenderId: "729643811214"
  };
```

## Built With

* [Node.js](https://nodejs.org/en/) - JavaScript run-time environment
* [Yarn](https://yarnpkg.com/lang/en/) - Dependency Management
* [Aurelia.io](https://aurelia.io/) - A JavaScript client framework for web, mobile and desktop
* [Firebase Realtime Database](https://firebase.google.com/products/realtime-database/) - Store and sync data in real time

## Authors

* **Egemen Kaba**

See also the list of [contributors](https://github.com/EgemenKaba/TLBO-Game/graphs/contributors) who participated in this project.

## Supervisors

* **[Dr. Elzbieta Pustulka](https://www.fhnw.ch/de/personen/elzbieta-pustulka)**
* **[Prof. Dr. Thomas Hanne](https://www.fhnw.ch/de/personen/thomas-hanne)**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
