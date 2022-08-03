function tetris(canvasId, linesId, scoreId, nextId, levelId, statsId) {
	const ctx = document.getElementById(canvasId).getContext('2d');
	ctx.canvas.style.width = '300px';
	ctx.canvas.style.height = '720px';

	const linesEl = document.getElementById(linesId);

	const scoreEl = document.getElementById(scoreId);

	const nextCtx = document.getElementById(nextId).getContext('2d');
	nextCtx.canvas.style.width = '100px';
	nextCtx.canvas.style.height = '100px';

	const levelEl = document.getElementById(levelId);

	const statsCtx = document.getElementById(statsId).getContext('2d');
	statsCtx.canvas.style.width = '150px';
	statsCtx.canvas.style.height = '400px';

	let idCounter = 0;
	let gameOver = false;
	const fps = 60.0988;
	const queue = [];
	const SIZE = 15;
	const ROWS = 24;
	const COLUMNS = 10;
	const startLevel = 0;
	const grid = new Array(ROWS)
		.fill(0)
		.map(() => new Array(COLUMNS).fill(0));
	const levelFrames = {
		0: 48,
		1: 43,
		2: 38,
		3: 33,
		4: 28,
		5: 23,
		6: 18,
		7: 13,
		8: 8,
		9: 6
	};

	function getSpeed() {
		const level = +levelEl.innerText;
		if (level < 10) {
			return levelFrames[level];
		} else if (level < 13) {
			return 5;
		} else if (level < 16) {
			return 4;
		} else if (level < 19) {
			return 3;
		} else if (level < 29) {
			return 2;
		} else {
			return 1;
		}
	}

	function makePiece(name, color, ...rotations) {
		return {
			name,
			color,
			rotations,
			bonk: 0,
			rotation: 0,
			y: -1,
			x: 3,
		};
	}

	//  0  1  2  3
	//  4  5  6  7
	//  8  9  10 11
	//  12 13 14 15
	const pieces = [
		makePiece('I', randomColor(), [4, 5, 6, 7], [2, 6, 10, 14], [8, 9, 10, 11], [1, 5, 9, 13]),
		makePiece('O', randomColor(), [1, 2, 5, 6]),
		makePiece('T', randomColor(), [1, 4, 5, 6], [1, 5, 6, 9], [4, 5, 6, 9], [1, 4, 5, 9]),
		makePiece('L', randomColor(), [1, 5, 9, 10], [6, 8, 9, 10], [0, 1, 5, 9], [4, 5, 6, 8]),
		makePiece('J', randomColor(), [1, 5, 9, 8], [4, 5, 6, 10], [1, 2, 5, 9], [0, 4, 5, 6]),
		makePiece('Z', randomColor(), [1, 2, 4, 5], [1, 5, 6, 10]),
		makePiece('S', randomColor(), [0, 1, 5, 6], [2, 5, 6, 9]),
	];

	function randomPiece() {
		return {
			id: ++idCounter,
			...pieces[Math.floor(Math.random() * pieces.length)]
		};
	}

	for (let i = 0; i < 5; i++) {
		queue.push(randomPiece());
	}

	function getPiece(name) {
		const p = pieces.find(piece => piece.name === name.toUpperCase());
		if (!p) {
			throw new Error(`Piece with name '${name}' not found`);
		}
		return {
			id: ++idCounter,
			...p
		};
	}

	function randomColor() {
		return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padEnd(6, '0');
	}

	function draw() {
		clear();
		let x = 0;
		let y = 0;
		for (const row of grid) {
			x = 0;
			for (let i = 0; i < row.length; i++) {
				if (row[i]) {
					ctx.fillStyle = row[i].color;
					ctx.fillRect(x, y, SIZE, SIZE);
				}
				x += SIZE;
			}
			y += SIZE;
		}
	}

	function getInfo(piece) {
		const points = piece.rotations[piece.rotation];
		let leftest = 4;
		let rightest = 0;
		let lowest = 0;
		let highest = 15;
		for (const point of points) {
			leftest = Math.min(point % 4, leftest);
			rightest = Math.max(point % 4, rightest);
			const row = Math.floor(point / 4);
			lowest = Math.max(row, lowest);
			highest = Math.min(row, highest);
		}
		return {
			leftest: leftest + piece.x,
			rightest: rightest + piece.x,
			lowest: lowest + piece.y,
			highest: highest + piece.y,
		};
	}

	function checkTetris() {
		const lines = [];
		for (let i = 0; i < grid.length; i++) {
			if (grid[i].filter(s => !!s).length === COLUMNS) {
				lines.push(i);
			}
		}

		const cleared = lines.length
		if (cleared > 0) {
			// Clear lines
			if (cleared === 4) {
				// omg tetris
			}
			for (const line of lines) {
				grid.splice(line, 1);
				grid.unshift(new Array(COLUMNS).fill(0));
			}
			draw();

			// Score
			const totalLines = +linesEl.innerText;
			linesEl.innerText = (totalLines + cleared).toString().padStart(3, '0');
			let score = +scoreEl.innerText;
			const level = +levelEl.innerText;
			switch (cleared) {
				case 1:
					score += 40 * (level || 1);
					break;
				case 2:
					score += 100 * (level || 1);
					break;
				case 3:
					score += 300 * (level || 1);
					break;
				case 4:
					score += 1200 * (level || 1);
					break;
			}
			scoreEl.innerText = score.toString().padStart(6, '0');

			// Level
			if (totalLines > startLevel * 10 + 10) {
				levelEl.innerText = (level + 1).toString().padStart(2, '0');
			}
		}
	}

	function gameOverScreen() {
		for (let i = 0; i < grid.length; i++) {
			grid[i] = grid[i].map(s => s && s.id ? {id: s.id, color: '#696969'} : s);
		}
		draw();
	}

	function drop(piece) {
		if (!piece.handle) {
			function control({code}) {
				const before = {...piece};
				let redraw = false;
				if (code === 'Space' || code === 'KeyW') {
					piece.rotation = (piece.rotation + 1) % piece.rotations.length;
					const {leftest, rightest} = getInfo(piece);
					if (leftest < 0) {
						piece.x += Math.abs(leftest);
					} else if (rightest >= COLUMNS) {
						piece.x += COLUMNS - rightest - 1;
					}
					const {lowest} = getInfo(piece);
					try {
						if (lowest >= ROWS) {
							piece = before;
						} else {
							move(piece, true);
							redraw = true;
						}
					} catch {
						piece = before;
					}
				} else if (code === 'ArrowRight' || code === 'KeyD') {
					const {rightest} = getInfo(piece);
					if (rightest !== COLUMNS - 1 && !collision(piece, 0, 1)) {
						piece.x++;
						redraw = true;
					}
				} else if (code === 'ArrowLeft' || code === 'KeyA') {
					const {leftest} = getInfo(piece);
					if (leftest !== 0 && !collision(piece, 0, -1)) {
						piece.x--;
						redraw = true;
					}
				} else if (code === 'ArrowDown' || code === 'KeyS') {
					const {lowest} = getInfo(piece);
					if (lowest + 1 < ROWS && !collision(piece, 1, 0)) {
						piece.y++;
						redraw = true;
					}
				}
				if (redraw) {
					move(piece);
					setInGrid(piece, 0);
				}
			}

			ctx.canvas.addEventListener('keydown', control);

			piece.handle = setInterval(() => {
				const {lowest} = getInfo(piece);
				if (lowest < ROWS && !piece.stop) {
					move(piece);
					if (collision(piece)) {
						if (piece.y < 0) {
							gameOver = true;
							piece.stop = true;
							return;
						} else {
							piece.bonk++;
						}
					} else {
						piece.bonk = 0;
					}
					if (lowest < ROWS - 1 && piece.bonk < 3) {
						setInGrid(piece, 0);
						if (piece.bonk === 0) {
							piece.y++;
						}
					} else {
						setInGrid(piece, 0);
						piece.stop = true;
						if (piece.bonk > 2) {
							ctx.canvas.removeEventListener('keydown', control);
						}
					}
				} else {
					ctx.canvas.removeEventListener('keydown', control);
					setInGrid(piece, piece.color);
					clearInterval(piece.handle);
					checkTetris();
					if (gameOver) {
						gameOverScreen();
					} else {
						next();
					}
				}
			}, 1000 / fps * getSpeed());
		}
	}

	function collision(piece, yOffset = 1, xOffset = 0) {
		const points = piece.rotations[piece.rotation];
		const real = [];
		for (let i = 0; i < points.length; i++) {
			const pt = points[i];
			const x = piece.x + pt % 4;
			const y = piece.y + Math.floor(pt / 4);
			real.push({x, y});
		}
		for (const {x, y} of real) {
			const ny = y + yOffset;
			const nx = x + xOffset;
			if (ny >= ROWS || nx >= COLUMNS || (ny >= 0 && !!grid[ny][nx] && grid[ny][nx].id !== piece.id)) {
				return true;
			}
		}
	}

	function move(piece, checkCollision) {
		setInGrid(piece, piece.color, checkCollision);
		if (!checkCollision) {
			draw();
		}
	}

	function setInGrid(piece, color, checkCollision) {
		const points = piece.rotations[piece.rotation];
		const data = color === 0 ? 0 : {color, id: piece.id};
		for (let i = 0; i < points.length; i++) {
			const pt = points[i];
			const x = piece.x + pt % 4;
			const y = piece.y + Math.floor(pt / 4);
			if (y >= 0 && y < ROWS) {
				if (checkCollision) {
					if (grid[y][x] && grid[y][x].id !== piece.id) {
						throw new Error(`Collided on x: ${x}, y: ${y}`);
					}
				} else {
					grid[y][x] = data;
				}
			}
		}
	}

	function drawNext() {
		nextCtx.clearRect(0, 0, nextCtx.canvas.width, nextCtx.canvas.height);
		const next = queue[0];
		nextCtx.fillStyle = next.color;

		const size = SIZE * 2;
		const points = next.rotations[0];
		for (let i = 0; i < points.length; i++) {
			const pt = points[i];
			const x = pt % 4 * size;
			const y = Math.floor(pt / 4) * size;
			nextCtx.fillRect(x, y, size, size);
		}
	}

	function next() {
		const rand = queue.shift();
		queue.push(randomPiece());
		drawNext();
		// const rand = getPiece('J');
		drop(rand);
	}

	next();

	function clear() {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}
}