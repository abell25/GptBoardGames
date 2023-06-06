const PLAYER_PAWN_POSITIONS = {
    2: [[0, 4], [8, 4]],
    4: [[0, 4], [4, 8], [8, 4], [4, 0]]
}
const WINNING_POSITIONS = {
    2: [[8, -1], [0, -1]],
    4: [[8, -1], [-1, 8], [0, -1], [-1, 0]]
}

const PLAYER_COLORS = {
    2: ['black', 'white'],
    4: ['red', 'blue', 'green', 'yellow']
}

var CorridorState = function() {
    this.currentPlayer = 0;
    this.numPlayers = 2;
    this.playerNumPieces = [];
    this.playerPawn = [];
    this.playerPlacedPieces = [];
    this.placedPiecesLookup = {};
    this.placedPieces = [];
    this.playerColors = [];
    for(let i = 0; i < this.numPlayers; i++) {
        this.playerNumPieces.push(10);
        let [row, col] = PLAYER_PAWN_POSITIONS[this.numPlayers][i];
        this.playerPawn.push([row, col]);
        this.playerPlacedPieces.push([]);
        this.playerColors.push(PLAYER_COLORS[this.numPlayers][i]);
    }

    this.canPlaceWall = function(row, col, orientation) {
        if (this.playerNumPieces[this.currentPlayer] === 0) {
            return false;
        }
        if (this.placedPiecesLookup[[row, col, orientation]] !== undefined) {
            return false;
        }
        if (orientation === 'h') {
            if (this.placedPiecesLookup[[row, col-1, 'h']] !== undefined) {
                return false;
            }
            if (this.placedPiecesLookup[[row, col+1, 'h']] !== undefined) {
                return false;
            }
            if (this.placedPiecesLookup[[row-1, col+1, 'v']] !== undefined) {
                return false;
            }
        } else if (orientation === 'v') {
            if (this.placedPiecesLookup[[row-1, col, 'v']] !== undefined) {
                return false;
            }
            if (this.placedPiecesLookup[[row+1, col, 'v']] !== undefined) {
                return false;
            }
            if (this.placedPiecesLookup[[row+1, col-1, 'h']] !== undefined) {
                return false;
            }
        }
        return true;
    }

    this.placeWall = function(row, col, orientation) {
        this.playerNumPieces[this.currentPlayer]--;
        this.playerPlacedPieces[this.currentPlayer].push([row, col]);
        this.placedPiecesLookup[[row, col, orientation]] = this.currentPlayer;
        this.placedPieces.push([row, col, orientation]);
        changePlayerTurn();
    }

    this.movePawn = function(row, col) {
        this.playerPawn[this.currentPlayer][0] = row;
        this.playerPawn[this.currentPlayer][1] = col;
        this.changePlayerTurn();
    }

    this.changePlayerTurn = function() {
        this.currentPlayer = (this.currentPlayer + 1) % this.numPlayers;
    }

    this.getCurrentPlayerPawn = function() {
        return this.playerPawn[this.currentPlayer];
    }

    this.getWinner = function() {
        let winner;
        WINNING_POSITIONS[this.currentPlayer]
        for(let i=0; i<this.numPlayers; i++) {
            let [row, col] = this.playerPawn[i];
            let [winRow, winCol] = WINNING_POSITIONS[this.numPlayers][i];
            if (row === winRow || col === winCol) {
                winner = i;
            }
        }
        return winner;
    }

    this.isGameOver = function() {
        return this.getWinner() !== undefined;
    }

    return this;
}

var CorridorStateManager = function() {
    var currentState = CorridorState();
    function initialize() {

    }

    function isValidPawnMove(row, col, nextRow, nextCol) {
        let orientation = (nextRow === row) ? 'h' : 'v';
        // [1, 4] -> [1, 5] ('h'), check for [0, 5, 'v'], [1, 5, 'v']
        if (orientation === 'h') {
            let [minCol, maxCol] = [Math.min(col, nextCol), Math.max(col, nextCol)];
            if (this.placedPiecesLookup[[row, maxCol, 'v']] !== undefined) {
                return false;
            }
            if (this.placedPiecesLookup[[row-1, maxCol, 'v']] !== undefined) {
                return false;
            }
            return true;
        }
        // [0,4] --> [1, 4]  ('v'),  check for [1, 3, 'h'], [1, 4, 'h']
        if(orientation === 'v') {
            let [minRow, maxRow] = [Math.min(row, nextRow), Math.max(row, nextRow)];
            if (this.placedPiecesLookup[[maxRow, col, 'h']] !== undefined) {
                return false;
            }
            if (this.placedPiecesLookup[[maxRow, col-1, 'h']] !== undefined) {
                return false;
            }
            return true;
        }
    }

    function positionHasPawn(gameState, row, col) {
        return gameState.playerPawn.filter(([r, c]) => r === row && c === col).length > 0;
    }

    function getNeighborPositions(row, col) {
        return ([[row-1, col], [row+1, col], [row, col-1], [row, col+1]]
            .filter(([r, c]) => (r >= 0 && r <= 8 && c >= 0 && c <= 8))
            .filter(([nextRow, nextCol]) => isValidPawnMove(row, col, nextRow, nextCol)));
    }

    function getValidMoves(gameState, row, col) {  
        //let [row, col] = state.playerPawn[state.currentPlayer];
        let positions = getNeighborPositions(row, col); 
        let adjacentMoves = positions.filter(([r, c]) => !positionHasPawn(gameState, r, c));
        let positionsWithPawns = positions.filter(([r, c]) => positionHasPawn(gameState, r, c));

        let jumpMoves = (positionsWithPawns
            .map(([r, c]) => (getNeighborPositions(r, c)
                .filter(([r2, c2]) => !positionHasPawn(gameState, r2, c2))
                .filter(([r2, c2]) => isValidPawnMove(r, c, r2, c2))))
            .flatMap(x => x));
        return adjacentMoves.concat(jumpMoves);
    }

    function getGameState() {
        return currentState;
    }
    function setGameState(newState) {
        currentState = newState;
    }

    function movePawn(row, col) {
        return currentState.movePawn(row, col);
    }

    function placeWall(row, col, orientation) {
        return currentState.placeWall(row, col, orientation);
    }
    function canPlaceWall(row, col, orientation) {
        return currentState.canPlaceWall(row, col, orientation);
    }

    return {
        initialize: initialize,
        getValidMoves: getValidMoves,
        getGameState: getGameState,
        setGameState: setGameState,
        movePawn: movePawn,
        placeWall: placeWall,
        canPlaceWall: canPlaceWall
    }
}