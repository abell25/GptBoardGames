BOARD_TILE_COLOR = 'brown';
WALL_COLOR = 'black';
NUM_PIECES_PER_PLAYER = 10;

var BoardManager = function() {

    var canvas = document.getElementById('boardgameCanvas'),
        context = canvas.getContext('2d');
    const width = canvas.width,
        height = canvas.height,
        sideHeight = 50,
        sideWidth = 50,
        cellSpacing = 5,
        boardWidth = width - (2*sideWidth),
        boardHeight = height - (2*sideHeight),
        cellHeight = (boardHeight - (10*cellSpacing))/9,
        cellWidth = (boardWidth - (10*cellSpacing))/9,
        piecePadding = 4,
        corridorStateManager = CorridorStateManager();

    // for moving a pawn
    var selectedPiecePosition = null;
    var selectedWallPosition = null;
    var availableMoves = [];

    function clearBoard() {
        context.clearRect(0, 0, width, height);
    }

    function drawBoardSquares() {
        context.fillStyle = BOARD_TILE_COLOR;
        x_offset = sideWidth + cellSpacing;
        y_offset = sideHeight + cellSpacing;

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                let x = x_offset + i * (cellWidth + cellSpacing);
                let y = x_offset + j * (cellHeight + cellSpacing);
                console.log(`i=${i}, j=${j}, x=${x}, y=${y}, cellWidth=${cellWidth}, cellHeight=${cellHeight}`);
                context.fillRect(x, y, cellWidth, cellHeight);
            }
        }
        for (let i = 0; i < 9; i++) {
            let x = x_offset + i * (cellWidth + cellSpacing);
            // top row
            context.fillRect(x, 0, cellWidth, sideHeight);
            // bottom row
            context.fillRect(x, height-sideHeight, cellWidth, sideHeight);
            // left side
            let y = y_offset + i * (cellHeight + cellSpacing);
            context.fillRect(0, y, sideWidth, cellHeight);
            context.fillRect(width-sideWidth, y, sideWidth, cellHeight);
        }
    }

    function drawUnusedBoardPieces(player1Pieces, player2Pieces) {
        context.fillStyle = WALL_COLOR;
        let x_offset = sideWidth;
        let pieceWidth = cellSpacing;
        let pieceHeight = sideHeight;
        let player1NumUnused = NUM_PIECES_PER_PLAYER - player1Pieces.length;
        for (let i = 0; i < player1NumUnused; i++) {
            let x = x_offset + i * (cellWidth + cellSpacing);
            context.fillRect(x, 0, pieceWidth, pieceHeight);
        }
        let player2NumUnused = NUM_PIECES_PER_PLAYER - player2Pieces.length;
        for (let i = 0; i < player2NumUnused; i++) {
            let x = x_offset + i * (cellWidth + cellSpacing);
            context.fillRect(x, height-pieceHeight, pieceWidth, pieceHeight);
        }
    }

    function drawPawns(pawns, playerColors) {
        for(let i=0; i<pawns.length; i++) {
            drawPawn(pawns[i], playerColors[i]);
        }
    }

    function drawPawn(playerPosition, playerColor) {
        let [row, col] = playerPosition;
        let x_offset = sideWidth + cellSpacing + cellWidth/2;
        let y_offset = sideHeight + cellSpacing + cellHeight/2;
        let x = x_offset + col * (cellWidth + cellSpacing);
        let y = y_offset + row * (cellHeight + cellSpacing);
        context.fillStyle = playerColor;
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(x, y, cellWidth/2 - piecePadding, 0, 2*Math.PI);
        context.fill();
        context.stroke();
    }

    function drawWalls(walls) {
        walls.forEach(([row, col, orientation]) => {
            drawWall(row, col, orientation, WALL_COLOR);
        })
    }

    function drawHighlightedWall(coords, fillColor='#FF7777') {
        coords.forEach(([row, col, orientation]) => {
            drawWall(row, col, orientation, fillColor);
        })
    }

    function drawWall(row, col, orientation, fillColor) {
        let x = sideWidth + col*(cellWidth+cellSpacing);
        let y = sideHeight + row*(cellHeight+cellSpacing);
        context.fillStyle = fillColor;
        if(orientation === 'h') {
            let wallWidth = 2*cellWidth + cellSpacing;
            let wallHeight = cellSpacing;
            x += cellSpacing;
            context.fillRect(x, y, wallWidth, wallHeight);
        }
        if(orientation === 'v') {
            let wallWidth = cellSpacing;
            let wallHeight = 2*cellHeight + cellSpacing;
            y += cellSpacing;
            context.fillRect(x, y, wallWidth, wallHeight);
        }
    }

    

    function drawHighlightedSquares(coords, fillColor='#FF7777') {
        coords.forEach(([row, col]) => {
            let x = sideWidth + cellSpacing + col*(cellWidth+cellSpacing);
            let y = sideHeight + cellSpacing + row*(cellHeight+cellSpacing);
            context.fillStyle = fillColor;
            context.fillRect(x, y, cellWidth, cellHeight);
        });
    }

    function mouseCoordsToBoardCoords(x, y) {
        let row = Math.floor((y-sideHeight)/(cellHeight+cellSpacing));
        let col = Math.floor((x-sideWidth)/(cellWidth+cellSpacing));
        let cellXoffset = (y-sideHeight) % (cellHeight+cellSpacing); 
        let cellYoffset = (x-sideWidth) % (cellWidth+cellSpacing);
        let clickedOnPiece = (cellXoffset > cellSpacing && cellYoffset > cellSpacing);
        let clickedOnSpace = null;
        if (cellYoffset <= cellSpacing) {
            clickedOnSpace = 'v';
        }
        else if (cellXoffset <= cellSpacing) {
            clickedOnSpace = 'h';
        }
        
        return [row, col, clickedOnPiece, clickedOnSpace];
    }

    function canvasClickListener(event) {
        var gameState = corridorStateManager.getGameState();
        if (gameState.isGameOver()) { return; }
        console.log(`Clicked at (${event.offsetX}, ${event.offsetY})`);
        let [row, col, clickedOnSquare, clickedOnSpace] = mouseCoordsToBoardCoords(event.offsetX, event.offsetY);
        let currentPlayer = gameState.currentPlayer;
        let currentPlayerColor = gameState.playerColors[currentPlayer];
        if (clickedOnSquare) {
            let [playerRow, playerCol] = gameState.playerPawn[currentPlayer];
            if (row === playerRow && col === playerCol) {
                selectedPiecePosition = [row, col];
                selectedWallPosition = null;
                availableMoves = corridorStateManager.getValidMoves(gameState, row, col);
                draw(gameState);
                drawHighlightedSquares(availableMoves);
            } else if (selectedPiecePosition && availableMoves.some(([r, c]) => r === row && c === col)) {
                corridorStateManager.movePawn(row, col);
                selectedPiecePosition = null;
                selectedWallPosition = null;
                availableMoves = [];
                draw(gameState);

                if (gameState.isGameOver()) {
                    showMessage(`Player ${currentPlayerColor} wins!`);
                }
            }
        } else if (clickedOnSpace) {
            if (selectedWallPosition && selectedWallPosition[0] === row && selectedWallPosition[1] === col && selectedWallPosition[2] === clickedOnSpace) {
                corridorStateManager.placeWall(...selectedWallPosition);
                selectedPiecePosition = null;
                selectedWallPosition = null;
                availableMoves = [];
                draw(gameState);
            } else {
                if (corridorStateManager.canPlaceWall(row, col, clickedOnSpace)) {
                    selectedPiecePosition = null;
                    selectedWallPosition = [row, col, clickedOnSpace];
                    availableMoves = [];
                    draw(gameState);
                    drawHighlightedWall([[row, col, clickedOnSpace]]);
                } else {
                    selectedPiecePosition = null;
                    selectedWallPosition = null;
                    availableMoves = [];
                    draw(gameState);
                }
            }
        } else {
            selectedPiecePosition = null;
            selectedWallPosition = null;
            availableMoves = [];
            draw(gameState);
        }
    }

    function draw(gameState) {
        clearBoard();
        let pawns = gameState.playerPawn;
        let placedPieces = gameState.playerPlacedPieces;
        let playerColors = gameState.playerColors;
        drawBoardSquares();
        drawUnusedBoardPieces(placedPieces[0], placedPieces[1]);
        drawPawns(pawns, playerColors);
        drawWalls(gameState.placedPieces);
        showPlayerTurn(gameState);
    }

    function initialize() {
        let gameState = corridorStateManager.getGameState();
        draw(gameState); 
        canvas.addEventListener('click', canvasClickListener);
    }

    function showMessage(message) {
        if (message) { console.log(`showMessage: ${message}`); }
        document.getElementById('messageArea').innerHTML = message;
    }
    function clearMessage() { showMessage(''); }
    function showPlayerTurn(gameState) {
        let playerTurn = gameState.playerColors[gameState.currentPlayer];
        document.getElementById('playerTurn').innerHTML = playerTurn;
    }

    return {
        initialize: initialize,
    }
}