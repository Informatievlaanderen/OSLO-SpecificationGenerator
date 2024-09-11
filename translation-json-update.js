const jsonfile = require('jsonfile')
const program = require('commander')
const translationlib = require('./translation-json-lib')

program
  .version('2.0.0')
  .usage('node translation-json-update.js merges the input file with the file containing the translations for the chosen prime and goal language')
  .option('-i, --input <path>', 'base file which content will be extended with the translations (oslo internal format) ')
  .option('-f, --translationFile <path>', 'the translations for the input')
  .option('-o, --output <path>', 'the merged file obtained by combining the input file with the translations (oslo internal format)')
  .option('-m, --primeLanguage <language>', 'prime language in which the input is provided (a string)')
  .option('-g, --goalLanguage <language>', 'goal language corresponding the translations (a string)')
  .option('-u, --no-update', 'update the translations values with indications of change (per default true)')
  .option('-p, --prefix <prefix>', 'prefix for the logging')

program.on('--help', function () {
  console.log('')
  console.log('It is expected that the translation file contains the same prime language as the input file')
  console.log('Examples:')
  console.log('  $ translation-json-update --help')
  console.log('  $ translation-json-update -i <input> -f <translations> -m <primeLanguage> -g <goalLanguage> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

render_updated_file_from_json_ld_file(options.input, options.primeLanguage, options.goalLanguage, options.translationFile, options.output, options.prefix)

console.log(options.prefix + 'done')

/* ---- end of the program --- */

function render_updated_file_from_json_ld_file (inputfilename, primeLanguage, goalLanguage, translationFilename, outputfilename, prefix) {
  console.log(prefix + 'start reading')

  // read out both files to compare
  jsonfile.readFile(inputfilename)
    .then(
      function (input) {
        jsonfile.readFile(translationFilename)
          .then(
            function (translation) {
              console.log(prefix + 'start processing')

              const output = translationlib.mergefiles(translationlib.empty_object(input), translation, primeLanguage, goalLanguage)

              jsonfile.writeFile(outputfilename, output)
                .then(res => {
                  console.log(prefix + 'Write complete; The original file was updated to: ' + outputfilename)
                })
                .catch(error => { console.error(error); process.exitCode = 1 })
            }
          )
          .catch(error => { console.error(error); process.exitCode = 1 })
      }
    )
    .catch(error => { console.error(error); process.exitCode = 1 })
}
