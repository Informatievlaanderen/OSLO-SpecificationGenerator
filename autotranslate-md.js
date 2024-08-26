const { program } = require('commander')
const fs = require('node:fs')

const endpoint = 'https://api.cognitive.microsofttranslator.com/'
const possibleLanguages = ['de', 'en', 'fr', 'nl']

program
  .usage(
    'node autotranslate-md.js creates a translation of a markdown file and saves it in the correct directory'
  )
  .requiredOption('-i, --input <path>', 'input file to translate (a md file)')
  .requiredOption(
    '-g, --goalLanguages <languagecode>',
    'the languages that shall be translated to (a languagecode) separated by a comma'
  )
  .requiredOption(
    '-m, --mainLanguage <languagecode>',
    'the language that shall be translated from (a languagecode)'
  )
  .requiredOption(
    '-s, --subscriptionKey <key-string>',
    'Subscription key for Azure AI Translator (a String)'
  )
  .on('--help', function () {
    console.log('Examples:')
    console.log(
      '  $ node autotranslate-md.js -i <input> -g <languagecodes separated by comma> -m <languagecode> -s <key-string> -l <location>'
    )
  })

program.parse(process.argv)
const options = program.opts()

translateFile(options)

function translateFile (options) {
  // Get filename and directory name from input
  const inputParts = options.input.split('/')
  const filename = inputParts[inputParts.length - 1]
  let directory = inputParts.slice(0, -1).join('/')
  // Get correct base directory
  if (possibleLanguages.some((language) => directory.includes(language))) {
    // Go up one directory
    console.log('Going up one directory')
    directory = directory.split('/')
    directory.pop()
    directory = directory.join('/')
  } else {
    // Move input file to subdirectory
    console.log('Moving input file to subdirectory')
    const inputDirectory = directory + '/' + options.mainLanguage
    if (!fs.existsSync(inputDirectory)) {
      fs.mkdirSync(inputDirectory, { recursive: true })
    }
    // fs.renameSync(options.input, inputDirectory + '/' + filename)
    // copy file instead of moving it
    fs.copyFileSync(options.input, inputDirectory + '/' + filename)
  }
  const mdText = readMd(directory + '/' + options.mainLanguage + '/' + filename)
  const goalLanguages = options.goalLanguages.split(',')
  // Translate the file for each goal language
  goalLanguages.forEach(async (goalLanguage) => {
    options.goalLanguage = goalLanguage
    const outputDirectory = directory + '/' + options.goalLanguage
    const output = outputDirectory + '/' + filename
    // Create output directory if it does not exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true })
    }
    translateText(mdText, options).then((translatedMdText) => {
      writeMd(output, translatedMdText)
    })
  })
}

async function translateText (text, options) {
  const translatedText = await fetch(
    endpoint + '/translate?api-version=3.0&to=' + options.goalLanguage + '&from=' + options.mainLanguage,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': options.subscriptionKey,
        'Ocp-Apim-Subscription-Region': 'westeurope',
        'Content-type': 'application/json'
      },
      body: JSON.stringify([{ text: text }])
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data[0].translations[0].text
    })
    .catch((error) => {
      console.error('An error occured while translating text')
      console.error('error', error)
      return 'Enter your translation here'
    }
    )
  return translatedText
}

function readMd (filename) {
  console.log('start reading file ' + filename)
  try {
    const mdFile = fs.readFileSync(filename, 'utf8')
    return mdFile
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function writeMd (filename, mdText) {
  console.log('start writing file ' + filename)
  try {
    fs.writeFileSync(filename, mdText, 'utf8')
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}
