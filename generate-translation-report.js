const jsonfile = require('jsonfile')
const fs = require('fs')

var program = require('commander')

program
    .version('1.0.0')
    .usage('node translation-report.js creates a report on the ')
    .option('-i, --input <path>', 'input file to validate (a json file)')
    .option('-l, --language <languagecode>', 'the language that shall be tested (a languagecode)')
    .option('-o, --output <path>', 'output file (a jsonld file)')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ translation-report --help')
    console.log('  $ translation-report -i <input> -l <languagecode> -o <output>')
})


program.parse(process.argv)

concat(program.input, program.language, program.output)
console.log('done')

/* ---- end of the program --- */

function concat(filename, language, outputfilename) {
    console.log('Input: ' + filename)
    console.log('Language: ' + language)
    console.log('Output: ' + outputfilename)

    jsonfile.readFile(filename)
        .then(
            function (myjson) {
                var report = [];
                report.push(" REPORT FOR " + filename + "\n")
                report = find_errors(myjson, language, report)

                fs.writeFile(outputfilename, report.join(""), function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log('Write complete; The report was saved to: ' + outputfilename)
                });
            }
        )
        .catch(error => { console.error(error); process.exitCode = 1 })
}

function find_errors(json, language, report) {
    for (let key in json) {
        if (!(json[key] === undefined) && json[key] != null && !(json[key][language] === undefined)) {
            report = write_report(json, key, language, report)
        }
        if (!(json[key] === undefined) && typeof json[key] == 'object') {
            find_errors(json[key], language, report)
        }
    }
    return report;
}

function write_report(json, key, language, report) {
    if (!(json[key][language] === undefined) && (json[key][language] === 'Enter your translation here')) {
        var line = ` WARNING - for the object with the @id ${json['@id']} there is no ${language} translation for the ${key}. \n`;
        report.push(line)
    }
    if (!(json[key][language] === undefined) && (json[key][language] === '')) {
        var line = ` WARNING - for the object with the @id ${json['@id']} the ${language} translation for ${key} is empty. \n`;
        report.push(line)
    }
    return report
}