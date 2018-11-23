# JS-CRAWL-GZ
=============

Web crawler for Node.JS, both HTTP and HTTPS are supported.

##  Installation

Download/clone project from git.
Run command:

```
npm install js-crawler
```

## Usage

```
node ./index [options] <uri>
```

Options:
*  -f, --filepath <filepath>        The path to file of the list of resources URI
*  -d, --destination <destination>  The destination folder
*  -h, --help                       output usage information

## Results

The result of operation are three file saved in the destination folder if setted or objs foder of the project: 
* image of the recipe;
* html extracted from the page;
* json format of the information extracted.