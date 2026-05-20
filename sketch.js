let board;
let resetButton;
let pivot;
const distToBoard = 10;
// Drag state
// draggedWeight: { fromFloor, floorIndex, boardI, boardJ, count }
let draggedWeight = null;

// Floor weights: array of { x, y } screen positions
let floorWeights = [];
const FLOOR_Y = 560;
const FLOOR_WEIGHT_START_X = 180;
const FLOOR_WEIGHT_SPACING = 25;
const NUM_FLOOR_WEIGHTS = 20;

function setup() {
  createCanvas(800, 600);
  rectMode(CENTER);
  ellipseMode(CENTER);

  board = new BalanceBoard(7, 4);

  resetButton = createButton("Reset");
  resetButton.position(10, height - 50);
  resetButton.size(100, 40);
  resetButton.style("font-size", "20px");
  resetButton.style("background-color", color(240, 240, 130));
  resetButton.mousePressed(reset);

  pivot = createVector(width / 2, height / 2 - (board.height / 2 - 0.5) * board.spacing);

  for (let k = 0; k < NUM_FLOOR_WEIGHTS; k++) {
    floorWeights.push({ x: FLOOR_WEIGHT_START_X + k * FLOOR_WEIGHT_SPACING, y: FLOOR_Y });
  }
}

function draw() {
  background(220);

  // Floor area
  push();
  fill(180, 160, 120);
  noStroke();
  rect(width / 2, height - 30, width, 60);
  fill(150, 130, 90);
  rect(width / 2, height - 58, width, 6);
  pop();

  strokeWeight(1);
  board.move();
  board.display();

  strokeWeight(3);
  line(width / 2, 0, width / 2, pivot.y);
  ellipse(pivot.x, pivot.y, 10, 10);

  // --- Compute hover state ---
  let hoverHole = null;      // nearest hole while dragging
  let hoverFloorIdx = -1;    // nearest floor weight while idle
  let hoverBoardI = -1;
  let hoverBoardJ = -1;
  let hoverBoardBlock = -1;

  if (draggedWeight) {
    let bestDist = 40;
    for (let i = 0; i < board.width; i++) {
      for (let j = 0; j < board.height; j++) {
        let pos = holeWorldPos(i, j);
        let d = dist(mouseX, mouseY, pos.x, pos.y);
        if (d < bestDist) {
          bestDist = d;
          hoverHole = { i, j };
        }
      }
    }
  } else {
    // Find closest floor weight
    let bestFloorDist = 20;
    for (let k = floorWeights.length - 1; k >= 0; k--) {
      let d = dist(mouseX, mouseY, floorWeights[k].x, floorWeights[k].y);
      if (d < bestFloorDist) {
        bestFloorDist = d;
        hoverFloorIdx = k;
      }
    }
    // Find the topmost weight within range across all stacks.
    // For each stack, scan bottom-up: every in-range weight overwrites the
    // candidate, so after the loop hoverBoardBlock is the topmost (smallest
    // blockCount) weight that was within range — meaning all weights from
    // that index downward will be highlighted and picked up.
    let bestBoardDist = distToBoard;//24;
    for (let i = 0; i < board.width; i++) {
      for (let j = 0; j < board.height; j++) {
        if (board.holes[i][j] > 0) {
          let pos = holeWorldPos(i, j);
          for (let blockCount = board.holes[i][j] - 1; blockCount >= 0; blockCount--) {
            let wx = pos.x;
            let wy = pos.y + blockCount * 7 * cos(board.angle);
            let d = dist(mouseX, mouseY, wx, wy);
            if (d < bestBoardDist) {
              hoverBoardI = i;
              hoverBoardJ = j;
              hoverBoardBlock = blockCount;
              // Don't tighten bestBoardDist — keep scanning upward so the
              // topmost in-range weight in this stack wins
            }
          }
        }
      }
    }
  }

  // --- Draw floor weights ---
  for (let k = 0; k < floorWeights.length; k++) {
    if (draggedWeight && draggedWeight.fromFloor && draggedWeight.floorIndex === k) continue;
    let highlight = (!draggedWeight && hoverFloorIdx === k);
    drawWeightAt(floorWeights[k].x, floorWeights[k].y, 0, highlight ? color(255, 200, 60) : color(100), false);
  }

  // --- Drop-target highlight + ghost preview while dragging ---
  if (draggedWeight && hoverHole !== null) {
    let pos = holeWorldPos(hoverHole.i, hoverHole.j);
    push();
    noFill();
    stroke(255, 180, 0);
    strokeWeight(2.5);
    ellipseMode(CENTER);
    ellipse(pos.x, pos.y, 38, 38);
    pop();
    // Ghost preview of where weights will land
    let existingCount = board.holes[hoverHole.i][hoverHole.j];
    for (let s = 0; s < draggedWeight.count; s++) {
      let stackIdx = existingCount + s;
      let gx = pos.x ;//;+ stackIdx;
      let gy = pos.y + stackIdx * 7 * cos(board.angle);
      drawWeightAt(gx, gy, 0, color(255, 200, 60), true);
    }
  }

  // --- Dragged weight(s) following mouse ---
  if (draggedWeight) {
    for (let s = 0; s < draggedWeight.count; s++) {
      drawWeightAt(mouseX, mouseY + s * 7, 0, color(200, 100, 50), false);
    }
  }

  // --- Board weight hover highlight (clicked weight + all below) ---
  if (!draggedWeight && hoverBoardI >= 0) {
    let pos = holeWorldPos(hoverBoardI, hoverBoardJ);
    let total = board.holes[hoverBoardI][hoverBoardJ];
    for (let blockCount = hoverBoardBlock; blockCount < total; blockCount++) {
      let wx = pos.x;
      let wy = pos.y + blockCount * 7 * cos(board.angle);
      drawWeightAt(wx, wy, 0, color(255, 200, 60), false);
    }
  }
}

