const fs = require('fs')
const jsonfile = require('jsonfile')

var program = require('commander')

program
    .version('1.0.0')
    .usage('node concat-files.js creates a json-ld context')
    .option('-i, --input <path>', 'input file to update (a jsonld file)')
    .option('-c, --concatfile <path>', 'file to concat to the input (a json/jsonld file)')
    .option('-o, --output <path>', 'output file (a jsonld file)')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ concat-files --help')
    console.log('  $ concat-files -i <input> -c <concatfile> -o <output>')
})

program.parse(process.argv)

concat(program.input, program.concatfile, program.output)
console.log('done')

/* ---- end of the program --- */

function concat(filename1, filename2, outputfilename) {
    console.log('Input: ' + filename1)
    console.log('Concatfile: ' + filename2)
    console.log('Output: ' + outputfilename)

    jsonfile.readFile(filename1)
        .then(
            function (myjson) {
                if (!(filename2 === undefined) && fs.existsSync(filename2)) {
                    jsonfile.readFile(filename2)
                        .then(
                            function (secondone) {
                                console.log('start processing')

                                for (let [key, value] of Object.entries(secondone)) {
                                    myjson[key] = new Object
                                    myjson[key] = value
                                }

                                jsonfile.writeFile(outputfilename, myjson)
                                    .then(res => {
                                        console.log('Write complete; The new file was saved to: ' + outputfilename)
                                    })
                                    .catch(error => { console.error(error); process.exitCode = 1 })

                            }
                        )
                        .catch(error => { console.error(error); process.exitCode = 1 })
                }
                else {
                    console.log(filename2 + " does not exist, no changes made")
                }
            }
        )
        .catch(error => { console.error(error); process.exitCode = 1 })
}