var uuid = require('node-uuid');

/*
 * GET a list of the current AppUsage DB
 */
exports.list = function(req, res) {
  res.app.get('connection').query('SELECT * FROM ebdb.AppUsageLogs order by logTimestamp desc', function(err, rows) {
    if (err) {
      res.send(err);
    } else {
      // console.log(JSON.stringify(rows));
      res.render('appusage', {title: 'App Usage Log', appusage: rows});     // ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]
  }});
};


/*
 * POST a single AppUsage record
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
      var appUsage = obj.appstat;

      if (appUsage.length > 0) 
      {
        //console.log("START  " + obj.appUsagestartTime);
        //console.log("END   " + obj.appUsageEndTime);
        //console.log("File not empty " + appUsage.length);

        for (var i=0; i < appUsage.length; i++) {
        
          var data = {  
            deviceUUID : deviceUUID,
            logTimestamp : logTimestamp,
            originalLogFilename : logFilename,
            appUsageStartTime: strToDateTime(obj.appUsagestartTime),
            appUsageEndTime: strToDateTime(obj.appUsageEndTime),
            appUsageAppName: appUsage[i].appName,
            appUsagePackageName: appUsage[i].packageName,
            appUsageAppUsage: appUsage[i].appUsage
          };

          //console.log("data  " + data);
         
          //  INSERT into SMSLogs DB
          req.app.get('connection').query('INSERT INTO `ebdb`.`AppUsageLogs` set created = now(), ?', data, function(err) {
            if (err) {
              //console.log("DB insert error");
              res.send(err);
            } 
          });
        }
        //res.redirect('/xxx');
        res.sendStatus(200);

      } else {

        //console.log("send Bad Request error  ");
        res.send(400);
      }
    }
  };
};    


/*
 * Helpers
 */

function strToDateTime(dateStr)
{
  var year = dateStr.substring(0, 4);
  var month = dateStr.substring(4, 6);
  var day = dateStr.substring(6, 8);
  var hour = dateStr.substring(8, 10);
  var minute = dateStr.substring(10, 12);
  var second = "00";
  return new Date(year, month-1, day, hour, minute, second);
}





