var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
const opn = require('opn');
var http = require('http');
var https = require('https');
const fs = require('fs');
// Param config
var FROM_FILE = false;
var RECURSIVE = false;
var MAX_PAGES_TO_VISIT = 10;
var PATH_FILE = undefined;

var START_URL = "https://ricette.giallozafferano.it/Torta-con-crema-al-limone.html";
var PAGE_NAME = START_URL.substring(START_URL.lastIndexOf('/')+1, START_URL.lastIndexOf('.'));
var SEARCH_WORD = "Bosso";
var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var FileReader = require('filereader');
//var baseUrl = url.protocol + "//" + url.hostname;
var baseUrl =  "http://web.tiscali.it/chuck/html/"
pagesToVisit.push(START_URL);
checkParameter();
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
    obj.url = url;

    manipulateBodyGZ($);
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
function manipulateBodyGZ ($){
  //obj.ingredienti = $('div[class=ingredienti]').html();
  $('div[class=top-adsense]').replaceWith('');
  $('div[class=strip-mobile]').replaceWith('');
  $('div[class=static-container]').replaceWith('');
  $('nav').replaceWith('');
  $('script').replaceWith('');
  $('div[id=nextitem]').replaceWith('');
  $('div[id=secnav]').replaceWith('');
  obj.title = $('header h1[class=fn]').text();
  $('header').replaceWith('');
  obj.img = $('figure[id=cover] img[class=photo]').attr('src');
  var file = fs.createWriteStream("objs/" + obj.img.substring(obj.img.lastIndexOf("/")+1));
  https.get(obj.img, function(response) {
    response.pipe(file);
  });
  obj.difficolta = $('ul[id=rInfos] li[class=difficolta] strong').text();
  obj.preptime = $('ul[id=rInfos] li[class=preptime] strong').text();
  obj.cooktime = $('ul[id=rInfos] li[class=cooktime] strong').text();
  obj.yield = $('ul[id=rInfos] li[class=yield] strong').text();
  obj.costo = $('ul[id=rInfos] li[class=costo] strong').text();
  obj.ingredienti = {};
  $('div[class=ingredienti] dl').each(function(){
    var key = $(this).find('h2[class=title-ingredienti]').text().replace(/\s/g, '_');
    obj.ingredienti[key] = [];
    $(this).find('dd').each(function(){
      var kk = $(this).text().trim().replace(/\t/g,'');
      kk = kk.replace(/\n/g,' ');
      obj.ingredienti[key].push(kk);
    });
  });
  $('div[class=clear]').replaceWith('');
  $('div[class=shares]').replaceWith('');
  $('div[class=ingredienti]').replaceWith('');
  $('div[class=intro]').replaceWith('');
  var sez = $.html().split('<h2 class="sez">');
  for (var i = 1; i < sez.length-2; i++) {
    var key = $('span',undefined, sez[i]).text().trim().replace(/\s/g,'_').replace(/\n/g,'').replace(/\t/g,'');
    var value = $(sez[i]).text().trim().replace(/\t/g,'')
    obj[key] = value;
  }
  fs.writeFile('objs/'+PAGE_NAME+'.txt', JSON.stringify(obj), 'utf8', (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
  var all = $('div[id=page]').html().trim().replace(/\t/g, '');
  fs.writeFile('objs/'+PAGE_NAME+'.html', all, 'utf8', (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
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

function checkParameter(){
//  process.argv.forEach(function (val, index, array) {
//    console.log(index + ': ' + val);
//  });
  if (process.argv.indexOf('-f') > -1) {
        console.log('-f index : '+process.argv.indexOf('-f') + ' - ' + process.argv[process.argv.indexOf('-f')]);
        PATH_FILE = process.argv[process.argv.indexOf('-f') +1];
        if (PATH_FILE == undefined) {
          throw '-f argument require a path to file containing suorce list';
        }

  }
}
