var uuid = require('node-uuid');

/* 
 * GET a list of the current Web History DB
 */
exports.list = function(req, res) {
  res.app.get('connection').query('SELECT * FROM ebdb.WebHistoryLogs order by logTimestamp desc', function(err, rows) {
    if (err) {
      res.send(err);
    } else {
      // console.log(JSON.stringify(rows));
      res.render('webhistory', {title: 'Web History Log', urls: rows});
  }});
};


/*
 * POST a single Web History record
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
 * POST a Web History log file
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
      var urls = obj.webHistory;

      for (var i=0; i < urls.length; i++) {
      
        var data = {  
    		  deviceUUID : deviceUUID,
    		  logTimestamp : logTimestamp,
    		  originalLogFilename : logFilename,
    		  webUUID : urls[i].uuid,
    		  accessTime : urls[i].timestamp,		  
    		  domainName : urls[i].domainName,
    		  URLStatus : urls[i].status,
    		  URL : urls[i].url,
    		  category : JSON.stringify(urls[i].category),
    		  blockedKeyword : urls[i].blockedKeyword
        };
        
        //  INSERT into URLLogs DB
        req.app.get('connection').query('INSERT INTO `ebdb`.`WebHistoryLogs` set created = now(), ?', data, function(err) {
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

