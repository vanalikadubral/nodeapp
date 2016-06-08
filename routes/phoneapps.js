var uuid = require('node-uuid');

/* 
 * GET a list of the current Phone Apps DB
 */
exports.list = function(req, res) {
  res.app.get('connection').query('SELECT * FROM ebdb.PhoneAppLogs', function(err, rows) {
    if (err) {
      res.send(err);
    } else {
      // console.log(JSON.stringify(rows));
      res.render('phoneapps', {title: 'Phone Apps Log', phoneapps: rows});
  }});
};


/*
 * POST a single Phone Apps record
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
      
	  // Process "Running Apps"
	  var phoneapps = obj.runningApps;
	  insertToDB(phoneapps, "running");

	  // Process "Not-Running Apps"
	  var apps = obj.notRunningApps;
	  insertToDB(phoneapps, "not running");

      function insertToDB(appData, status) {
      
	    for (var i=0; i < appData.length; i++) {
		  var data = {  
			deviceUUID : deviceUUID,
		    logTimestamp : logTimestamp,
		    originalLogFilename : logFilename,
		    appUUID : appData[i].uuid,
	   	  appVersion : appData[i].version, 
		    appName : appData[i].applicationName,
		    appStatus : status
		  };

		  //  INSERT into PhoneAppsLogs DB
		  req.app.get('connection').query('INSERT INTO `ebdb`.`PhoneAppLogs` set created = now(), ?', data, function(err) {
		    if (err) {
			  res.send(err);
			} 
		  }); 
        }     
      };
      //res.redirect('/xxx');
      res.sendStatus(200);
    }
  };
};    

