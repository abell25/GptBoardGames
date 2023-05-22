
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

var ChessBoardState = function(chessPieceLookupState=null, playerTurnState='white') {
    // State variables:
    var playerTurn = playerTurnState;
    var chessPieceLookup = chessPieceLookupState;
    // if null, initialize chessPieceLookup with starting board positions
    if (chessPieceLookup === null) {
        chessPieceLookup = Array.from(Array(8), () => Array(8).fill(''));
        initChessPiecePositions.forEach(([row, col, color, piece]) => {
            chessPieceLookup[row][col] = [color, piece];
        });
    }
    
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

    function getChessPieceLookup() { return chessPieceLookup; }
    function getPlayerTurn() { return playerTurn; }
    function setPlayerTurn(newPlayerTurn) { playerTurn = newPlayerTurn; }
    function changePlayerTurn() { playerTurn = playerTurn === 'white' ? 'black' : 'white'; }
    function getChessPiecePositions() { return getChessPiecePositionsFromLookup(chessPieceLookup); }
    function positionHasPiece(row, col) { return chessPieceLookup[row][col] !== ''; }
    function deepCopyBoardState() {
        let chessPieceLookupCopy = JSON.parse(JSON.stringify(chessPieceLookup));
        let playerTurnCopy = playerTurn;
        return ChessBoardState(chessPieceLookupCopy, playerTurnCopy);
    }
    return {
        getChessPieceLookup: getChessPieceLookup,
        getChessPiecePositions: getChessPiecePositions, 
        getPlayerTurn: getPlayerTurn,
        setPlayerTurn: setPlayerTurn,
        changePlayerTurn: changePlayerTurn,
        positionHasPiece: positionHasPiece,
        deepCopyBoardState: deepCopyBoardState,
    }
}

