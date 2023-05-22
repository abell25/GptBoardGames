
const spriteWidth = 64; // Width of the image on the sprite sheet
const spriteHeight = 64; // Height of the image on the sprite sheet
const spriteWidthOffset = -5;
const spriteHeightOffset = -5;

const NUM_AI_RETRIES = 3;

  
const chessPieceSpriteLocations = {
    'white': {
        'queen': [0, 0],
        'king': [0, 1],
        'rook': [0, 2],
        'bishop': [0, 3],
        'knight': [0, 4],
        'pawn': [0, 5],
    },
    'black': {
        'queen': [1, 0],
        'king': [1, 1],
        'rook': [1, 2],
        'bishop': [1, 3],
        'knight': [1, 4],
        'pawn': [1, 5],
    },
  };

var BoardManager = function() {
    // State variables:
    var chessBoard = ChessStateManager();
    var selectedPiecePosition = null;
    var availableMoves = [];
    var chatGptManager = ChatGptManager();

    var canvas = document.getElementById('boardgameCanvas'),
        context = canvas.getContext('2d');
    const width = canvas.width,
        height = canvas.height,
        cellWidth = width / 8,
        cellHeight = height / 8,
        spriteSheet = new Image();
    
    spriteSheet.src = "assets/ChessPieces.png";
    spriteSheet.onload = function () {
        console.log('Image loaded !');
        drawChessboard();
    }
    
    function clearBoard() {
        context.clearRect(0, 0, width, height);
    }

    function drawChessBoardSquares() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                let x = i * cellWidth;
                let y = j * cellHeight;
                context.fillStyle = ((i + j) % 2 === 0) ? '#DDDDDD' : 'white';
                context.fillRect(i*cellWidth, j*cellHeight, cellWidth, cellHeight);
            }
        }

    }

    function drawHighlightedSquares(coords, fillColor='#FF7777') {
        coords.forEach(([row, col]) => {
            let x = col * cellWidth;
            let y = row * cellHeight;
            context.fillStyle = fillColor;
            context.fillRect(x, y, cellWidth, cellHeight);
        });
    }

    function drawChessPieces(currentState) {
        const chessPiecePositions = currentState.getChessPiecePositions();
        chessPiecePositions.forEach(([row, col, color, piece]) => {
            let [spriteRow, spriteCol] = chessPieceSpriteLocations[color][piece];
            const spriteX = spriteCol * spriteWidth;
            const spriteY = spriteRow * spriteHeight;
            const boardX = (col * cellWidth) + spriteWidthOffset;
            const boardY = (row * cellHeight) + spriteHeightOffset;
            //console.log(`Drawing ${color} ${piece} at (${boardX}, ${boardY}) from sprite sheet (${spriteX}, ${spriteY})`);
            context.drawImage(spriteSheet, spriteX, spriteY, spriteWidth, spriteHeight, boardX, boardY, spriteWidth, spriteHeight);
        });
    }

    function drawChessboard() {
        drawChessboardStateless(chessBoard.getChessBoardState(), selectedPiecePosition, availableMoves);
    }

    function drawChessboardStateless(currentState, selectedPiecePosition=null, availableMoves=[]) {
        clearBoard();
        drawChessBoardSquares();
        if (selectedPiecePosition) drawHighlightedSquares([selectedPiecePosition], '#77FF77'); 
        if (availableMoves.length > 0) drawHighlightedSquares(availableMoves, '#FF7777');
        drawChessPieces(currentState);
        showPlayerTurn(chessBoard.getPlayerTurn());
    }


    function initialize() {
        chessPieceLookup = chessBoard.initialize();
        chatGptManager.initialize();
        drawChessboard();
        
        canvas.addEventListener('click', canvasClickListener);

        return chessPieceLookup;
    }

    function mouseCoordsToBoardCoords(mouseX, mouseY) {
        const row = Math.floor(mouseY / cellHeight);
        const col = Math.floor(mouseX / cellWidth);
        return [row, col];
    }

    function userClickedOwnPiece(row, col) {
        let chessPieceLookup = chessBoard.getChessPieceLookup();
        return chessPieceLookup[row][col] && (chessPieceLookup[row][col][0] === chessBoard.getPlayerTurn());
    }

    function userClickedAvailableMove(row, col) {
        return selectedPiecePosition && availableMoves.filter(([r, c]) => r === row && c === col).length > 0;
    }

    function canvasClickListener(event) {
        if (!chessBoard.isCheckmate()) {
            console.log(`Clicked at (${event.offsetX}, ${event.offsetY})`);
            let [row, col] = mouseCoordsToBoardCoords(event.offsetX, event.offsetY);

            if (userClickedAvailableMove(row, col)) {
                movePiece(selectedPiecePosition[0], selectedPiecePosition[1], row, col);
                if (useChatGptAi()) {
                    getChatGptMove();
                }
            } else if(userClickedOwnPiece(row, col)) {
                showValidMovesForPiece(row, col);
            } else {
                clearSelection();
            }
        }
    }

    function useChatGptAi() {
        return document.getElementById('useChatGptAi').checked;
    }

    function getChatGptMove(failingMoves=[], numFailures = 0) {
        showLoadingIcon();
        return chatGptManager.getMoveAndResponse(chessBoard, failingMoves).then((moveAndResponse) => {
            let move = moveAndResponse['move'];
            if (chessBoard.isValidMove(move[0], move[1], move[2], move[3])) {
                let message = moveAndResponse['message'];
                movePiece(move[0], move[1], move[2], move[3]);
                showChatMessage(message);
                hideLoadingIcon();
            } else {
                console.log(`Chatgpt picked an Invalid move: ${move}`);
                failingMoves.push(move);
                if (numFailures < NUM_AI_RETRIES) {
                    console.log(`Retrying...`);
                    return getChatGptMove(failingMoves, numFailures+1);
                } else {
                    throw new Error(`Chatgpt picked an Invalid move ${NUM_AI_RETRIES} times in a row`);
                    showMessage(`Chatgpt picked an Invalid move ${NUM_AI_RETRIES} times in a row, EXITING....`);
                }
            }
        }).catch((error) => {
            console.log(`Chatgpt raised an error: ${error}`);
            if (numFailures < NUM_AI_RETRIES) {
                console.log(`Retrying...`);
                return getChatGptMove(failingMoves, numFailures+1);
            } else {
                throw new Error(`Chatgpt picked an Invalid move ${NUM_AI_RETRIES} times in a row`);
                showMessage(`Chatgpt picked an Invalid move ${NUM_AI_RETRIES} times in a row, EXITING....`);
            }

        });
    }

    function showMessage(message) {
        if (message) { console.log(`showMessage: ${message}`); }
        document.getElementById('messageArea').innerHTML = message;
    }
    function clearMessage() { showMessage(''); }
    function showPlayerTurn(playerTurn) {
        document.getElementById('playerTurn').innerHTML = playerTurn;
    }

    function showChatMessage(message) {
        let span = document.createElement('span');
        span.className = 'chatMessage';
        span.innerHTML = message;
        let chatLog = document.getElementById('chatLog');
        chatLog.appendChild(span);
        chatLog.scrollTo(0, chatLog.scrollHeight);
    }

    function showValidMovesForPiece(row, col) {
        let chessPieceLookup = chessBoard.getChessPieceLookup();
        console.log(`Clicked on ${chessPieceLookup[row][col][0]} ${chessPieceLookup[row][col][1]} at (${row}, ${col})`);
        selectedPiecePosition = [row, col];
        availableMoves = getValidMoves(row, col);
        console.log(`Valid moves: ${availableMoves}`);
        drawChessboard(); 
        clearMessage();
    }


    function movePiece(startRow, startCol, endRow, endCol) {
        console.log(`Moving piece from (${startRow}, ${startCol}) to (${endRow}, ${endCol})`);
        chessBoard.movePiece(startRow, startCol, endRow, endCol);
        selectedPiecePosition = null;
        availableMoves = [];
        drawChessboard();
        if (chessBoard.isKingInCheck()) {
            showMessage('King in check!');
        }
        if (chessBoard.isCheckmate()) {
            let winner = chessBoard.getPlayerTurn() === 'white' ? 'black' : 'white';
            showMessage(`Checkmate! ${winner} wins!`);
        }
    }

    function clearSelection() {
        selectedPiecePosition = null;
        availableMoves = [];
        drawChessboard();
        clearMessage();
    }

    function movePieceStateless(currentState, startRow, startCol, endRow, endCol) {
        return chessBoard.movePieceStateless(currentState, startRow, startCol, endRow, endCol);
    }

    function getValidMoves(startRow, startCol) {
        return chessBoard.getValidMoves(startRow, startCol);
    }

    function getChessPiecePositions() {
        return chessBoard.chessPiecePositionsFromLookup(chessBoard.getChessPieceLookup());
    }

    function getChessPieceLookup() {
        return chessBoard.getChessPieceLookup();
    }

    function getChessBoard() {
        return chessBoard;
    }

    function isValidMove(startRow, startCol, endRow, endCol) {
        return chessBoard.isValidMove(startRow, startCol, endRow, endCol);
    }

    function showLoadingIcon() {
        document.getElementById('loadingIcon').style.display = 'block';
    }

    function hideLoadingIcon() {
        document.getElementById('loadingIcon').style.display = 'none';
    }

    return {
        initialize: initialize,
        drawChessboard: drawChessboard,
        drawChessboardStateless: drawChessboardStateless,
        movePiece: movePiece,
        movePieceStateless: movePieceStateless,
        getValidMoves: getValidMoves,
        isValidMove: isValidMove,
        getChessPiecePositions: getChessPiecePositions,
        getChessPieceLookup: getChessPieceLookup,
        getChessBoard: getChessBoard,
    };
};
