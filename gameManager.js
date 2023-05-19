var GameManager = function() {
    var playerTurn = 'white',
        boardManager = BoardManager();

    function initialize() {
        boardManager.initialize();
        boardManager.drawChessboard();
        showPlayerTurn();

        document.getElementById('moveButton').addEventListener('click', function() {
            var moveStr = document.getElementById('moveStr').value;
            makeMove(moveStr);
            document.getElementById('moveStr').value = '';
        });
    }

    function showPlayerTurn() {
        console.log(`Player turn: ${playerTurn}`);
        document.getElementById('playerTurn').innerHTML = playerTurn;
    }

    function showMessage(message) {
        var messageArea = document.getElementById('messageArea');
        messageArea.innerHTML = message;
    }

    function makeMove(moveString) {
        var moveStr = document.getElementById('moveStr');
        var [startRow, startCol, endRow, endCol] = moveString.split(',').map((x) => parseInt(x));
        if (boardManager.isValidMove(startRow, startCol, endRow, endCol)) {
            boardManager.movePiece(startRow, startCol, endRow, endCol);
            boardManager.drawChessboard();
            playerTurn = (playerTurn === 'white') ? 'black' : 'white';
            showPlayerTurn();
            showMessage('');
        } else {
            showMessage(`Invalid move! (${startRow}, ${startCol}) => (${endRow}, ${endCol})`);
        }
    }

    return {
        initialize: initialize,
    }
}