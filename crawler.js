const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const opn = require('opn');
var pageToVisit = "https://ricette.giallozafferano.it/Crema-al-caffe.html";
console.log("Visiting page " + pageToVisit);
request(pageToVisit, function(error, response, body) {
   if(error) {
     console.log("Error: " + error);
   }
   // Check status code (200 is HTTP OK)
   console.log("Status code: " + response.statusCode);
   if(response.statusCode === 200) {
     // Parse the document body
     var $ = cheerio.load(body);
     var ingredienti = $('.ingredienti .fs').children('.ingredient');
     console.log(ingredienti.length);
     console.log("Page title:  " + $('title').text());

     console.log('is there caff? ' + searchForWord($,'caff'));
     collectInternalLinks($);
     opn(pageToVisit);
   }
});

function searchForWord($, word) {
  var bodyText = $('html > body').text();
  if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
    return true;
  }
  return false;
}
function collectInternalLinks($) {
  var allRelativeLinks = [];
  var allAbsoluteLinks = [];

  var relativeLinks = $("a[href^='/']");
  relativeLinks.each(function() {
      allRelativeLinks.push($(this).attr('href'));

  });

  var absoluteLinks = $("a[href^='http']");
  absoluteLinks.each(function() {
      allAbsoluteLinks.push($(this).attr('href'));
  });

  console.log("Found " + allRelativeLinks.length + " relative links");
  console.log("Found " + allAbsoluteLinks.length + " absolute links");
}
