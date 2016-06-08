var uuid = require('node-uuid');
var phantom = require('phantom');

//var aws = require('aws-sdk');
//var credentials = new aws.ShardIniFileCredentials({profile: "S3User"});
//aws.config.credentials = credentials;
//var s3 = new aws.S3();

/*
 * GET (Generate) the Customer Insight Table
 */
exports.generate = function(req, res) {
  var lastInsightDataUpdate;
  // Get last timestamp from Insight Table  
  res.app.get('connection').query('SELECT * FROM ebdb.InsightData order by created desc limit 1', function(err, result) {
    if (err) {
      res.send(err);
    } else {
      // console.log("result: " + result + "  length: " + result.length);
      console.log(">>>>> Evaluating Insight Data Table ... ");                            // ******** DEMO DEMO DEMO *********

      if (typeof result != "undefined" && result != null && result.length > 0) {
        lastInsightDataUpdate = result; 
      } else {
        lastInsightDataUpdate = new Date("1/1/1970");                               // FIX THIS !!!      &&&&&&&&&&&&&&&&&&&&&&&&&&
      }
      // constuct array of brand names
      // Assumption:
      // KeywordDictionary DB has one row per keyword class with the keyword column
      // containing ALL keyword parameters that need to be taken in union during parsing/search.
      res.app.get('connection').query('SELECT * FROM ebdb.KeywordDictionary', function(err, keywordDictionary) {
        if (err) {
          res.send(err);
        } 
        else 
        {
          var keywordCountArray = [];

          console.log(">>>>> Collecting Keywords from Keyword Table ... ");                 // ******** DEMO DEMO DEMO *********

          for (i=0; i < keywordDictionary.length; i++) keywordCountArray[i] = 0;

          // Start the parsing process  
          // Go through each table (i.e., smss, webhistory, etc.)

          // --------------------
          // Process SMS records
          processSMSRecords(req, res, keywordDictionary, keywordCountArray, lastInsightDataUpdate);


          ///////////////////////////////////// keyword data count to DB
          //for (var k in keywordDictionary) {
          //  console.log("K: " + k + "  count: " + keywordCountArray[k]);                    // ******** DEMO DEMO DEMO ********* 
          //}

        }
      });  //  get keywordDictionary
    };  
  });  // get InsightData
}  //  generate


function processSMSRecords(req, res, keywordDictionary,keywordCountArray,lastInsightDataUpdate) 
{
  console.log(">>>>> About to Process SMS Log Data ... ");                                // ******** DEMO DEMO DEMO *********

  req.app.get('connection').query('SELECT * FROM ebdb.SMSLogs where created > ?', lastInsightDataUpdate, function(err, SMSRows) {
    if (err) {
      res.send(err);
    } else {          
      // For each SMS, compare with keyword list and generate count
      ParseDataRows(SMSRows, "smsBody", keywordDictionary, keywordCountArray);

      // Proxcess URL Search datas
      processSearchURLRecords(req, res, keywordDictionary, keywordCountArray, lastInsightDataUpdate);
    }
  });
}

// --------------------
// Process URLHistory
// For each webhistory URL:
//  Where "Search" type, parse URL and generate keyword count
//  if !"Search" type, gparse the webpage and generate keyword count
function processSearchURLRecords(req, res, keywordDictionary,keywordCountArray,lastInsightDataUpdate) 
{

  console.log(">>>>> About to Process Search URLs Log Data ... ");                                // ******** DEMO DEMO DEMO *********

  res.app.get('connection').query('SELECT domainName, URL FROM ebdb.WebHistoryLogs where category = ? and created > ?', ['"Search Engines"', lastInsightDataUpdate], function(err, URLRows) {
    if (err) {
      res.send(err);
    } else {
      var URLstr;
      // For each URL, compare with keyword list and generate count
      for (var i in URLRows) 
      {
        // parse query string of each data row.
        var domain = URLRows[i].domainName.trim();
        domain = domain.replace("www.","");
        domain = domain.replace(".com","");

        //console.log("i = " + i + "  domain trim: " + domain);                
        //console.log("URL: " + URLRows[i].URL);

        var k1, k2;
        switch(domain)
        {
          case "bing":
            k1 = 'q';                                             // Bing stores query parameters as "q=A+B+C..&". Remove the '+'s.
            k2 = '&';
            break;    
          case "google":
            k1 = 'q';                                             // Google stores query parameters as "q=A+B+C...". Remove the '+'s. 
            k2 = '#';
            break;
          case "yahoo":
            k1 = 'p';                                             // Yahoo stores query parameters as "p=A+B+C...&". Remove the '+'s.   
            k2 = '&';                         
            break;
        }
        URLstr = parseQS(URLRows[i].URL, k1, k2);
        if (typeof URLstr != "undefined" && URLstr != null && URLstr.length > 0) {

          URLstr = URLstr.split("+").join(" ");                                             

          // Go through the ENTIRE keyword dictionary
          for (var j in keywordDictionary) {
            // For each keyword class, get the keyword string to match (keywords that occur together)
            var keywordsToSearch = [];
            keywordsToSearch = keywordDictionary[j].keywordList.split(",");                  // CSV of keyword search parameters
     
            // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
            // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues

            //console.log(URLstr + "    <<<>>>>   " + keywordsToSearch);                        // ******** DEMO DEMO DEMO ********* 

            if (CheckForMatch(URLstr, keywordsToSearch)) keywordCountArray[j]++;            
          }    
        }    
      }  // for URLRows
      processWebPages(req, res, keywordDictionary, keywordCountArray, lastInsightDataUpdate);
    }
  });
}


