/**
 * Module dependencies.
 */

var express = require('express')
  , multer = require('multer')
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql')
  , async = require('async')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , serveStatic = require('serve-static')
  , methodOverride = require('method-override')
  , errorHandler = require('errorhandler')
  // ------ Alt Body Parser ------ 
  , bodyParser = require('body-parser');

var routes = require('./routes')
  , user = require('./routes/user')
  , phonecalls = require('./routes/phonecalls')
  , smss = require('./routes/smss')
  , webhistory = require('./routes/webhistory')  
  , locations = require('./routes/locations')    
  , phoneapps = require('./routes/phoneapps')
  , pictures = require('./routes/pictures')   
  , videos = require('./routes/videos')        
  , appusage = require('./routes/appusage')
  , insighttable = require('./routes/insighttable');     
 

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('fileDir', './uploads/');
//------ app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(methodOverride());
app.use(serveStatic(__dirname + 'public'));

//app.use(bodyParser);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set up for file uploads
app.use(multer({ dest: app.get('fileDir')}));

if ('development' == app.get('env')) {
  console.log('Using development settings.');
  app.set('connection', mysql.createConnection({
    host: 'aar92at2ql6gos.cdpulk5eyhp7.us-east-1.rds.amazonaws.com',
    user: 'ebroot',
    port: '3306',
    password: '&<4hAsu.'}));
  app.use(errorHandler());
}

if ('production' == app.get('env')) {
  console.log('Using production settings.');
  app.set('connection', mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT}));
}

function init() {
  //----------------
  // Set up routing
  //----------------  
  // get an instance of router
  var apiRouter = express.Router();

  // GET
  apiRouter.get('/', routes.index);
  apiRouter.get('/users', user.list);
  apiRouter.get('/phonecalls', phonecalls.list);
  apiRouter.get('/smss', smss.list);
  apiRouter.get('/webhistory', webhistory.list);  
  apiRouter.get('/locations', locations.list);
  apiRouter.get('/phoneapps', phoneapps.list);
  apiRouter.get('/pictures', pictures.list);
  apiRouter.get('/videos', videos.list);  
  apiRouter.get('/appusage', appusage.list);    
  //apiRouter.get('/insighttable/convert', insighttable.convert);
  //apiRouter.get('/insighttable/generate', insighttable.generate);
        
  // POST
  apiRouter.post('/add_msgTest', phonecalls.add_msgTest);
  apiRouter.post('/webhistory/fileupload', webhistory.fileupload);  
  apiRouter.post('/phonecalls/fileupload', phonecalls.fileupload);
  apiRouter.post('/smss/fileupload', smss.fileupload);
  apiRouter.post('/locations/fileupload', locations.fileupload);
  apiRouter.post('/phoneapps/fileupload', phoneapps.fileupload);
  apiRouter.post('/pictures/fileupload', pictures.fileupload);
  apiRouter.post('/videos/fileupload', videos.fileupload);
  apiRouter.post('/appusage/fileupload', appusage.fileupload);

  // DEFAULT ROUTE
  // apply the routes to our application (with default prefix)
  app.use('/api/v1', apiRouter);  

  // Start server
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
}

var client = app.get('connection');
async.series([
  function connect(callback) {
    client.connect(callback);
  },
  function clear(callback) {
    client.query('DROP DATABASE IF EXISTS mynode_db', callback);
  },
  function create_db(callback) {
    client.query('CREATE DATABASE mynode_db', callback);
  },
  function use_db(callback) {
    client.query('USE mynode_db', callback);
  },
  function create_table(callback) {
     client.query('CREATE TABLE MSGTESTS (' +
                         'ID VARCHAR(40), ' +
                         'MSGTEST_DATE DATE, ' +
                         'NAME VARCHAR(40), ' +
                         'MSGTEXT VARCHAR(40), ' +
                         'LOCATION VARCHAR(40), ' +
                         'DIRECTION VARCHAR(40), ' +
                         'PRIMARY KEY(ID))', callback);
  },
  function insert_default(callback) {
    var msgTest = {MSGTEST_DATE: new Date(), NAME: 'John Stevens',
          LOCATION: 'Theater', MSGTEXT: 'Come over', DIRECTION:'Out'};
    client.query('INSERT INTO MSGTESTS set ?', msgTest, callback);
  }
], function (err, results) {
  if (err) {
    console.log('Exception initializing database.');
    throw err;
  } else {
    console.log('Database initialization complete.');
    init();
  }
});
