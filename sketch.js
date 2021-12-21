
let board;
let weight;
let changeWeightButton;
let resetButton;
let addingWeight = false;
let pivot;

function setup() {
  createCanvas(800, 600);
  board = new BalanceBoard(7, 4);

  resetButton = createButton("Reset");
  resetButton.position(10, height - 50);
  resetButton.size(100, 40);
  resetButton.style("font-size", "20px");
  resetButton.style("background-color", color(240, 240, 130));
  resetButton.mousePressed(reset);

  changeWeightButton = createButton("Add Weight");
  changeWeightButton.position(120, height - 50);
  changeWeightButton.size(160, 40);
  changeWeightButton.style("font-size", "20px");
  changeWeightButton.style("background-color", color(140, 210, 240));
  changeWeightButton.mousePressed(checkWeight);

  pivot = createVector(width / 2, height / 2 - (board.height/2-0.5) *  board.spacing);
  
  addWeight(0,0)
  addWeight(0,0)
  addWeight(0,0)
  
}

function draw() {
  background(220);
  
  strokeWeight(1);
  board.move();
  board.display();
  strokeWeight(3);
  line(width / 2, 0, width / 2, height / 2 - (board.height/2-0.5) *  board.spacing );
  if (addingWeight){
     push();
    translate(mouseX,mouseY+6);
    fill(100);
    rect(0, 0, 20, 4);
    line(0, 0, 0, -6);
    pop();
    
  }
  ellipse(pivot.x, pivot.y, 10, 10)
}

class BalanceBoard {
  constructor(w, h) {
    this.angle = radians(0);
    this.width = w;
    this.height = h;
    this.holes = [];
    this.mass = 1;
    this.rotI = 1000;
    this.omega = 0;
    this.spacing = 80;
    for (let i = 0; i < this.width; i++) {
      this.holes.push([]);
      for (let j = 0; j < this.height; j++) {
        this.holes[i].push(0);
      }
    }
  }
  display() {
    rectMode(CENTER);
    ellipseMode(CENTER);
    push();
    translate(pivot.x, pivot.y)
    //translate(width / 2, height / 2);
    //translate(0, -height / 6 + 6);
    rotate(this.angle);
    translate(0, board.spacing*1.5);
    fill(250);
    rect(
      0,
      0,
      this.width * (this.spacing + 3),
      this.height * (this.spacing + 3)
    );
    fill(0);
    noStroke;
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        circle(
          this.spacing * (-this.width / 2 + i + 0.5),
          this.spacing * (-this.height / 2 + j + 0.5),
          5
        );
      }
    }
    pop();

    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        for (let blockCount = 0; blockCount < this.holes[i][j]; blockCount++) {
          push();
          translate(pivot.x, pivot.y + 6 * blockCount);
          rotate(this.angle);
          translate(-pivot.x, -pivot.y - 6 * blockCount);

          translate(
            width / 2 - (this.width / 2 - i) * this.spacing + this.spacing / 2,
            height / 2 -
              (this.height / 2 - j) * this.spacing +
              this.spacing / 2 +
              6 +
              blockCount * 7
          );
          rotate(-this.angle);
          fill(100);
          rect(0, 0, 20, 4);
          line(0, 0, 0, -6);
          pop();
        }
      }
    }
  }

  calculateTorque() {
    let torque = 0;
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        torque =
          torque -
          ((this.width - 1) / 2 - i) *
            this.holes[i][j] *
            Math.sin(PI / 2 - this.angle) +
          (this.height / 6 - j) *
            this.holes[i][j] *
            Math.cos(PI / 2 - this.angle) -
          Math.sin(this.angle) * this.mass;
      }
    }
    return torque;
  }

  move() {
    let alpha = this.calculateTorque() / this.rotI - 1 * this.omega;
    this.omega = this.omega + alpha;
    this.angle = this.angle + this.omega;
  }
}

class Weight {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.m = 1;
  }
  display() {
    push();
    translate(
      width / 2 -
        (board.width / 2 - this.x) * board.spacing +
        board.spacing / 2,
      height / 2 -
        (board.height / 2 - this.y) * board.spacing +
        board.spacing / 2 +
        6
    );
    fill(100);
    rect(0, 0, 20, 4);
    line(0, 0, 0, -6);
    pop();
  }
}

function addWeight(x, y) {
  board.holes[x][y] = board.holes[x][y] + 1;
}

function removeWeight(x, y) {
  if (board.holes[x][y] > 0) board.holes[x][y] = board.holes[x][y] - 1;
}

function reset() {
  board.holes = [];
  for (let i = 0; i < board.width; i++) {
    board.holes.push([]);
    for (let j = 0; j < board.height; j++) {
      board.holes[i].push(0);
    }
  }
}
function checkWeight() {
  if (!addingWeight) {
    changeWeightButton.html("Remove Weight");
  } else {
    changeWeightButton.html("Add Weight");
  }
  addingWeight = !addingWeight;
}

function mousePressed() {
    for (let i = 0; i < board.width; i++) {
      for (let j = 0; j < board.height; j++) {
        let x = pivot.x - board.spacing*((board.width-1)/2 - i) * cos(board.angle) 
        - (j*board.spacing)*sin(board.angle)
        
        
          let y =    -board.spacing*((board.width-1)/2 - i)*sin(board.angle) +
                pivot.y + j*board.spacing*cos(board.angle)
        
        let d = dist(mouseX,mouseY,x,y);
        if (d < 5) {
          if (addingWeight){
            addWeight(i, j);
             
          } else{
            removeWeight(i,j)
          
          }
          d = 100
         
        }
      }
    }
  
  
}
