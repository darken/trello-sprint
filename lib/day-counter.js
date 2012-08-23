var startDate,
    daysOfWeek;

function getDateUntilDay() {
  var date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function getCurrentDayCount() {
  var daysCount = daysBetween(startDate, getDateUntilDay()),
      dayNumber = startDate.getDay(),
      minus = 0;
  for (var i = 0; i <= daysCount; i++) {
    dayNumber++;
    if (dayNumber > 6) dayNumber = 0;

    if (!validDayOfWeek(dayNumber)) {
      minus -= 1;
    }
  }
  return daysCount + minus;
}

function validDayOfWeek(dayNumber) {
  return -1 != daysOfWeek.indexOf(dayNumber);
}

function daysBetween(date1, date2) {
  var ONE_DAY = 1000 * 60 * 60 * 24,
      differenceMs;

  differenceMs = Math.abs(date1.getTime() - date2.getTime());
  return Math.round(differenceMs / ONE_DAY);
}

exports.setStartDate = function (date) {
  startDate = date;
}

exports.getStartDate = function () {
  if (!startDate) {
    startDate = getDateUntilDay();
    startDate.setDate(startDate.getDate() - 1);
  }
  return startDate;
}

exports.obtainDaysOfWeek = function (cronPattern) {
  var cron = require('cron'),
      dayOfWeek = new cron.CronTime(cronPattern).dayOfWeek;

  daysOfWeek = [];
  for (var dayNum in dayOfWeek) {
    daysOfWeek.push(dayNum - 1);
  }
}

exports.getCurrentDayCount = getCurrentDayCount;
exports.validDayOfWeek = validDayOfWeek;
