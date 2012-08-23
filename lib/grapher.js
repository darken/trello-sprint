var quiche = require('quiche'),
    _ = require('underscore'),
    DayInfo = require('./objects').DayInfo,
    lineStyles = require('../line-styles');

function createGraph(days, totalDays) {
  console.log('\nGraph');

  var chart = quiche('line'),
      lastDayInfo = _.last(days);

  chart.setWidth(600);
  chart.setHeight(500);
  chart.setTitle(lineStyles.chartTitle + ' ' + lastDayInfo.num);

  addData(chart, createIdealData(days[0], totalDays), lineStyles.idealFirst);

  addData(chart, createIdealData(lastDayInfo, totalDays), lineStyles.idealLast);

  addData(chart, createTotalData(days, totalDays), lineStyles.total);

  addData(chart, createDoneData(days, totalDays), lineStyles.done);

  addData(chart, createIncreasingData(days, totalDays), lineStyles.supportDone);

  chart.addAxisLabels('x', createAxisLabels(totalDays));
  chart.setTransparentBackground();

  var gridLines = '&chg=' + (100 / totalDays) + ',100,1,5';
  return chart.getUrl(true) + gridLines;
}

function addData(chart, data, lineStyle) {
  chart.addData(data, lineStyle.label, lineStyle.color,
      lineStyle.thickness, lineStyle.lineLength, lineStyle.spaceLength);
}

function createData(days, totalDays, func) {
  var data = [],
      iDayInfo;

  for (var i = 0; i <= totalDays; i++) {
    iDayInfo = getDayInfoByNum(days, i);
    if (iDayInfo) {
      data.push(func(iDayInfo));
    }
  }
  return data;
}

function createTotalData(days, totalDays) {
  var data = createData(days, totalDays, function (iDayInfo) {
    return iDayInfo.total;
  });
  console.log('Total data: %j', data);
  return data;
}

function createDoneData(days, totalDays) {
  var data = createData(days, totalDays, function (iDayInfo) {
    return iDayInfo.total - iDayInfo.done;
  });
  console.log('Done data: %j', data);
  return data;
}

function getDayInfoByNum(days, dayNumber) {
  var day,
      otherDay;

  for (var i = 0; i < days.length; i++) {
    day = days[i];
    if (day.num === dayNumber) {
      return day;
    } else if (day.num > dayNumber) {
      if (i > 0) {
        return days[i - 1];
      } else {
        otherDay = new DayInfo(0);
        otherDay.total = day.total;
        return otherDay;
      }
    }
  }
  return day;
}

function createIdealData(day0, totalDays) {
  var data = [],
    increment = day0.total / totalDays;
  for (var i = 0; i <= totalDays; i++) {
    data.push(day0.total - (increment * i));
  }
  return data;
}

function createIncreasingData(days, totalDays) {
  var data = createData(days, totalDays, function (iDayInfo) {
    return iDayInfo.supportDone;
  });
  console.log('Support done data: %j', data);
  return data;
}

function createAxisLabels(totalDays) {
  var data = [];
  for (var i = 0; i <= totalDays; i++) {
    data.push(i);
  }
  return data;
}

exports.createGraph = createGraph;
