var uuid = require('node-uuid');
var aws = require('aws-sdk');

var credentials = new aws.SharedIniFileCredentials({profile: "S3User"});
aws.config.credentials = credentials;

var s3 = new aws.S3();

/* 
 * GET a list of the current Videos DB
 */
exports.list = function(req, res) {
  res.app.get('connection').query('SELECT * FROM ebdb.VideoLogs order by logTimestamp desc', function(err, rows) {
    if (err) {
      res.send(err);
    } else {
      // console.log(JSON.stringify(rows));
      res.render('videos', {title: 'Videos Log', videos: rows});
  }});
};


/*
 * POST a single video record
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
 * POST a video file
 */
exports.fileupload = function(req, res) {
  // Parse the file name and get deviceUUID and logTimestamp
  var logOriginalFilename = req.files.azureDataFile.originalname;
  var logFilename = req.files.azureDataFile.name;
  var logFileParams = logOriginalFilename.split("_");
  var deviceUUID = logFileParams[0];
  var logTimestamp = logFileParams[2];

  var data = {  
    deviceUUID : deviceUUID,
    logTimestamp : logTimestamp,
    originalFilename : logOriginalFilename,
    logFilename: logFilename
  };

  //  INSERT into video log DB
  req.app.get('connection').query('INSERT INTO `ebdb`.`VideoLogs` set created = now(), ?', data, function(err) {
    if (err) {
	  res.send(err);
    } else {

	  var params = {
		Bucket: 'elasticbeanstalk-us-east-1-637141817247/data/videos',
		Key: logFilename,
		Body: req.app.get('fileDir') + logFilename,
	  };
  
	  s3.putObject(params, function (err, res) {
		if (err) {
		  console.log("Error uploading file: ", err);
		  res.send(err);
		} else {
		  console.log("Successfully uploaded data"); 
		}
	  });    
    }
  });
  res.sendStatus(200);
};

