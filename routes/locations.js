var uuid = require('node-uuid');

/* 
 * GET a list of the current Location DB
 */
exports.list = function(req, res) {
  res.app.get('connection').query('SELECT * FROM ebdb.LocationLogs order by logTimestamp desc', function(err, rows) {
    if (err) {
      res.send(err);
    } else {
      // console.log(JSON.stringify(rows));
      res.render('locations', {title: 'Location Log', locations: rows});
  }});
};


/*
 * POST a single Location record
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
      var locations = obj.locations;

      for (var i=0; i < locations.length; i++) {
      
        var data = {  
    		  deviceUUID : deviceUUID,
    		  logTimestamp : logTimestamp,
    		  originalLogFilename : logFilename,
    		  locationTimestamp : locations[i].timestamp,
    		  locationUUID : locations[i].uuid,
    		  latitude : locations[i].latitude, 
    		  longitude : locations[i].longitude
        };
        
        //  INSERT into LocationsLogs DB
        req.app.get('connection').query('INSERT INTO `ebdb`.`LocationLogs` set created = now(), ?', data, function(err) {
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