function processWebPages(req, res, keywordDictionary, keywordCountArray, lastInsightDataUpdate)
{
  console.log(">>>>> About to Process Webpage Log Data ... ");                                // ******** DEMO DEMO DEMO *********
  // --------------------
  // Process URLHistory
  // For each webhistory URL:
  //  Where !"Search" type, gparse the webpage and generate keyword count
  res.app.get('connection').query('SELECT * FROM ebdb.WebHistoryLogs where category <> ? and created > ?', ['"Search Engine"', lastInsightDataUpdate], function(err, URLRows) {
    if (err) {
      res.send(err);
    } 
    else 
    {
      var phantom = require('phantom');
      phantom.create(function(ph) {
        return ph.createPage(function(page) {    // return


          var URLRows = [];
          //URLRows.push("http://arbys.com");
          URLRows.push("https://www.gibsonssteakhouse.com/dinner-menu-pages-332.php");
          //URLRows.push("http://tilomitra.com/repository/screenscrape/ajax.html");
          //URLRows.push("http://en.wikipedia.org/wiki/London");
          //URLRows.push("http://www.westchestermagazine.com/Blogs/Eat-Drink-Post/July-2014/5-Obscure-Beers-From-Half-Time-in-Mamaroneck/");
          //URLRows.push("http://www.chilis.com/EN/Pages/home.aspx");


          // For each URL, compare with keyword list and generate count
          for (var i in URLRows) {
            // parse query string of each data row.
            //^^^^^^^^^^^^^^^^^^^^^^^var URLstr = URLRows[i].URL; 
            var URLstr = URLRows[i];  
            console.log("URLs: " + URLRows.length + " URL[" + i + "]  " + URLstr);                                       // ******** DEMO DEMO DEMO *********

            // --------------------
            // Parse Web page
            OpenAndParsePage(page, URLstr, keywordDictionary, keywordCountArray);

            console.log("RETURNED");

          }   // for URLRows

        });   // ph.createPage
      });   // phantom.create
    }
  });   // app.get.query
}   // processWebPages


function OpenAndParsePage(page, URLstr, keywordDictionary, keywordCountArray) 
{
  return page.open(URLstr, function(status) {        // return
    console.log("opened site? ", status);                                                           // ******** DEMO DEMO DEMO ********* 

      page.injectJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function() {
        //jQuery Loaded.
        //Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
        setTimeout(function() {
            return page.evaluate(function() {        // return

                // A good way is to populate an object with all the jQuery commands that you need and then return the object.
                var pArr = [],
                    h1Arr = [],
                    h2Arr = [],
                    h3Arr = [],
                    h4Arr = [],
                    h5Arr = [],
                    tdArr = [],
                    divArr = [];
                $('p').each(function() {
                  pArr.push($(this).html());
                });
                $('h1').each(function() {
                  h1Arr.push($(this).html());
                });
                $('h2').each(function() {
                  h2Arr.push($(this).html());
                });
                $('h2').each(function() {
                  h2Arr.push($(this).html());
                });
                $('h3').each(function() {
                  h3Arr.push($(this).html());
                });
                $('td').each(function() {
                  tdArr.push($(this).html());
                });
                $('div').each(function() {
                  divArr.push($(this).html());
                });
                return {p: pArr, h1: h1Arr, h2: h2Arr, h3: h3Arr, td: tdArr, div: divArr};
            }, function(resultStr) {
                console.log(resultStr);                                                          // ******** DEMO DEMO DEMO ********* 

                var str;  
                // Go through the ENTIRE keyword dictionary 
                for (var j in keywordDictionary) {

                  console.log("J: " + j + "  list: " + keywordDictionary[j].keywordList);     // ******** DEMO DEMO DEMO ********* 

                  // For each keyword class, get the keyword string to match (keywords that occur together)
                  var keywordsToSearch = [];
                  keywordsToSearch = keywordDictionary[j].keywordList.split(",");                  // CSV of keyword search parameters

                  for (var m in resultStr.p) {
                    str = resultStr.p[m];
                    // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
                    // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues
                    if (CheckForMatch(str, keywordsToSearch)) keywordCountArray[j]++;            
                  }
                  for (m in resultStr.h1) {
                    str = resultStr.h1[m];
                    // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
                    // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues
                    if (CheckForMatch(str, keywordsToSearch)) keywordCountArray[j]++;            
                  }
                  for (m in resultStr.h2) {
                    str = resultStr.h2[m];
                    // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
                    // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues
                    if (CheckForMatch(str, keywordsToSearch)) keywordCountArray[j]++;            
                  }
                  /*
                  for (m in resultStr.h3) {
                    str = h3[m];
                    // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
                    // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues
                    if (CheckForMatch(str, keywordsToSearch)) keywordCountArray[j]++;            
                  }*/
                  for (m in resultStr.td) {
                    str = resultStr.td[m];
                    // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
                    // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues
                    if (CheckForMatch(str, keywordsToSearch)) keywordCountArray[j]++;            
                  }
                  for (m in resultStr.div) {
                    str = resultStr.div[m];
                    // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
                    // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues
                    if (CheckForMatch(str, keywordsToSearch)) keywordCountArray[j]++;            
                  }
                }  // for keywordDictionary

          ///////////////////////////////////// keyword data count to DB
          for (var m in keywordDictionary) {
            console.log("m: " + m + "  count: " + keywordCountArray[m]);                    // ******** DEMO DEMO DEMO ********* 
          }

            });   // page.evaluate
        }, 5000);   // setTimeout
      });   // injectJS
  });   // page.open
}






