var uuid = require('node-uuid');

/* 
 * GET a list of the current phone calls DB
 */
exports.list = function(req, res) {
  res.app.get('connection').query('SELECT * FROM ebdb.PhoneCallLogs order by logTimestamp desc', function(err, rows) {
    if (err) {
      res.send(err);
    } else {
      // console.log(JSON.stringify(rows));
      res.render('phonecalls', {title: 'Phone Call Log', phonecalls: rows});
  }});
};


/*
 * POST a single phone call record
 */
exports.add_msgTest = function(req, res) {
  var input = req.body.msgTest;
/***
  var hike = { HIKE_DATE: new Date(), ID: uuid.v4(), NAME: input.NAME,
  LOCATION: input.LOCATION, DISTANCE: input.DISTANCE, WEATHER: input.WEATHER};
  console.log('Request to log hike:' + JSON.stringify(hike));
  req.app.get('connection').query('INSERT INTO HIKES set ?', hike, function(err) {
      if (err) {
        res.send(err);
      } else {
        res.redirect('/hikes');
      }
   });
***/
};


/*
 * POST a log file
 */
exports.fileupload = function(req, res) {
  var fs = require('fs');
 
  // Read the file and send to the callback
  fs.readFile(req.app.get('fileDir') + req.files.azureDataFile.name, handleFile);

  // Write the callback function
  function handleFile(err, data) {
    if (err) {
      res.send(err);
    } else {
      // Parse the file name and get deviceUUID and logTimestamp
      var logFilename = req.files.azureDataFile.originalname;
      var logFileParams = logFilename.split("_");
      var deviceUUID = logFileParams[0];
      var logTimestamp = logFileParams[2];

	  // Read the log file data
      var obj = JSON.parse(data);
      var calls = obj.calls;

      for (var i=0; i < calls.length; i++) {
      
        var data = {  
		  deviceUUID : deviceUUID,
		  logTimestamp : logTimestamp,
		  originalLogFilename : logFilename,
		  callUUID : calls[i].uuid,
		  callTimestamp : calls[i].timestamp,
		  callSource : calls[i].source,
		  callMissedStatus : calls[i].missed,
		  callDirection : calls[i].direction, 
		  callDuration : calls[i].duration,
		  callFromName : calls[i].from.name,
		  callFromCallerID : calls[i].from.callerId,
		  callFromCaption : calls[i].from.captions,
		  callToNameList : JSON.stringify(calls[i].to.names),
		  callToCallerIDList : JSON.stringify(calls[i].to.callerIds),
		  callToCaptionList : JSON.stringify(calls[i].to.captions)       
        };
        
        //  INSERT into phonelogsDB
        req.app.get('connection').query('INSERT INTO `ebdb`.`PhoneCallLogs` set ?', data, function(err) {
          if (err) {
            res.send(err);
          } 
        });
      }
      //res.redirect('/xxx');
      res.sendStatus(200);
    }
  };
};    
