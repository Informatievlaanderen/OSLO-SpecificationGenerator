const jsonfile = require('jsonfile')
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
var program = require('commander')

var endpoint = "https://api.cognitive.microsofttranslator.com";

program
  .version('0.0.1')
  .usage('node render-machine-translation.js creates a translation of a jsonld file based on existing values')
  .option('-i, --input <path>', 'input file to validate (a jsonld file)')
  .option('-g, --goalLanguage <languagecode>', 'the language that shall be translated to (a languagecode)')
  .option('-m, --mainLanguage <languagecode>', 'the language that shall be translated from (a languagecode)')
  .option('-o, --output <path>', 'output file (a jsonld file)')
  .option('-s, --subscriptionKey <key-string>', 'Subscriptionkey for Azure Cognitive Services (a String)')
  .option('-l, --location <geographic area>', 'your area/location/region (a region of the world)')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ render-machine-translation --help')
  console.log('  $ render-machine-translation -i <input> -g <languagecode> -m <languagecode> -o <output> -s <key-string> -l <location>')
})

program.parse(process.argv)
var subscriptionKey = program.subscriptionKey;
var location = program.location;

translateFile(program.input, program.mainLanguage, program.goalLanguage, program.output)
console.log('done')

/* ---- end of the program --- */
// 
function translateFile(filename, mainlanguage, goallanguage, outputfilename) {
  console.log('Input: ' + filename)
  console.log('Main Language: ' + mainlanguage)
  console.log('Goal Language: ' + goallanguage)
  console.log('Output: ' + outputfilename)
  console.log('start reading');

  jsonfile.readFile(filename)
    .then(
      function (input) {
        console.log('start processing');

        createMachineTranslatedFile(input, mainlanguage, goallanguage).then((myJson) => {
          jsonfile.writeFile(outputfilename, myJson)
            .then(res => {
              console.log('Write translated file complete, saved to: ' + outputfilename);
            })
            .catch(error => { console.error(error); process.exitCode = 1; })
        })
          .catch(error => { console.error(error); process.exitCode = 1; })
      })
    .catch(error => { console.error(error); process.exitCode = 1; })
}

//Picks only classes and properties (only fields where translations happen) and adds translated values
async function createMachineTranslatedFile(input, mainlanguage, goallanguage) {
  try {
    console.log('creating translated file')
    var myJson = new Object
    myJson = input
    myJson.classes = await getTranslatedArrays(input.classes, mainlanguage, goallanguage)
    myJson.properties = await getTranslatedArrays(input.properties, mainlanguage, goallanguage)
    myJson["externals"] = await getTranslatedArrays(input["externals"], mainlanguage, goallanguage)
    myJson["externalproperties"] = await getTranslatedArrays(input["externalproperties"], mainlanguage, goallanguage)
    return myJson
  } catch (error) {
    console.error("An error occured while reading the input (function createMachineTranslatedFile)")
    console.error("error", error);
  }
}

//Iterate through array of the input and translate fields that have yet to be translated,
//Create new translated array for the updated objects
async function getTranslatedArrays(inputArray, mainlanguage, goallanguage) {
  console.log('Checking array...')

  var newArray = new Array()
  try {
    for (var i = 0; i < inputArray.length; i++) {
      var currObject = inputArray[i]
      if (currObject != null) {
        var newObject = await translateAnObject(currObject, mainlanguage, goallanguage)
        newArray.push(newObject)
      }
    }
    return newArray
  } catch (error) {
    console.error("An error occured while iterating over an input array (function getTranslatedArrays)")
    console.error("error", error);
  }
}

//Translate one object
//Translates existing attributes only if the value of the goallanguage for the given attribute exists and is either empty or "Enter your translation here"
//Already existing translations will not be re-translated
async function translateAnObject(object, mainlanguage, goallanguage) {
  try {
    for (let key in object) {
      if (!(object[key] === undefined) && !(object[key][mainlanguage] === undefined)) {
        if (!(object[key][goallanguage] === undefined) && (
          object[key][goallanguage] == 'Enter your translation here' ||
          (object[key][goallanguage] == "" && object[key][mainlanguage] != ""))) {
          var machinetranslated = goallanguage + "-t-" + mainlanguage
          if (object[key][machinetranslated] === undefined) {
            var translation = await receiveAzureTranslation(object[key][mainlanguage], mainlanguage, goallanguage)
            object[key][machinetranslated] = await checkForUpperCase(object[key][mainlanguage], translation)
          }
        }
      }
    }
    return object
  } catch (error) {
    console.error("An error occured while reading values of the object (function translateAnObject)")
    console.error("error", error);
  }
}

async function checkForUpperCase(original, translated) {
  try {
    if (translated != null && translated != "") {
      var firstCharTranslated = translated.charAt(0)
      var firstCharOriginal = original.charAt(0)
      if (firstCharTranslated == firstCharTranslated.toUpperCase() && firstCharOriginal != firstCharOriginal.toUpperCase()) {
        return translated.toLowerCase()
      }
    }
    return translated
  } catch (error) {
    console.error("An error occured while transforming the translation to lowercase (function checkForUpperCase)")
    console.error("error: ", error);
  }
}

async function receiveAzureTranslation(line, mainlanguage, goallanguage) {
  try {
    var translationjson = await axios({
      baseURL: endpoint,
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuidv4().toString()
      },
      params: {
        'api-version': '3.0',
        'from': mainlanguage,
        'to': [goallanguage]
      },
      data: [{
        'text': line
      }],
      responseType: 'json'
    })
    console.log("Translation of " + line + ": " + translationjson["data"][0]["translations"][0]["text"])
    return translationjson["data"][0]["translations"][0]["text"]
  } catch (error) {
    console.error("An error occured while receiving the translated value from Azure (function receiveAzureTranslation)")
    console.error("error: ", error);
  }
}