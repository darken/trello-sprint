var trelloSprint = require('./lib/trello-sprint.js');

var boardId = process.argv[2],
    totalDays = +process.argv[3] || 9;

trelloSprint.execute(boardId, totalDays);
