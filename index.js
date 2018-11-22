#!/usr/bin/env node
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
const opn = require('opn');
var http = require('http');
var https = require('https');
const fs = require('fs');
var DIR_NAME = __dirname + '/objs/';
// Param config
var FROM_FILE = false;
var RECURSIVE = false;
var MAX_PAGES_TO_VISIT = 10;
var PATH_FILE = undefined;
var PAGE_NAME = "test";
var SEARCH_WORD = "Bosso";
var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var baseUrl =  "http://web.tiscali.it/chuck/html/"
var obj = {};
checkParameter();
function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT || pagesToVisit.length == 0) {
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
    // Check for error
    if(error) {
      console.error(error);
      callback();
      return;
    }
    // Parse the document body
    var $ = cheerio.load(body);
    obj.url = url;

    manipulateBodyGZ($);
    callback();
  });

}
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
function cleanPage ($){
  //obj.ingredienti = $('div[class=ingredienti]').html();
  $('div[class=top-adsense]').replaceWith('');
  $('div[class=strip-mobile]').replaceWith('');
  $('div[class=static-container]').replaceWith('');
  $('nav').replaceWith('');
  $('script').replaceWith('');
  $('div[id=nextitem]').replaceWith('');
  $('div[id=secnav]').replaceWith('');
}
function manipulateBodyGZ ($){
  cleanPage($);
  obj.id = PAGE_NAME = obj.url.substring(obj.url.lastIndexOf('/')+1, obj.url.lastIndexOf('.'));
  obj.title = $('header h1[class=fn]').text();
  $('header').replaceWith('');
  obj.img = $('figure[id=cover] img[class=photo]').attr('src');
  var file = fs.createWriteStream(DIR_NAME + PAGE_NAME + obj.img.substring(obj.img.lastIndexOf(".")+1));
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

  fs.writeFile(DIR_NAME + PAGE_NAME+'.txt', JSON.stringify(obj), 'utf8', (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
  var all = $('div[id=page]').html().trim().replace(/\t/g, '');
  fs.writeFile(DIR_NAME + PAGE_NAME+'.html', all, 'utf8', (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
}
function collectInternalLinks($) {
    var relativeLinks = $("a[href^='../']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.unshift(baseUrl + $(this).attr('href'));
    });
}

function checkParameter(){

  var program = require('commander');
  program
  .arguments('[url]')
  .option('-f, --filepath <filepath>', 'The path to file of the list of resources')
  .option('-d, --destination <destination>', 'The destination folder')
  .action(function(file) {
    console.log('filepath: %s destination: %s file: %s',
      program.filepath, program.destination, file);
  })
  .parse(process.argv);
  if (program.filepath) {
    var data = fs.readFileSync(program.filepath, 'utf8');
    var list = data.split(/[\r\n\,]+/);
    for(var i = 0 ; i < list.length; i++){
      if(list[i]) pagesToVisit.push(list[i]);
    }
    FROM_FILE = true;
  }
  if (program.destination) {
    DIR_NAME = program.destination;
  }
  //START CRAWLING AFTER READ ARGUMENT
  if(program.args[0]) pagesToVisit.push(program.args[0]);
  crawl();
}
