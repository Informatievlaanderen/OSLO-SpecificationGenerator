const jsonfile = require('jsonfile')
const fs = require('fs')
const program = require('commander')

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
const options = program.opts()

if (process.argv.length < 3) {
  program.help()
}

concat(options.input, options.language, options.output)
console.log('done')

/* ---- end of the program --- */

function concat (filename, language, outputfilename) {
  console.log('Input: ' + filename)
  console.log('Language: ' + language)
  console.log('Output: ' + outputfilename)

  jsonfile.readFile(filename)
    .then(
      function (myjson) {
        let report = []
        report.push(' REPORT FOR ' + filename + '\n')
        report = find_errors(myjson, language, report, filename)

        fs.writeFile(outputfilename, report.join(''), function (err) {
          if (err) {
            return console.log(err)
          }
          console.log('Write complete; The report was saved to: ' + outputfilename)
        })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function find_errors (json, language, report, filename) {
  for (const key in json) {
    if (!(json[key] === undefined) && json[key] != null && !(json[key][language] === undefined)) {
      report = write_report(json, key, language, report, filename)
    }
    if (!(json[key] === undefined) && typeof json[key] === 'object') {
      find_errors(json[key], language, report, filename)
    }
  }
  return report
}

function write_report (json, key, language, report, filename) {
  if (!(json[key][language] === undefined) && (json[key][language] === 'Enter your translation here')) {
    const line = ` WARNING - (${filename}) for the object with the EA-Guid ${json['EA-Guid']} there is no ${language} translation for the ${key}. \n`
    report.push(line)
  }
  if (!(json[key][language] === undefined) && (json[key][language] === '')) {
    const line = ` WARNING - (${filename}) for the object with the EA-Guid ${json['EA-Guid']} the ${language} translation for ${key} is empty. \n`
    report.push(line)
  }
  if (!(json[key][language] === undefined) && (json[key][language].includes('[UPDATED]'))) {
    const line = ` WARNING - (${filename}) for the object with the EA-Guid ${json['EA-Guid']} the prime language value for ${key} was updated. \n`
    report.push(line)
  }
  return report
}
