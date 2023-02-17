var board,
    game = new Chess();

var killerMoves = {};

var minimaxRoot = function (depth, game, isMaximisingPlayer) {
    var newGameMoves = game.ugly_moves();
    var bestMove = -9999;
    var bestMoveFound;

    // Get previously discarded moves at the current depth
    var discardedMoves = [];
    if (killerMoves[depth]) {
        for (var move in killerMoves[depth]) {
            if (killerMoves[depth].hasOwnProperty(move) && killerMoves[depth][move] <= 0) {
                discardedMoves.push(move);
            }
        }
    }

    // Sort the moves using the move ordering technique, excluding discarded moves
    newGameMoves.sort(function (a, b) {
        if (discardedMoves.indexOf(a) !== -1 || discardedMoves.indexOf(b) !== -1) {
            return 0;
        }
        return killerMoves[depth] && killerMoves[depth][a] > killerMoves[depth][b] ? -1 :
            killerMoves[depth] && killerMoves[depth][a] < killerMoves[depth][b] ? 1 :
                getMoveValue(game, b) - getMoveValue(game, a);
    });

    for (var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        game.ugly_move(newGameMove);
        var value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
        game.undo();
        if (value >= bestMove) {
            bestMove = value;
            bestMoveFound = newGameMove;
        }
        // Update the killer moves
        if (!killerMoves[depth]) {
            killerMoves[depth] = {};
        }
        killerMoves[depth][newGameMove] = (killerMoves[depth][newGameMove] || 0) + 1;
        // Discard the move if it does not change the best move and has already been discarded
        if (bestMoveFound && newGameMove !== bestMoveFound && value < bestMove) {
            if (!killerMoves[depth]) {
                killerMoves[depth] = {};
            }
            killerMoves[depth][newGameMove] = (killerMoves[depth][newGameMove] || 0) - 1;
            discardedMoves.push(newGameMove);
        }
    }
    return bestMoveFound;
};

var zeroMove = function (game) {
    var newGameMoves = game.ugly_moves();

    for (var i = 0; i < newGameMoves.length; i++) {
        game.ugly_move(newGameMoves[i]);
        var value = minimax(1, game, -10000, 10000, false);
        game.undo();

        // If a zero move is found, immediately return it
        if (value >= 1000) {
            return newGameMoves[i];
        }
    }

    // If no zero move is found, return null
    return null;
};

// This function calculates the value of a move
var getMoveValue = function (game, move) {
    var value = 0;
    if (game.in_checkmate()) {
        // If the move is a checkmate, it is the best move
        return 10000;
    } else if (game.in_draw()) {
        // If the move is a draw, it is not a good move
        return -100000;
    } else if (game.in_check()) {
        // If the move puts the opponent in check, it is a good move
        value += 10;
    }

    // Add the value of the captured piece (if any)
    var capturedPiece = game.get(move.to);
    if (capturedPiece) {
        value += getPieceValue(capturedPiece.type, move.to[0], move.to[1]);
    }

    return value;
};


var minimax = function (depth, game, alpha, beta, isMaximisingPlayer) {
    positionCount++;
    if (depth === 0) {
        return -evaluateBoard(game.board());
    }

    var newGameMoves = game.ugly_moves();

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
};

var evaluateBoard = function (board) {
    var totalEvaluation = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i ,j);
        }
    }
    return totalEvaluation;
};

var reverseArray = function(array) {
    return array.slice().reverse();
};

