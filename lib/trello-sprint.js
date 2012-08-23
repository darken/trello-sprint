var fs = require('fs'),
    cron = require('cron'),
    _ = require('underscore');

var DayInfo = require('./objects').DayInfo,
    RecordProvider = require('./record-provider'),
    grapher = require('./grapher'),
    downloader = require('./downloader'),
    mailer = require('./mailer'),
    dayCounter = require('./day-counter');

var OUTPUT_DIR = 'output';

var settings = require('../settings');

var trello = (function createTrello() {
  var Trello,
      key = settings.key;
  if (!key || key.length === 0) {
    throw 'The value of "key" was not found in settings.json.';
  }
  Trello = require('node-trello');
  return new Trello(key);
}());

//Process error
function ifErr(err) {
  if (err) throw err;
}

exports.addTask = function (boardId, totalDays) {
};

// EXECUTE
exports.execute = function (boardId, totalDays) {

var cronJob,
    recordProvider = new RecordProvider(OUTPUT_DIR, 'record');

//Read record file
recordProvider.getRecord(function (err, record) {
  ifErr(err);

  var lastSavedDayNum,
      dayInfoArray;
  if (record) {
    boardId = record.boardId;
    totalDays = record.totalDays;
    dayCounter.setStartDate(record.startDate);

    dayInfoArray = record.dayInfoArray;
    if (dayInfoArray) {
      lastSavedDayNum = _.last(dayInfoArray).num;
    } else {
      lastSavedDayNum = -1;
    }

    startJob(lastSavedDayNum);
  } else {
    setInitialRecordData();
  }
});

function setInitialRecordData() {
  if (!boardId) throw 'Please pass the boardId parameter.';
  var data = {
    boardId: boardId,
    totalDays: totalDays,
    startDate: dayCounter.getStartDate()
  };

  recordProvider.setInitialData(data, function (err) {
    ifErr(err);
    startJob(-1);
  });
}

function startJob(lastSavedDayNum) {
  var currentDayCount, 
      currentDate,
      currentHour,
      cronPattern,
      validDay;

  cronPattern = '00 00 ' + settings.jobHour + ' * * ' + settings.jobDaysOfWeek;
  dayCounter.obtainDaysOfWeek(cronPattern);

  currentDayCount = dayCounter.getCurrentDayCount();
  currentDate = new Date();
  currentHour = currentDate.getHours();
  validDay = dayCounter.validDayOfWeek(currentDate.getDay());

  // Executes the daily job if the day has not been saved and the time has passed
  console.log('\nLast saved day: %d', lastSavedDayNum);
  console.log('Current day: %d', currentDayCount);
  console.log('Job hour: %d, Current hour: %d', settings.jobHour, currentHour);
  console.log(validDay ? 'Job valid day' : 'Job invalid day');

  if (lastSavedDayNum >= totalDays) {
    backupAndStop();
    return;
  }

  if (validDay && lastSavedDayNum < currentDayCount && settings.jobHour <= currentHour) {
    dailyTick();
  }

  cronJob = cron.job(cronPattern, dailyTick, null);
  cronJob.start();
  console.log('\nCronJob started with the pattern: %s', cronPattern);
}

function dailyTick() {
  var currentDayCount = dayCounter.getCurrentDayCount();
  console.log('Running job for day %d', currentDayCount);

  var boardReqArgs = {
        lists: 'open'
      },
      cardsReqArgs = {
        fields: 'idList,labels'
      };

  trello.get('/1/board/' + boardId, boardReqArgs, function (err, data) {
    ifErr(err);

    var list,
        prop,
        listIds = {};

    for (var i = 0; i < data.lists.length; i++) {
      list = data.lists[i];
      prop = validList(list);
      if (prop) {
        listIds[list.id] = prop;
      }
    }

    trello.get('/1/board/' + boardId + '/cards', cardsReqArgs, function (err, data) {
      ifErr(err);

      var card,
          isSupport,
          dayInfo = new DayInfo(currentDayCount),
          doneProp = 'done';
      for (var i = 0; i < data.length; i++) {
        card = data[i];
        prop = listIds[card.idList];
        if (prop) {
          isSupport = false;
          card.labels.forEach(function (label) {
            if (label.color === "blue") isSupport = true;
          });

          if (!isSupport) {
            if (prop === doneProp) {
              dayInfo.done++;
            }
            dayInfo.total++;
          } else {
            if (prop === doneProp) {
              dayInfo.supportDone++;
            }
            dayInfo.supportTotal++;
          }
        }
      }
      addDayInfo(dayInfo);
    });
  });
}

function addDayInfo(dayInfo) {
  console.log('DayInfo: %j', dayInfo);
  recordProvider.addDayInfo(dayInfo, function (err) {
    ifErr(err);

    recordProvider.getDayInfoArray(function (err, array) {
      ifErr(err);

      var graphUrl = grapher.createGraph(array, totalDays);
      downloadFile(graphUrl, dayInfo);
    });
  });
}

function downloadFile(url, lastSavedDayInfo) {
  downloader.downloadFile(url, function (err, data) {
    ifErr(err);
    var fileName = 'chart' + lastSavedDayInfo.num + '.png';
    console.log('Saving file');

    var cb = createMultiCb(2, function () {
      return function () {
        if (lastSavedDayInfo.num >= totalDays) {
          backupAndStop();
        }
      };
    }());
    sendFile(fileName, data, cb);
    writeFile(fileName, data, cb);
  });
}

function createMultiCb(maxCalls, cb) {
  var calls = 0;
  return function () {
    calls++;
    if (maxCalls <= calls) {
      cb();
    }
  };
}

function backupAndStop() {
  fs.rename('output', 'output_old', function (err) {
    ifErr(err);
    fs.mkdir('output', function (err) {
      ifErr(err);
      stopCron();
    });
  });
}

function stopCron() {
  if (cronJob) {
    cronJob.stop();
  }
  console.log('Days completed, bye!');
}

function sendFile(fileName, data, cb) {
  var dataBuffer = new Buffer(data, 'binary');
  mailer.sendFile(fileName, dataBuffer, function (result) {
    console.log('Sending mail result: ' + (result ? 'ok' : 'failed'));
    cb();
  });
}

function writeFile(fileName, data, cb) {
  fs.writeFile(OUTPUT_DIR + '/' + fileName, data, 'binary', function (err) {
    ifErr(err);
    console.log('File saved');
    cb();
  });
}

function validList(list) {
  var prop,
      namesArray;
  for (prop in settings.listNames) {
    namesArray = settings.listNames[prop];
    if (-1 !== namesArray.indexOf(list.name)) {
      console.log('Found list "%s" for list type "%s"', list.name, prop);
      return prop;
    }
  }
  return null;
}

// EXECUTE
};