// Draw a single weight at world position (x, y).
// angle: rotation of the weight bar (0 = horizontal).
// fillColor: p5 color object.
// ghostMode: draw semi-transparent.
function drawWeightAt(x, y, angle, fillColor, ghostMode) {
  push();
  translate(x, y);
  if (angle) rotate(angle);
  stroke(ghostMode ? color(0, 0, 0, 140) : color(0));
  strokeWeight(1.5);
  fill(ghostMode ? color(red(fillColor), green(fillColor), blue(fillColor), 140) : fillColor);
  rectMode(CENTER);
  rect(0, 0, 20, 4);
  line(0, -2, 0, -8);
  pop();
}

// World position of board hole (i, j)
function holeWorldPos(i, j) {
  let localX = board.spacing * (-board.width / 2 + i + 0.5);
  let localY = board.spacing * (-board.height / 2 + j + 0.5) + board.spacing * 1.5;
  let cosA = cos(board.angle);
  let sinA = sin(board.angle);
  return {
    x: pivot.x + localX * cosA - localY * sinA,
    y: pivot.y + localX * sinA + localY * cosA
  };
}

function mousePressed() {
  // Check board holes — same logic as hover: scan bottom-up so the topmost
  // in-range weight is what gets picked up (matching the highlight)
  for (let i = 0; i < board.width; i++) {
    for (let j = 0; j < board.height; j++) {
      if (board.holes[i][j] > 0) {
        let pos = holeWorldPos(i, j);
        let hitBlock = -1;
        for (let blockCount = board.holes[i][j] - 1; blockCount >= 0; blockCount--) {
          let wx = pos.x;
          let wy = pos.y + blockCount * 7 * cos(board.angle);
          if (dist(mouseX, mouseY, wx, wy) < distToBoard) {
            hitBlock = blockCount; // keep overwriting — topmost in-range wins
          }
        }
        if (hitBlock >= 0) {
          let pickedUp = board.holes[i][j] - hitBlock;
          board.holes[i][j] = hitBlock;
          draggedWeight = { fromFloor: false, boardI: i, boardJ: j, count: pickedUp };
          return;
        }
      }
    }
  }

  // Check floor weights
  for (let k = floorWeights.length - 1; k >= 0; k--) {
    if (dist(mouseX, mouseY, floorWeights[k].x, floorWeights[k].y) < 16) {
      draggedWeight = { fromFloor: true, floorIndex: k, count: 1 };
      return;
    }
  }
}

function mouseReleased() {
  if (!draggedWeight) return;

  // Try to drop onto a board hole
  for (let i = 0; i < board.width; i++) {
    for (let j = 0; j < board.height; j++) {
      let pos = holeWorldPos(i, j);
      if (dist(mouseX, mouseY, pos.x, pos.y) < 40) {
        board.holes[i][j] += draggedWeight.count;
        if (draggedWeight.fromFloor) {
          floorWeights.splice(draggedWeight.floorIndex, 1);
        }
        draggedWeight = null;
        return;
      }
    }
  }

  // Dropped onto the floor area
  if (mouseY > height - 80) {
    if (draggedWeight.fromFloor) {
      floorWeights[draggedWeight.floorIndex].x = mouseX;
      floorWeights[draggedWeight.floorIndex].y = FLOOR_Y;
    } else {
      for (let s = 0; s < draggedWeight.count; s++) {
        floorWeights.push({ x: mouseX + s * (FLOOR_WEIGHT_SPACING * 0.5), y: FLOOR_Y });
      }
    }
    draggedWeight = null;
    return;
  }

  // Released nowhere useful — return to origin
  if (!draggedWeight.fromFloor) {
    board.holes[draggedWeight.boardI][draggedWeight.boardJ] += draggedWeight.count;
  }
  draggedWeight = null;
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

    // Draw board body (tilts with board angle)
    push();
    translate(pivot.x, pivot.y);
    rotate(this.angle);
    translate(0, board.spacing * 1.5);
    fill(250);
    stroke(0);
    strokeWeight(1);
    rect(0, 0, this.width * (this.spacing + 3), this.height * (this.spacing + 3));
    fill(0);
    noStroke();
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

    // Draw weights — positioned in world space, NOT rotated with the board
    // Each weight hangs straight down regardless of board tilt
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        let pos = holeWorldPos(i, j);
        for (let blockCount = 0; blockCount < this.holes[i][j]; blockCount++) {
          // Stack downward in world space (perpendicular-to-board direction)
          let wx = pos.x; 
          let wy = pos.y + blockCount * 7 * cos(this.angle);
          drawWeightAt(wx, wy, 0, color(100), false);
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
          ((this.width - 1) / 2 - i) * this.holes[i][j] * Math.sin(PI / 2 - this.angle) +
          (this.height / 6 - j) * this.holes[i][j] * Math.cos(PI / 2 - this.angle) -
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

function reset() {
  board.holes = [];
  for (let i = 0; i < board.width; i++) {
    board.holes.push([]);
    for (let j = 0; j < board.height; j++) {
      board.holes[i].push(0);
    }
  }
  board.angle = 0;
  board.omega = 0;

  floorWeights = [];
  for (let k = 0; k < NUM_FLOOR_WEIGHTS; k++) {
    floorWeights.push({ x: FLOOR_WEIGHT_START_X + k * FLOOR_WEIGHT_SPACING, y: FLOOR_Y });
  }
  draggedWeight = null;
}
