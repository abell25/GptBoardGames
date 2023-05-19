
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

    
    function chessPiecePositionsFromLookup() {
        currentPieces = [];
        chessPieceLookup.forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                if (piece) {
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
        let validMoves = getValidMoves(startRow, startCol);
        return validMoves.filter(([r, c]) => r === endRow && c === endCol).length > 0;
    }

    function movePiece(startRow, startCol, endRow, endCol) {
        let validMoves = getValidMoves(startRow, startCol);
        if (validMoves.filter(([r, c]) => r === endRow && c === endCol).length == 0) {
            console.log(`Invalid move! valid moves: ${validMoves.map(x => `(${x.join(',')})`).join(', ')}`);
        }
        return movePieceStateless(chessPieceLookup, startRow, startCol, endRow, endCol);
    }

    function movePieceStateless(currentState, startRow, startCol, endRow, endCol) {
        console.log(`Moving piece from (${startRow}, ${startCol}) to (${endRow}, ${endCol})`);
        if (!currentState[startRow][startCol]) {
            console.log(`No piece at (${startRow}, ${startCol})`);
            throw new Error(`No piece at (${startRow}, ${startCol})`);
        }
        var [color, piece] = currentState[startRow][startCol];
        if (currentState[endRow][endCol]) {
            var [endColor, endPiece] = currentState[endRow][endCol];
            if (endColor === color) {
                console.log(`Cannot move ${color} ${piece} from (${startRow}, ${startCol}) to (${endRow}, ${endCol})`);
                throw new Error(`Cannot move ${color} ${piece} from (${startRow}, ${startCol}) to (${endRow}, ${endCol})`);
            }
        }
        currentState[endRow][endCol] = currentState[startRow][startCol];
        currentState[startRow][startCol] = '';
        var updatedPositions = chessPiecePositions
            .filter(([row, col, color, piece]) => {
                return !(row == endRow && col == endCol);
            })
            .map(([row, col, color, piece]) => {
                if(row === startRow && col === startCol) {
                    return [endRow, endCol, color, piece];
                } else {
                    return [row, col, color, piece];
                }
            });
        this.chessPiecePositions = updatedPositions;
        return updatedPositions;
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
        return getRookMoves.concat(getBishopMoves);
    }

    function getValidMoves(row, col) {
        let [color, piece] = chessPieceLookup[row][col];
        validMoves = [];
        // 'rook', 'knight', 'bishop', 'queen', 'king', 'pawn';
        if (piece === 'rook') {
           validMoves = getRookMoves(row, col); 
        } else if (piece === 'knight') {
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    if (Math.abs(i) + Math.abs(j) === 3) {
                        let currRow = row + i;
                        let currCol = col + j;
                        if (!positionHasPiece(currRow, currCol) || chessPieceLookup[currRow][currCol][0] !== color) {
                            validMoves.push([currRow, currCol]);
                        }
                    }
                }
            }
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
        return chessPiecePositionsFromLookup(chessPieceLookup);
    }

    function getChessPieceLookup() {
        return chessPieceLookup;
    }

    return {
        initialize: initialize,
        movePiece: movePiece,
        movePieceStateless: movePieceStateless,
        getValidMoves: getValidMoves,
        isValidMove: isValidMove,
        getChessPiecePositions: getChessPiecePositions,
        getChessPieceLookup: getChessPieceLookup,
        getChessPiecePositionsFromLookup: chessPiecePositionsFromLookup,
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