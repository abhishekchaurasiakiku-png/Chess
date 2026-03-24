// Game State variables
const socket = io();
let myColor = 'w';
let currentRoom = null;
let board = null;
let game = new Chess();
let $status = $('#game-status');
let $pgn = $('#move-history');
let whiteSquareGrey = '#a9a9a9';
let blackSquareGrey = '#696969';

// Theme Toggle Logic
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
});

// Remove grey squares helper
function removeGreySquares () {
  $('#board .square-55d63').css('background', '');
}

// Add grey squares for legal moves helper
function greySquare (square) {
  let $square = $('#board .square-' + square);
  let background = whiteSquareGrey;
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey;
  }
  $square.css('background', background);
}

// Logic: Drag Start
function onDragStart (source, piece, position, orientation) {
  // Do not pick up pieces if the game is over
  if (game.game_over()) return false;

  if (currentRoom) {
      // Real-time play checks
      if ((myColor === 'w' && piece.search(/^b/) !== -1) ||
          (myColor === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
      if (game.turn() !== myColor) return false;
  } else {
      // Local play checks
      if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
  }
}

// Logic: Drop Piece
function onDrop (source, target) {
  removeGreySquares();

  // see if the move is legal
  let move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';

  updateStatus();

  // EMIT MOVE TO SERVER if in online match
  if (currentRoom) {
      socket.emit('make_move', {
          room: currentRoom,
          move: move
      });
  }
}

// Logic: Mouseover to see legal moves
function onMouseoverSquare (square, piece) {
  let moves = game.moves({
    square: square,
    verbose: true
  });

  if (moves.length === 0) return;

  greySquare(square);

  for (let i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares();
}

// Update board position after the piece snap
function onSnapEnd () {
  board.position(game.fen());
}

// Update game status and history UI
function updateStatus () {
  let statusHTML = '';
  let moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // Checkmate?
  if (game.in_checkmate()) {
    statusHTML = `Game over, ${moveColor} is in checkmate.`;
    $status.removeClass().addClass('status-indicator mate');
  }
  // Draw?
  else if (game.in_draw()) {
    statusHTML = 'Game over, drawn position';
    $status.removeClass().addClass('status-indicator');
  }
  // Game still on
  else {
    statusHTML = `${moveColor} to move`;
    $status.removeClass().addClass('status-indicator');

    // Check?
    if (game.in_check()) {
      statusHTML += `, ${moveColor} is in check`;
      $status.addClass('check');
    }
  }

  $status.html(statusHTML);

  // Update Move History
  updateHistory();
}

function updateHistory() {
    const history = game.history();
    let historyHTML = '';
    
    for (let i = 0; i < history.length; i += 2) {
        historyHTML += `<div class="history-row">
            <div class="history-num">${(i / 2) + 1}.</div>
            <div class="history-move">${history[i]}</div>
            <div class="history-move">${history[i + 1] ? history[i + 1] : ''}</div>
        </div>`;
    }
    
    $pgn.html(historyHTML);
    // Scroll history to bottom
    const historyBox = document.getElementById('move-history');
    if(historyBox) historyBox.scrollTop = historyBox.scrollHeight;
}

// Initialization Configuration
let config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

$(document).ready(function() {
    // Initialize Board
    board = Chessboard('board', config);
    updateStatus();

    // Event Listeners for Controls
    $('#btn-start').on('click', function() {
        socket.emit('join_matchmaking');
        $(this).prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Finding Match...');
    });

    $('#btn-flip').on('click', function() {
        board.flip();
    });

    $('#btn-undo').on('click', function() {
        if(currentRoom) return; // Disable undo for online play
        game.undo();
        board.position(game.fen());
        updateStatus();
    });
    
    // Resize board correctly on window resize
    $(window).resize(function() {
        board.resize();
    });

    // --- Socket.IO Listeners ---
    socket.on('waiting', (data) => {
        $status.html(data.message);
    });

    socket.on('game_start', (data) => {
        currentRoom = data.room;
        myColor = data.players.white === socket.id ? 'w' : 'b';
        
        game.reset();
        board.start();
        board.orientation(myColor === 'w' ? 'white' : 'black');
        
        $('#btn-start').hide();
        $('#btn-undo').hide(); // Disable undo online
        
        $('.player-info.you .name').text(`You (${myColor === 'w' ? 'White' : 'Black'})`);
        $('.player-info.opponent .name').text(`Opponent (${myColor === 'w' ? 'Black' : 'White'})`);

        updateStatus();
    });

    socket.on('opponent_move', (move) => {
        game.move(move);
        board.position(game.fen());
        updateStatus();
    });

    socket.on('opponent_disconnected', (data) => {
        $status.html(data.message + ' You win!').addClass('mate');
        currentRoom = null;
        $('#btn-start').show().prop('disabled', false).html('<i class="fa-solid fa-play"></i> New Game');
    });
});