// Parses rows of mobile data and matches against the keyword dictionary
// Counts are stored in the keywordCountArray
function ParseDataRows(dataRows, propertyName, keywordDictionary, keywordCountArray)
{
  // For each URL, compare with keyword list and generate count
  for (var i in dataRows) {
    // Go through the ENTIRE keyword dictionary
    for (var j in keywordDictionary) {
      // For each keyword class, get the keyword string to match (keywords that occur together)
      var keywordsToSearch = [];
      keywordsToSearch = keywordDictionary[j].keywordList.split(",");                 // CSV of keyword search parameters
 
      var str = dataRows[i][propertyName];
      // if ((new RegExp("\\b" + keywordDictionary[i] + "\\b", "i").test(str))) {         // ....  Option 1: exact match         
      // if (str.search(/keywordDictionary[i]/i) != -1) {                                 // ....  Option 2: (Regex also) may also encounter special chars issues
      if (CheckForMatch(str, keywordsToSearch)) keywordCountArray[j]++;            
    }
  }
};

// Parse query string
function parseQS(qs, key, splitKey)
{
  var vars = [], hash;
  var hashes = qs.substring(qs.indexOf('?')+1).split(splitKey);

  for (var i = 0; i < hashes.length; i++)
  {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
  }
  return vars[key];
};

// This is the main keyword matching routine. The current routine matches one keywords in keyword string
// (i.e., it checks for existence of 1 of the keyword search parameters).
// We need to modify this in future to deal with:
// 1) a precedence ordering of the keyword parameters within a keyword name row.
// 2) need to deal with keyword search pairs and keyword search syntax (e.g., "beer -house")
//
function CheckForMatch(str, keywordsToSearch)
{
  for (var j in keywordsToSearch)
  {
    keywordsToSearch[j].replace('+','');                                                  //  Remove "+" for now. FIX THIS  &&&&&&&&&&&&&&&&&&&&&&&&&&
    if (str.toLowerCase().indexOf(keywordsToSearch[j].toLowerCase()) > -1) {

      console.log("keyword match: " + keywordsToSearch[j]);                               // ******** DEMO DEMO DEMO *********
      return true;
    }
  }    
  return false;
}
 
 
//========================================================
// === One time conversion to decoded base64 in SMS body
//
exports.convert = function(req, res) {
  console.log('here');
  res.app.get('connection').query('SELECT * FROM ebdb.SMSLogs', function(err, SMSLogsRows) {
	if (err) {
  	res.send(err);
	} else {
  	console.log('Got rows');
    //console.log(JSON.stringify(SMSLogsRows));  	
  	for (var i in SMSLogsRows) {
  	    console.log(SMSLogsRows[i].id);
    	var smsBodyDecode = new Buffer(SMSLogsRows[i].smsBody, 'base64').toString('ascii');
    	res.app.get('connection').query('UPDATE ebdb.SMSLogs SET smsBody = ? WHERE id = ?', [smsBodyDecode, SMSLogsRows[i].id], function (err, result) {
      	if (err) {
        	res.send(err);
      	} else {
        	console.log(result);
    	}});   	 
  	};
  }});  
}

