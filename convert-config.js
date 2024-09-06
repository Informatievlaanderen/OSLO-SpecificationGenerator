const { program } = require('commander')
const fs = require('node:fs')

program.usage('node convert-config.js converts a multi-language config file to a single-language config file')
  .requiredOption('-i, --input <path>', 'input file to convert (a json file)')
  .requiredOption('-l, --language <languagecode>', 'the language that shall be converted to (a languagecode)')
  .requiredOption('-o, --output <path>', 'output file to write the converted config to (a json file)')
  .on('--help', function () {
    console.log('Examples:')
    console.log('  $ node convert-config.js -i <input> -l <languagecode>')
  })

program.parse(process.argv)
const options = program.opts()

convertConfig(options)

function convertConfig (options) {
  console.log('start converting config file')
  const jsonObject = readJson(options.input)
  const convertedJsonObject = convertJson(jsonObject, options)
  writeJson(options.output, convertedJsonObject)
}

function convertJson (jsonObject, options) {
  // Loop over json object and convert certain values
  for (const key in jsonObject) {
    if (typeof jsonObject[key] === 'object' && options.language in jsonObject[key]) {
      jsonObject[key] = jsonObject[key][options.language]
    } else if (Array.isArray(jsonObject[key])) {
      // Case 3: Converts all elements in an array
      for (const element of jsonObject[key]) {
        element.name = element.name[options.language]
      }
    } else if (typeof jsonObject[key] === 'object' && 'name' in jsonObject[key]) {
      // Case 4: Converts the name of an object
      jsonObject[key].name = jsonObject[key].name[options.language]
    }
  }
  return jsonObject
}

function readJson (path) {
  const jsonString = fs.readFileSync(path)
  return JSON.parse(jsonString)
}

function writeJson (path, jsonObject) {
  fs.writeFileSync(path, JSON.stringify(jsonObject, null, 2))
}