var ChessStateManager = function() {
    /*
    // State variables:
    var chessPiecePositions = initChessPiecePositions.map(x => x);
    var chessPieceLookup = Array.from(Array(8), () => Array(8).fill(''));
    chessPiecePositions.forEach(([row, col, color, piece]) => {
        chessPieceLookup[row][col] = [color, piece];
    });
    var playerTurn = 'white';
    */
   var chessBoardState = ChessBoardState();

    function initialize() {
        return chessBoardState;
    }


    function isValidMove(startRow, startCol, endRow, endCol) {
        return isValidMoveStateless(chessBoardState, startRow, startCol, endRow, endCol);
    }

    function isValidMoveStateless(currentChessBoardState, startRow, startCol, endRow, endCol) {
        if (!isOnBoard(startRow, startCol)) return false;
        if (!isOnBoard(endRow, endCol)) return false;
        if (!currentChessBoardState.positionHasPiece(startRow, startCol)) return false;
        let chessPieceLookup = currentChessBoardState.getChessPieceLookup();
        let [color, piece] = chessPieceLookup[startRow][startCol];
        let playerTurn = currentChessBoardState.getPlayerTurn();
        if (color !== playerTurn) return false;
        if (currentChessBoardState.positionHasPiece(endRow, endCol)) {
            let [endColor, endPiece] = chessPieceLookup[endRow][endCol];
            if (endColor === color) return false;
        }
        let pieceMoves = getMovesForPiece(startRow, startCol);
        if (pieceMoves.filter(([r, c]) => r === endRow && c === endCol).length == 0) { return false; }
        // TODO: don't allow moves that put king in check
        if (movingPiecePutsKingInCheck(currentChessBoardState, startRow, startCol, endRow, endCol)) { return false; }
        return true;
    }

    function getValidMoves(row, col) {
        let pieceMoves = getMovesForPiece(row, col);
        let validMoves = pieceMoves.filter(([r, c]) => isValidMove(row, col, r, c));
        return validMoves;
    }

    function getAllValidMoves() {
        let piecePositions = chessBoardState.getChessPiecePositions();
        let allValidMoves = piecePositions.flatMap(([row, col, color, piece]) => {
            let validMoves = getValidMoves(row, col);
            return validMoves.map(([r, c]) => [row, col, r, c]);
        });
        return allValidMoves;
    }

    function getAllValidMovesWithPieceNames() {
        let piecePositions = chessBoardState.getChessPiecePositions();
        let allValidMoves = piecePositions.flatMap(([row, col, color, piece]) => {
            let validMoves = getValidMoves(row, col);
            return validMoves.map(([r, c]) => [row, col, r, c, color, piece]);
        });
        return allValidMoves;
    }

    function isKingInCheck() {
        return isKingInCheckStateless(chessBoardState);
    }

    function isKingInCheckStateless(currentChessBoardState) {
        // foreach opponent piece, check if it can move to king's position, if so, return true
        let piecePositions = currentChessBoardState.getChessPiecePositions()
        let playerTurn = currentChessBoardState.getPlayerTurn();
        // get current player's king position
        let [kingRow, kingCol, kingColor, kingPiece] = piecePositions.filter(([row, col, color, piece]) => color === playerTurn && piece === 'king')[0];
        // get opponent pieces that can move to king's position
        let opponentPieces = piecePositions.filter(([row, col, color, piece]) => color !== playerTurn);
        let opponentPieceMoves = opponentPieces.map(([row, col, color, piece]) => [piece, getMovesForPieceStateless(currentChessBoardState, row, col)]);
        let opponentPieceMovesToKing = opponentPieceMoves.filter(([piece, moves]) => moves.filter(([r, c]) => r === kingRow && c === kingCol).length > 0);
        let inCheck = opponentPieceMovesToKing.length > 0;
        if (inCheck) {
            console.log(`King is in check!!`);
        }
        return inCheck;
    }

    function movingPiecePutsKingInCheck(currentChessBoardState, startRow, startCol, endRow, endCol) {
        let nextStepChessState = currentChessBoardState.deepCopyBoardState();
        movePieceStateless(nextStepChessState, startRow, startCol, endRow, endCol);
        nextStepChessState.changePlayerTurn(); // move above changes the turn but we want to analyze the current player's king
        let kingInCheck = isKingInCheckStateless(nextStepChessState);
        if (kingInCheck) {
            console.log(`ZZZZ Checking if moving piece from (${startRow}, ${startCol}) to (${endRow}, ${endCol}) puts king in check`);
        }
        return kingInCheck;
    }

    function isCheckmate() {
        return getAllValidMoves().length === 0;
    }

    function movePiece(startRow, startCol, endRow, endCol) {
        console.log(`Moving piece from (${startRow}, ${startCol}) to (${endRow}, ${endCol})`);
        return movePieceStateless(chessBoardState, startRow, startCol, endRow, endCol); 
    }

    function movePieceStateless(currentState, startRow, startCol, endRow, endCol) {
        let chessPieceLookup = currentState.getChessPieceLookup();
        var [color, piece] = chessPieceLookup[startRow][startCol];
        chessPieceLookup[endRow][endCol] = chessPieceLookup[startRow][startCol];
        chessPieceLookup[startRow][startCol] = '';
        if ((endRow === 0 || endRow === 7) && piece === 'pawn') {
            chessPieceLookup[endRow][endCol][1] = 'queen';
        }
        currentState.changePlayerTurn();
        return currentState;
    }


    function isOnBoard(row, col) {
        return row >= 0 && col >= 0 && row <= 7 && col <= 7;
    }

    function getRookMoves(currentState, row, col) {
        validMoves = [];
        let chessPieceLookup = currentState.getChessPieceLookup();
        let [color, _] = chessPieceLookup[row][col];
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([rowDir, colDir]) => {
            let currRow = row + rowDir;
            let currCol = col + colDir;
            while (currRow >= 0 && currCol >= 0 && currRow <= 7 && currCol <= 7) {
                if (currentState.positionHasPiece(currRow, currCol)) {
                    if (chessPieceLookup[currRow][currCol][0] !== color) {
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

    function getBishopMoves(currentState, row, col) {
        let validMoves = [];
        let chessPieceLookup = currentState.getChessPieceLookup();
        let [color, _] = chessPieceLookup[row][col];
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([rowDir, colDir]) => {
            let currRow = row + rowDir;
            let currCol = col + colDir;
            while (currRow >= 0 && currCol >= 0 && currRow <= 7 && currCol <= 7) {
                if (currentState.positionHasPiece(currRow, currCol)) {
                    if (chessPieceLookup[currRow][currCol][0] !== color) {
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

    function getQueenMoves(currentState, row, col) {
        return getRookMoves(currentState, row, col).concat(getBishopMoves(currentState, row, col));
    }

    function getKingMoves(currentState, row, col) {
        validMoves = [];
        let chessPieceLookup = currentState.getChessPieceLookup();
        let [color, _] = chessPieceLookup[row][col];
        [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([rowDir, colDir]) => {
            let currRow = row + rowDir;
            let currCol = col + colDir;
            if (currRow >= 0 && currCol >= 0 && currRow <= 7 && currCol <= 7) {
                if (!currentState.positionHasPiece(currRow, currCol) || chessPieceLookup[currRow][currCol][0] !== color) {
                    validMoves.push([currRow, currCol]);
                }
            }
        });
        return validMoves;
    }

    function getPawnMoves(currentState, row, col) {
        validMoves = [];
        let chessPieceLookup = currentState.getChessPieceLookup();
        let [color, _] = chessPieceLookup[row][col];

        rowDir = (color === 'white') ? 1 : -1;
        let currRow = row + rowDir;
        if (!currentState.positionHasPiece(currRow, col)) {
            validMoves.push([currRow, col]);
            if ((color == 'white' && row == 1) || (color == 'black' && row == 6)) {
                if (!currentState.positionHasPiece(row + (rowDir*2), col)) {
                    validMoves.push([row + (rowDir*2), col]);
                }
            }
        }

        // capture logic
        currRow = row + rowDir;
        [-1, 1].forEach((colDir) => {
            let currCol = col + colDir;
            if (isOnBoard(currRow, currCol) && currentState.positionHasPiece(currRow, currCol)) {
                if (chessPieceLookup[currRow][currCol][0] !== color) {
                    validMoves.push([currRow, currCol]);
                }
            }
        });
       
        return validMoves;
    }

    function getKnightMoves(currentState, row, col) {
        validMoves = [];
        let chessPieceLookup = currentState.getChessPieceLookup();
        let [color, _] = chessPieceLookup[row][col];
        [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]].forEach(([rowDir, colDir]) => {
            let currRow = row + rowDir;
            let currCol = col + colDir;
            if (isOnBoard(currRow, currCol)) {
                if (!currentState.positionHasPiece(currRow, currCol) || chessPieceLookup[currRow][currCol][0] !== color) {
                    validMoves.push([currRow, currCol]);
                }
            }
        });
        return validMoves;
    }

    function getMovesForPiece(row, col) {
        return getMovesForPieceStateless(chessBoardState, row, col);
    }
    function getMovesForPieceStateless(currentState, row, col) {
        let chessPieceLookup = currentState.getChessPieceLookup();
        let [color, piece] = chessPieceLookup[row][col];
        validMoves = [];
        pieceMovesFunc = {
            'rook': getRookMoves,
            'knight': getKnightMoves,
            'bishop': getBishopMoves,
            'queen': getQueenMoves,
            'king': getKingMoves,
            'pawn': getPawnMoves
        }
        validMoves = pieceMovesFunc[piece](currentState, row, col);
        return validMoves;
    }

    function getChessBoardState() {
        return chessBoardState;
    }

    function getChessPiecePositions() {
        return chessBoardState.getChessPiecePositions();
    }

    function getChessPieceLookup() {
        return chessBoardState.getChessPieceLookup();
    }

    function getPlayerTurn() {
        return chessBoardState.getPlayerTurn();
    }

    return {
        initialize: initialize,
        movePiece: movePiece,
        getValidMoves: getValidMoves,
        getMovesForPiece: getMovesForPiece,
        isValidMove: isValidMove,
        getChessBoardState: getChessBoardState,
        getChessPiecePositions: getChessPiecePositions,
        getChessPieceLookup: getChessPieceLookup,
        getPlayerTurn: getPlayerTurn,
        isKingInCheck: isKingInCheck,
        getAllValidMoves: getAllValidMoves,
        getAllValidMovesWithPieceNames: getAllValidMovesWithPieceNames,
        isCheckmate: isCheckmate,
    };
};