var pawnEvalWhite =
    [[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        [0.5, 1.0, 1.0, -2.5, -2.5, 1.0, 1.0, 0.5],
        [0.5, -0.5, -1.0, 0.0, 0.0, -1.0, -0.5, 0.5],
        [0.0, 0.0, 0.0, 2.0, 2.5, 0.0, 0.0, 0.0],
        [0.5, 0.5, 1.0, 2.0, 2.5, 1.0, 0.5, 0.5],
        [1.0, 1.0, 2.0, 2.5, 3.0, 2.0, 1.0, 1.0],
        [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    ];

var pawnEvalBlack = reverseArray(pawnEvalWhite);

var knightEval =
    [[-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
        [-4.0, -2.0, 0.0, 0.5, 0.5, 0.0, -2.0, -4.0],
        [-3.0, 0.5, 1.0, 1.5, 1.5, 1.0, 0.5, -3.0],
        [-3.0, 0.0, 1.5, 2.0, 2.0, 1.5, 0.0, -3.0],
        [-3.0, 0.5, 1.5, 2.0, 2.0, 1.5, 0.5, -3.0],
        [-3.0, 0.0, 1.0, 1.5, 1.5, 1.0, 0.0, -3.0],
        [-4.0, -2.0, 0.0, 0.0, 0.0, 0.0, -2.0, -4.0],
        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
    ];

var bishopEvalWhite = [[-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
[-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
[-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
[-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
[-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
[-1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0],
[-1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, -1.0],
[-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

var bishopEvalBlack = reverseArray(bishopEvalWhite);

var rookEvalWhite = [
    [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
];

var rookEvalBlack = reverseArray(rookEvalWhite);

var evalQueen = [
    [-2, -1, -1, -0.5, -0.5, -1, -1, -2],
    [-1, 0, 0, 0, 0, 0, 0, -1],
    [-1, 0, 0.5, 0.5, 0.5, 0.5, 0, -1],
    [-0.5, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
    [0, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
    [-1, 0.5, 0.5, 0.5, 0.5, 0.5, 0, -1],
    [-1, 0, 0.5, 0, 0, 0, 0, -1],
    [-2, -1, -1, -0.5, -0.5, -1, -1, -2]
];

var kingEvalWhite = [
  [-3, -4, -4, -5, -5, -4, -4, -3],
  [-3, -4, -4, -5, -5, -4, -4, -3],
  [-3, -4, -4, -5, -5, -4, -4, -3],
  [-3, -4, -4, -5, -5, -4, -4, -3],
  [-2, -3, -3, -4, -4, -3, -3, -2],
  [-1, -2, -2, -2, -2, -2, -2, -1],
  [2, 2, 0, 0, 0, 0, 2, 2],
  [2, 3, 1, 0, 0, 1, 3, 2]
];

var kingEvalBlack = reverseArray(kingEvalWhite);
function isEndgame(game) {
    // If there are less than 6 pieces left on the board, it's likely the game is in the endgame
    const pieces = game.board().reduce((a, b) => a.concat(b));
    const numPieces = pieces.filter(p => p !== null).length;
    return numPieces <= 6;
}

function evaluateEndgame(board) {
    // TODO: Implement endgame evaluation function
    return 0;
}

function evaluateBoard(board) {
    // If it's the endgame, use a different evaluation function
    if (isEndgame(game)) {
        return evaluateEndgame(board);
    }

    // Otherwise, use the normal evaluation function
    var totalEvaluation = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}




var getPieceValue = function (piece, x, y) {
    if (piece === null) {
        return 0;
    }
    var getAbsoluteValue = function (piece, isWhite, x ,y) {
        if (piece.type === 'p') {
            return 10 + ( isWhite ? pawnEvalWhite[y][x] : pawnEvalBlack[y][x] );
        } else if (piece.type === 'r') {
            return 50 + ( isWhite ? rookEvalWhite[y][x] : rookEvalBlack[y][x] );
        } else if (piece.type === 'n') {
            return 30 + knightEval[y][x];
        } else if (piece.type === 'b') {
            return 30 + ( isWhite ? bishopEvalWhite[y][x] : bishopEvalBlack[y][x] );
        } else if (piece.type === 'q') {
            return 90 + evalQueen[y][x];
        } else if (piece.type === 'k') {
            return 900 + ( isWhite ? kingEvalWhite[y][x] : kingEvalBlack[y][x] );
        }
        throw "Unknown piece type: " + piece.type;
    };

    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x ,y);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
};


/* board visualization and games state handling */

var onDragStart = function (source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeBestMove = function () {
    var bestMove = getBestMove(game);
    game.ugly_move(bestMove);
    board.position(game.fen());
    renderMoveHistory(game.history());
    if (game.game_over()) {
        alert('Game over');
    }
};


var positionCount;
var getBestMove = function (game) {
    if (game.game_over()) {
        alert('Game over');
    }

    positionCount = 0;
    var depth = parseInt($('#search-depth').find(':selected').text());

    var d = new Date().getTime();
    var bestMove = minimaxRoot(depth, game, true);
    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = ( positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    $('#time').text(moveTime/1000 + 's');
    $('#positions-per-s').text(positionsPerS);
    return bestMove;
};

var renderMoveHistory = function (moves) {
    var historyElement = $('#move-history').empty();
    historyElement.empty();
    for (var i = 0; i < moves.length; i = i + 2) {
        historyElement.append('<span>' + moves[i] + ' ' + ( moves[i + 1] ? moves[i + 1] : ' ') + '</span><br>')
    }
    historyElement.scrollTop(historyElement[0].scrollHeight);

};

var onDrop = function (source, target) {

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    removeGreySquares();
    if (move === null) {
        return 'snapback';
    }

    renderMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250);
};

var onSnapEnd = function () {
    board.position(game.fen());
};

var onMouseoverSquare = function(square, piece) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function(square, piece) {
    removeGreySquares();
};

var removeGreySquares = function() {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function(square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
};
board = ChessBoard('board', cfg);
