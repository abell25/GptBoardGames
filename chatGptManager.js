const CHATGPT_API_KEY = 'chatGptApiKey'

const MODEL_TO_ENDPOINT_LOOKUP = {
    "gpt-4": "/v1/chat/completions",
    "gpt-4-0314": "/v1/chat/completions",
    "gpt-4-32k": "/v1/chat/completions",
    "gpt-4-32k-0314": "/v1/chat/completions",
    "gpt-3.5-turbo": "/v1/chat/completions",
    "gpt-3.5-turbo-0301": "/v1/chat/completions",
    "text-davinci-003": "/v1/completions",
    "text-davinci-002": "/v1/completions",
    "text-curie-001": "/v1/completions",
    "text-babbage-001": "/v1/completions",
    "text-ada-001": "/v1/completions",  
}

var ChatGptManager = function() {
    function initialize() {
    }

    function getApiKey() {
        const storedToken = localStorage.getItem(CHATGPT_API_KEY);
        if (storedToken) { return storedToken; }
        const token = prompt('Please enter your OpenAI API key:').replace('Bearer ', '');
        localStorage.setItem(CHATGPT_API_KEY, token);
        return token;
    }

    function clearApiKey() {
        localStorage.removeItem(CHATGPT_API_KEY);
    }

    function getSettings() {
        return {
            'modelName': document.getElementById('modelName').value,
            'temperature': parseFloat(document.getElementById('temperature').value),
            'maxTokens': parseInt(document.getElementById('maxTokens').value),
        };
    }

    function sendChatMessage(message) {
        let settings = getSettings(); 
        let endpoint = MODEL_TO_ENDPOINT_LOOKUP[settings.modelName];

        if (endpoint === '/v1/chat/completions') {
            return sendChatMessage_v1ChatCompletions(message, settings);
        } else if (endpoint === '/v1/completions') {
            return sendChatMessage_v1Completions(message, settings);
        } else {
            console.error(`Unknown endpoint: ${endpoint}`);
        }
    }

    function sendChatMessage_v1ChatCompletions(message, settings) {
        console.log(`prompt: <<${message}>>`);
        return fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getApiKey()}`,
          },
          body: JSON.stringify({
              "model": settings.modelName,
              "messages": [{"role": "user", "content": message}],
              "max_tokens": settings.maxTokens,
              "temperature": settings.temperature,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            // Handle the response from the server
            // Use data as needed
            let response = data.choices[0]['message']['content'].trim('\n');
            console.log(`\nchatGPT response:\n================\n${response}\n================\n`);
            return response;
          })
          .catch((error) => {
            // Handle any errors
            console.error('Error:', error);
          });
    }

      function sendChatMessage_v1Completions(message, settings) {
        console.log(`prompt: <<${message}>>`);
        return fetch("https://api.openai.com/v1/completions", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getApiKey()}`,
          },
          body: JSON.stringify({
              "model": settings.modelName,
              "prompt": message,
              "max_tokens": settings.maxTokens,
              "temperature": settings.temperature,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            // Handle the response from the server
            // Use data as needed
            let response = data.choices[0].text.trim('\n');
            console.log(`\nchatGPT response:\n================\n${response}\n================\n`);
            return response;
          })
          .catch((error) => {
            // Handle any errors
            console.error('Error:', error);
          });
      }

    function getPrompt(boardState, failingMoves=[]) {
        let boardStateStr = boardState.getChessPiecePositions().map(([row, col, color, piece]) => `  * ${row},${col},${color},${piece}`).join('\n')
        let validMovesStr = boardState.getAllValidMovesWithPieceNames().map(
            ([startRow, startCol, endRow, endCol, color, piece]) => `  * ${startRow},${startCol},${endRow},${endCol} (${piece})`
        ).join('\n');
        if (failingMoves.length > 0) {
            let failingMovesStr = failingMoves.map(x => `  [${x.join(',')}]`).join(', ');
            return `
                You have selected an invalid move: ${failingMovesStr}
                Please select a move from the following list of valid moves in the format of "startRow,startCol,endRow,endCol (piece)" (0-indexed):
                # VALID_MOVES_LIST
                ${validMovesStr}
     

                Here are a list of pieces currently on the board:
                # PIECES_LIST
                ${boardStateStr}


                The first line of your response is your move, which should be of the form "startRow,startCol,endRow,endCol" (0-indexed),
                The second line of your response should be an empty line.
                the rest of your response is your message to me and can be anything you want.
                `;
        }
        return `
        We are playing a game of chess!
        I am the white pieces and you are the black pieces. 
        It's your turn to move.
        The first line of your response is your move, which should be of the form "startRow,startCol,endRow,endCol" (0-indexed),
        The second line of your response should be an empty line.
        the rest of your response is your message to me and can be anything you want.

        Your goal is to win the game by putting my king in checkmate. Always prefer to 
        capture high value targets (queen > rook > bishop > knight > pawn) if you can do 
        so without losing high value targets yourself. Always avoid losing pieces unless you
        are trading the piece for a higher value piece. 


        Here is the current state of pieces on the board in the format of "row,column,color,pieceType":
        # PIECES_LIST
        ${boardStateStr}

        Here are the list of valid moves you can make in the format of "startRow,startCol,endRow,endCol (pieceType)":
        # VALID_MOVES_LIST
        ${validMovesStr}

        `;
    }

    function getMoveAndResponse(boardState, failedMoves=[]) {
        return sendChatMessage(getPrompt(boardState, failedMoves)).then((response) => {
            var regex = /(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/;
            let move = response.match(regex).slice(1, 5).map(x => parseInt(x));
            //let move = response.split('\n')[0].split(',').map((x) => parseInt(x));
            let message = response.split('\n').slice(1).join('\n').trim('\n');
            console.log(`    move: [${move.join(',')}]\n    message: ${message}`);
            return {'move': move, 'message': message};
        });
    }


    return {
        initialize: initialize,
        sendChatMessage: sendChatMessage,
        getMoveAndResponse: getMoveAndResponse,

    }
}