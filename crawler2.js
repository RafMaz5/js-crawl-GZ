var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
const opn = require('opn');
var http = require('http');
const fs = require('fs');
var START_URL = "http://web.tiscali.it/chuck/html/m_schede.htm";
var SEARCH_WORD = "Bosso";
var MAX_PAGES_TO_VISIT = 100;
var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var FileReader = require('filereader');
//var baseUrl = url.protocol + "//" + url.hostname;
var baseUrl =  "http://web.tiscali.it/chuck/html/"
pagesToVisit.push(START_URL);
crawl();

function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}
var foundedLink = 0;
function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     // Parse the document body
     var $ = cheerio.load(body);
     var isWordFound = searchForWord($, SEARCH_WORD);
     if(isWordFound) {
      foundedLink++;
      if (foundedLink>1) {
        console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
        //opn(url);

        obj.url = url;
        manipulateBody($);
      }
      collectInternalLinks($);
      // In this short program, our callback is just calling crawl()
      callback();
     } else {
       collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
     }
  });

}
var month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var obj = {};

// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

function firstStepFind($, firstStep){
  firstStep.find("small").each(function(i, elem) {
    var key = $(this).find("strong").text().trim();
    obj[key] = $(this).text().trim().split(":")[1];
  });
}

function manipulateBody ($){
  var table = $("table").eq(0);
  var info = table.find("tr").eq(0).find("td").eq(0);
  var imgUrl = baseUrl + info.find("img").attr("src");
  var firstStep= info.find("font");
  table = $("table").eq(1);
  obj.nome = table.find("tr").eq(0).find("td").eq(0).text();
  obj.immagine = "objs/" + imgUrl.substring(imgUrl.lastIndexOf("/")+1);
  var file = fs.createWriteStream(obj.immagine);
  http.get(imgUrl, function(response) {
    response.pipe(file);
  });
  firstStepFind($, firstStep);
  obj.rinvaso = [];
  table.find("tr").eq(1).find("td").each(function(i, elem) {
    if($(this).find("img").attr("src")) {
      obj.rinvaso.push(month[i-1]);
    }
  });
  obj.irrigazione = [];
  table.find("tr").eq(2).find("td").each(function(i, elem) {
    if($(this).find("img").attr("alt")) {
      obj.irrigazione.push($(this).find("img").attr("alt").split('.')[0]);
    }
  });
  obj.potatura = [];
  table.find("tr").eq(3).find("td").each(function(i, elem) {
    if($(this).find("img").attr("src")) {
      obj.potatura.push(month[i-1]);
    }
  });
  obj.taglioGermogli = [];
  table.find("tr").eq(4).find("td").each(function(i, elem) {
    if($(this).find("img").attr("alt")) {
      obj.taglioGermogli.push(month[i-1] + " - " + $(this).find("img").attr("alt").split('.')[0]);
    }
  });
  obj.filo = [];
  table.find("tr").eq(5).find("td").each(function(i, elem) {
    if($(this).find("img").attr("alt")) {
      obj.filo.push(month[i-1] + " - " + $(this).find("img").attr("alt").split('.')[0]);
    }
  });
  obj.defogliazione = [];
  table.find("tr").eq(6).find("td").each(function(i, elem) {
    if($(this).find("img").attr("alt")) {
      obj.defogliazione.push(month[i-1] + " - " + $(this).find("img").attr("alt").split('.')[0]);
    }
  });
  obj.esposizione = [];
  table.find("tr").eq(7).find("td").each(function(i, elem) {
    if($(this).find("img").attr("alt")) {
      obj.esposizione.push(month[i-1] + " - " + $(this).find("img").attr("alt").split('.')[0]);
    }
  });
  obj.concimazione = [];
  table.find("tr").eq(8).find("td").each(function(i, elem) {
    if($(this).find("img").attr("alt")) {
      obj.concimazione.push(month[i-1] + " - " + $(this).find("img").attr("alt").split('.')[0]);
    }
  });


  //console.log(table.find("tr").eq(1).find("img").attr("src"));
  if (obj.nome) {
    fs.writeFile('objs/' + obj.nome + '.txt', JSON.stringify(obj), 'utf8', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  }
}
function searchForWord($, word) {
  var bodyText = $('html > body').text().toLowerCase();
  return(bodyText.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='../']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.unshift(baseUrl + $(this).attr('href'));
    });
}
