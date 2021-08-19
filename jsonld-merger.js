const jsonfile = require('jsonfile')
const program = require('commander')

program
  .version('1.0.0')
  .usage('node jsonld-merger.js merges translation Json with original jsonld')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-m, --mergeinput <path>', 'input of json file to merge with (a json file)')
  .option('-l, --language <languagecode>', 'the language the file shall merge into (languagecode)')
  .option('-o, --output <path>', 'output file (jsonld)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ jsonld-merger --help')
  console.log('  $ jsonld-merger -i <input> -m <mergeinput> -o <output> -l <language>')
  process.exitCode = 1
})

program.parse(process.argv)
const options = program.opts()

render_merged_jsonld(options.input, options.mergeinput, options.output, options.language)
console.log('done')

function render_merged_jsonld (input_filename, languageinput_filename, output_filename, language) {
  console.log('start reading')
  jsonfile.readFile(input_filename)
    .then(
      function (input) {
        jsonfile.readFile(languageinput_filename)
          .then(
            function (languageinput) {
              console.log('start processing')

              const myJson = create_merged_input_file(input, languageinput, language)
              jsonfile.writeFile(output_filename, myJson)
                .then(res => {
                  console.log('Write mergefile complete, saved to: ' + output_filename)
                })
            })
          .catch(error => { console.error(error); process.exitCode = 1 })
      })
    .catch(error => { console.error(error); process.exitCode = 1 })
}

function create_merged_input_file (input, languageinput, goallanguage) {
  console.log('create merged file')
  let myJson = {}
  myJson = input
  myJson.classes = getMergedObjects(input.classes, languageinput.classes)
  myJson.properties = getMergedObjects(input.properties, languageinput.properties)
  myJson.externals = getMergedObjects(input.externals, languageinput.externals)
  myJson.externalproperties = getMergedObjects(input.externalproperties, languageinput.externalproperties)
  if (!(myJson.translation === undefined)) {
    for (let o = 0; o < myJson.translation.length; o++) {
      if (myJson.translation[o].language === goallanguage) {
        myJson = mergeConfigValues(myJson, myJson.translation[o])
      }
    }
  }
  return myJson
}

function mergeConfigValues (myJson, translationObject) {
  for (const [key, value] of Object.entries(translationObject)) {
    if (!(myJson[key] === undefined)) {
      myJson[key] = value
    }
  }
  return myJson
}

// Iterate through array of the input and get the equivalent class in the updated version through their ID,
// Create new class-array for the updated objects
function getMergedObjects (inputArray, languageinputArray) {
  console.log('Checking array...')

  const newArray = []
  for (let i = 0; i < languageinputArray.length; i++) {
    const currObject = languageinputArray[i]
    const elementToCompare = get_matching_object(currObject, inputArray)
    if (elementToCompare != null) {
      const newObject = merge_two_objects(elementToCompare, currObject)
      newArray.push(newObject)
    } // else the element will not be added to the new Array and therefore deleted
  }
  return newArray
}

function merge_two_objects (elementToCompare, currObject) {
  const newObject = elementToCompare
  for (const [key, value] of Object.entries(currObject)) {
    newObject[key] = value
  }

  return newObject
}
function get_matching_object (languageInputObject, inputArray) {
  for (let i = 0; i < inputArray.length; i++) {
    if (inputArray[i].extra['EA-Guid'] === languageInputObject['EA-Guid']) {
      if (inputArray[i].name === languageInputObject.name) {
        return inputArray[i]
      }
    }
  }
  return null
}
