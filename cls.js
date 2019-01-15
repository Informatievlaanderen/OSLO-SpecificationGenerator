const fs = require("fs");
const nunjucks = require('nunjucks');
const jsonld = require('jsonld');
const ldParser = require('./linkeddataparser');


nunjucks.configure('views', {
    autoescape: true
});

if(process.argv.length < 5) {
    console.log("Expected usage of this script: ");
    console.log("> node cls.js [JSON-LD FILENAME] [NUNJUCKS TEMPLATE] [OUTPUT HTML] ");
    console.log("\nAn example:");
    console.log("> node cls.js gebouw.jsonld gebouw-voc.j2 gebouw.html");
    console.log("\nRunning the above example will result in an HTML file that contains");
    console.log("the ontology described in gebouw.jsonld and format it using the gebouw-voc.j2");
    console.log("nunjucks template.");
    process.exit(1);
}

var filename = process.argv[2];
var template = process.argv[3];
var output_filename = process.argv[4];
render_template_from_json_ld_file(filename, template, output_filename);

function render_template_from_json_ld_file(filename, templatename, output_filename) {
    var promise = ldParser.parse_ontology_from_json_ld_file(filename);
    promise.then(function(parsed_json){
        var html = nunjucks.render(templatename, parsed_json);
        const data = new Uint8Array(Buffer.from(html));
        fs.writeFile(output_filename, data, (err) => {
            if (err) {
		// Set the exit code if there's a problem so bash sees it
		process.exitCode = 1
                throw err;
            }
            console.log('The file has been saved to ' + output_filename);
        });
    });
}
