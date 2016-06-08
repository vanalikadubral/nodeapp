var uuid = require('node-uuid');

/* 
 * GET a list of the current SMS DB
 */
exports.list = function(req, res) {
  res.app.get('connection').query('SELECT * FROM ebdb.SMSLogs order by logTimestamp desc', function(err, rows) {
    if (err) {
      res.send(err);
    } else {
      // console.log(JSON.stringify(rows));
      res.render('smss', {title: 'SMS Log', smss: rows});
  }});
};


/*
 * POST a single SMS record
 */
exports.add_hike = function(req, res) {
  var input = req.body.hike;
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
      var smss = obj.sms;

      for (var i=0; i < smss.length; i++) {
      
        var decodedSMS = new Buffer(smss[i].body,'base64').toString('ascii');
        var data = {  
    		  deviceUUID : deviceUUID,
    		  logTimestamp : logTimestamp,
    		  originalLogFilename : logFilename,
    		  smsTimestamp : smss[i].timestamp,
    		  smsUUID : smss[i].uuid,
    		  smsDirection : smss[i].direction, 
    		  smsFromName : smss[i].from.name,
    		  smsFromCallerID : smss[i].from.callerId,
    		  smsFromCaption : smss[i].from.caption,
    		  smsToNameList : JSON.stringify(smss[i].to.names),
    		  smsToCallerIDList : JSON.stringify(smss[i].to.callerIds),
    		  smsToCaptionList : JSON.stringify(smss[i].to.captions),       
          smsBody : decodedSMS
        };
        
        //  INSERT into SMSLogs DB
        req.app.get('connection').query('INSERT INTO `ebdb`.`SMSLogs` set created = now(), ?', data, function(err) {
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

