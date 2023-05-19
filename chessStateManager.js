
const initChessPiecePositions = [
    [0, 0, 'white', 'rook'],
    [0, 1, 'white', 'knight'],
    [0, 2, 'white', 'bishop'],
    [0, 3, 'white', 'queen'],
    [0, 4, 'white', 'king'],
    [0, 5, 'white', 'bishop'],
    [0, 6, 'white', 'knight'],
    [0, 7, 'white', 'rook'],
    [1, 0, 'white', 'pawn'],
    [1, 1, 'white', 'pawn'],
    [1, 2, 'white', 'pawn'],
    [1, 3, 'white', 'pawn'],
    [1, 4, 'white', 'pawn'],
    [1, 5, 'white', 'pawn'],
    [1, 6, 'white', 'pawn'],
    [1, 7, 'white', 'pawn'],
    // ... black pieces ...
    [7, 0, 'black', 'rook'],
    [7, 1, 'black', 'knight'],
    [7, 2, 'black', 'bishop'],
    [7, 3, 'black', 'queen'],
    [7, 4, 'black', 'king'],
    [7, 5, 'black', 'bishop'],
    [7, 6, 'black', 'knight'],
    [7, 7, 'black', 'rook'],
    [6, 0, 'black', 'pawn'],
    [6, 1, 'black', 'pawn'],
    [6, 2, 'black', 'pawn'],
    [6, 3, 'black', 'pawn'],
    [6, 4, 'black', 'pawn'],
    [6, 5, 'black', 'pawn'],
    [6, 6, 'black', 'pawn'],
    [6, 7, 'black', 'pawn'],
  ];

