var fs = require('fs'),
    path = require('path'),
    JSONProvider = require('./json-provider');

var ENCODING = 'utf-8';

function RecordProvider(dirPath, name) {
  JSONProvider.call(this, dirPath, name);
}

RecordProvider.prototype = Object.create(JSONProvider.prototype,
    { constructor: { value: RecordProvider } });

RecordProvider.prototype.getRecord = getRecord;
RecordProvider.prototype.setInitialData = setInitialData;
RecordProvider.prototype.addDayInfo = addDayInfo;
RecordProvider.prototype.getDayInfoArray = getDayInfoArray;

function fixRecordData(record) {
  record.startDate = new Date(record.startDate);
}

function getRecord(cb) {
  if (this.record) {
    cb(null, this.record);
  } else {
    this.read(function (err, record) {
      if (record) fixRecordData(record);
      cb(err, record);
    });
  }
}

function setInitialData(data, cb) {
  this.record = {};

  var dataVars = ['boardId', 'totalDays', 'startDate'],
      currVar;

  for (var i = 0; i < dataVars.length; i++) {
    currVar = dataVars[i];
    this.record[currVar] = data[currVar];
  }
  this.write(cb);
}

function addDayInfo(dayInfo, cb) {
  if (!this.record.dayInfoArray) this.record.dayInfoArray = [];

  this.record.dayInfoArray.push(dayInfo);
  this.write(cb);
}

function getDayInfoArray(cb) {
  cb(null, this.record.dayInfoArray);
}

exports = module.exports = RecordProvider;
