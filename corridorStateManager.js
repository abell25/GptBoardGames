const TWO_PLAYER_PAWN_POSITIONS = [[0, 4], [8, 4]];
const FOUR_PLAYER_PAWN_POSITIONS = [[0, 4], [4, 8], [8, 4], [4, 0]];
const PLAYER_PAWN_POSITIONS = {
    2: [[0, 4], [8, 4]],
    4: [[0, 4], [4, 8], [8, 4], [4, 0]]
}

var CorridorState = function() {
    this.currentPlayer = 0;
    this.numPlayers = 2;
    this.playerNumPieces = [];
    this.playerPawn = [];
    this.playerPlacedPieces = [];
    this.placedPiecesLookup = {};
    this.placedPieces = [];
    for(let i = 0; i < this.numPlayers; i++) {
        this.playerNumPieces.push(10);
        let [row, col] = PLAYER_PAWN_POSITIONS[this.numPlayers][i];
        this.playerPawn.push([row, col]);
        this.playerPlacedPieces.push([]);
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

    function getValidMoves(row, col) {  
        //let [row, col] = state.playerPawn[state.currentPlayer];
        let validMoves = ([[row-1, col], [row+1, col], [row, col-1], [row, col+1]]
            .filter(([r, c]) => (r >= 0 && r <= 8 && c >= 0 && c <= 8))
            .filter(([nextRow, nextCol]) => isValidPawnMove(row, col, nextRow, nextCol))
        );
        return validMoves;
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

    return {
        initialize: initialize,
        getValidMoves: getValidMoves,
        getGameState: getGameState,
        setGameState: setGameState,
        movePawn: movePawn,
        placeWall: placeWall
    }
}