var ChessStateManager = function() {
    // State variables:
    var chessPiecePositions = initChessPiecePositions.map(x => x);
    var chessPieceLookup = Array.from(Array(8), () => Array(8).fill(''));
    chessPiecePositions.forEach(([row, col, color, piece]) => {
        chessPieceLookup[row][col] = [color, piece];
    });
    var playerTurn = 'white';

    
    function getChessPiecePositionsFromLookup(chessPieceLookup) {
        currentPieces = [];
        chessPieceLookup.forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                if (piece && Array.isArray(piece)) {
                    currentPieces.push([rowIndex, colIndex, ...piece]);
                }
            });
        });
        return currentPieces;
    }


    function initialize() {
        return chessPieceLookup;
    }


    function isValidMove(startRow, startCol, endRow, endCol) {
        if (!isOnBoard(startRow, startCol)) return false;
        if (!isOnBoard(endRow, endCol)) return false;
        if (!positionHasPiece(startRow, startCol)) return false;
        let [color, piece] = chessPieceLookup[startRow][startCol];
        if (color !== playerTurn) return false;
        if (positionHasPiece(endRow, endCol)) {
            let [endColor, endPiece] = chessPieceLookup[endRow][endCol];
            if (endColor === color) return false;
        }
        let validMoves = getValidMoves(startRow, startCol);
        if (validMoves.filter(([r, c]) => r === endRow && c === endCol).length == 0) return false;
        //if (movingPiecePutsKingInCheck(startRow, startCol, endRow, endCol)) return false;
        return true;
    }

    function isKingInCheck(chessPieceLookup) {
        // foreach opponent piece, check if it can move to king's position, if so, return true
        let piecePositions = getChessPiecePositionsFromLookup(chessPieceLookup)
        let [kingRow, kingCol, kingColor, kingPiece] = piecePositions.filter(([row, col, color, piece]) => color === playerTurn && piece === 'king')[0];
        getChessPiecePositionsFromLookup(chessPieceLookup)
            .filter(([row, col, color, piece]) => color !== playerTurn)
            .filter(([row, col, color, piece]) => getValidMoves(row, col).filter(([r, c]) => r === kingRow && c === kingCol) > 0)
            .length > 0;
    }

    function movingPiecePutsKingInCheck(startRow, startCol, endRow, endCol) {
        // TODO: Implement this
        nextStepChessPieceLookup = JSON.parse(JSON.stringify(chessPieceLookup));
        movePieceStateless(nextStepChessPieceLookup, startRow, startCol, endRow, endCol);
        return isKingInCheck(nextStepChessPieceLookup);
    }

    function movePiece(startRow, startCol, endRow, endCol) {
        console.log(`Moving piece from (${startRow}, ${startCol}) to (${endRow}, ${endCol})`);
        if (!isValidMove(startRow, startCol, endRow, endCol)) {
            console.log(`Invalid move (${startRow}, ${startCol}) => (${endRow}, ${endCol})`);
            throw new Error(`Invalid move (${startRow}, ${startCol}) => (${endRow}, ${endCol})`);
        }
        return movePieceStateless(chessPieceLookup, startRow, startCol, endRow, endCol); 
    }

    function movePieceStateless(currentState, startRow, startCol, endRow, endCol) {
        var [color, piece] = currentState[startRow][startCol];
        currentState[endRow][endCol] = currentState[startRow][startCol];
        currentState[startRow][startCol] = '';
        if ((endRow === 0 || endRow === 7) && piece === 'pawn') {
            currentState[endRow][endCol][1] = 'queen';
        }
        playerTurn = playerTurn === 'white' ? 'black' : 'white';
        return getChessPiecePositionsFromLookup(currentState);
    }


    function positionHasPiece(row, col) {
        return chessPieceLookup[row][col] !== '';
    }

    function isOnBoard(row, col) {
        return row >= 0 && col >= 0 && row <= 7 && col <= 7;
    }

    function getRookMoves(row, col) {
        validMoves = [];

        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([rowDir, colDir]) => {
            let currRow = row + rowDir;
            let currCol = col + colDir;
            while (currRow >= 0 && currCol >= 0 && currRow <= 7 && currCol <= 7) {
                if (positionHasPiece(currRow, currCol)) {
                    if (chessPieceLookup[currRow][currCol][0] !== chessPieceLookup[row][col][0]) {
                        validMoves.push([currRow, currCol]);
                    }
                    break;
                }
                validMoves.push([currRow, currCol]);

                currRow += rowDir;
                currCol += colDir;
            }
        });

        return validMoves;
    }

    function getBishopMoves(row, col) {
        let validMoves = [];

        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([rowDir, colDir]) => {
            let currRow = row + rowDir;
            let currCol = col + colDir;
            while (currRow >= 0 && currCol >= 0 && currRow <= 7 && currCol <= 7) {
                if (positionHasPiece(currRow, currCol)) {
                    if (chessPieceLookup[currRow][currCol][0] !== chessPieceLookup[row][col][0]) {
                        validMoves.push([currRow, currCol]);
                    }
                    break;
                }
                validMoves.push([currRow, currCol]);

                currRow += rowDir;
                currCol += colDir;
            }
        });

        return validMoves;
    }

    function getQueenMoves(row, col) {
        return getRookMoves(row, col).concat(getBishopMoves(row, col));
    }

    function getValidMoves(row, col) {
        let [color, piece] = chessPieceLookup[row][col];
        validMoves = [];
        // 'rook', 'knight', 'bishop', 'queen', 'king', 'pawn';
        if (piece === 'rook') {
           validMoves = getRookMoves(row, col); 
        } else if (piece === 'knight') {
            [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]].forEach(([rowDir, colDir]) => {
                let currRow = row + rowDir;
                let currCol = col + colDir;
                if (isOnBoard(currRow, currCol)) {
                    if (!positionHasPiece(currRow, currCol) || chessPieceLookup[currRow][currCol][0] !== color) {
                        validMoves.push([currRow, currCol]);
                    }
                }

            });
        } else if (piece === 'bishop') {
            validMoves = getBishopMoves(row, col); 
        } else if (piece === 'queen') {
            validMoves = getQueenMoves(row, col);
        } else if (piece === 'king') {
            [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([rowDir, colDir]) => {
                let currRow = row + rowDir;
                let currCol = col + colDir;
                if (currRow >= 0 && currCol >= 0 && currRow <= 7 && currCol <= 7) {
                    if (!positionHasPiece(currRow, currCol) || chessPieceLookup[currRow][currCol][0] !== color) {
                        validMoves.push([currRow, currCol]);
                    }
                }
            });
        } else if (piece === 'pawn') {
            rowDir = (color === 'white') ? 1 : -1;
            let currRow = row + rowDir;
            if (!positionHasPiece(currRow, col)) {
                validMoves.push([currRow, col]);
                if ((color == 'white' && row == 1) || (color == 'black' && row == 6)) {
                    if (!positionHasPiece(row + (rowDir*2), col)) {
                        validMoves.push([row + (rowDir*2), col]);
                    }
                }
            }

            // capture logic
            currRow = row + rowDir;
            [-1, 1].forEach((colDir) => {
                let currCol = col + colDir;
                if (isOnBoard(currRow, currCol) && positionHasPiece(currRow, currCol)) {
                    if (chessPieceLookup[currRow][currCol][0] !== color) {
                        validMoves.push([currRow, currCol]);
                    }
                }
            });
        }

        return validMoves.filter(([row, col]) => (
            row >= 0 && row < 8 && col >= 0 && col < 8 && 
            (!positionHasPiece(row, col) || chessPieceLookup[row][col][0] !== color)));
    }

    function getChessPiecePositions() {
        return getChessPiecePositionsFromLookup(chessPieceLookup);
    }

    function getChessPieceLookup() {
        return chessPieceLookup;
    }

    function getPlayerTurn() {
        return playerTurn;
    }

    return {
        initialize: initialize,
        movePiece: movePiece,
        getValidMoves: getValidMoves,
        isValidMove: isValidMove,
        getChessPiecePositions: getChessPiecePositions,
        getChessPieceLookup: getChessPieceLookup,
        getChessPiecePositionsFromLookup: getChessPiecePositionsFromLookup,
        getPlayerTurn: getPlayerTurn,
    };
};

/*
(() => {
  var boardManager = BoardManager();
  var boardState = boardManager.initialize();
  var updatedBoardState = boardManager.movePiece(1, 0, 3, 0);
  //boardManager.drawChessboardState(updatedBoardState);
  boardManager.drawChessboard();
  console.log(boardManager.getChessPieceLookup());
  console.log(updatedBoardState);

})();
*/