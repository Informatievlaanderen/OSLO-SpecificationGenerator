const fs = require("fs");
const jsonfile = require('jsonfile');
const jsonld = require('jsonld');
const nunjucks = require('nunjucks');
const ldParser = require('./linkeddataparser2');


var program = require('commander');
 
program
  .version('0.8.0')
  .usage('node html-generator.js creates html pages for jsonld files ')
  .option('-s, --style <target>', 'target style html forms. One of {voc,ap, oj}', /^(voc|ap|oj|all)$/i)
  .option('-t, --template <template>', 'html template to render')
  .option('-d, --templatedir [directory]', 'the directory containing all templates')
  .option('-r, --documentpath <path>', 'the document path on which the html is published')
  .option('-x, --debug <path>', 'the intermediate json which will be used by the templaterenderer')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the html file)')

program.on('--help', function(){
  console.log('')
  console.log('Examples:');
  console.log('  $ html-generator --help');
  console.log('  $ html-generator -s <target> -t <template> -i <input> -o <output>');
});

program.parse(process.argv);

var templatedir = program.templatedir || '/app/views';
nunjucks.configure(templatedir , {
    autoescape: true
});

render_html_from_json_ld_file(program.style, program.template, program.input, program.output);
console.log('done');



function render_html_from_json_ld_file(target, template, filename, output_filename) {
  console.log('start reading');
  var obj = {};
  jsonfile.readFile(filename)
  .then(
       function(obj) { 
        console.log('start processing');
        var promise = {};
        switch(target) {
            case "voc": 
                promise = ldParser.parse_ontology_from_json_ld_file_voc(filename);
                break;
            case "ap": 
                promise = ldParser.parse_ontology_from_json_ld_file_all(filename);
                break;
            case "all": 
                promise = ldParser.parse_ontology_from_json_ld_file_all(filename);
                break;
            case "oj": 
                promise = ldParser.parse_ontology_from_json_ld_file_oj(filename);
                break;
            default:
                console.log("unknown or not provided target for the html rendering");
        };

        promise.then(function(parsed_json) {
          parsed_json.documentroot = program.documentpath;
          if (program.debug) { 
		jsonfile.writeFile(program.debug, parsed_json, function (err) {
		if (err) {
		   process.exitCode = 1;
                   console.error(err);
                   throw err;
                   }
		})};
          var html = nunjucks.render(template, parsed_json);
          const data = new Uint8Array(Buffer.from(html));

          console.log('start writing');
          fs.writeFile(output_filename, data, (err) => {
            if (err) {
		        // Set the exit code if there's a problem so bash sees it
		        process.exitCode = 1
                throw err;
            }
            console.log('The file has been saved to ' + output_filename);
            });

          });
         })
	.catch(error => { console.error(error); process.exitCode = 1; } ) 
}


