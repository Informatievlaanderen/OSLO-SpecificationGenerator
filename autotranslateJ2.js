const { program } = require('commander')
const fs = require('node:fs')

const endpoint = 'https://api.cognitive.microsofttranslator.com/'
const regexpBlockBegin = /{%\s*block\s*\w*\s*%\s*}\n*/g
const regexpBlockEnd = /\n*{%\s*endblock\s*%\s*}\n*/g
const regexFilename = /{%\s*extends\s*"([^"']+)"\s*%}/g
const possibleLanguages = ['de', 'en', 'fr', 'nl']

// parse the command line arguments
program
  .usage(
    'node autotranslateJ2.js creates a translation of a j2 file based on existing values'
  )
  .requiredOption('-i, --input <path>', 'input file to translate (a jsonld file)')
  .requiredOption(
    '-g, --goalLanguage <languagecode>',
    'the language that shall be translated to (a languagecode)'
  )
  .requiredOption(
    '-m, --mainLanguage <languagecode>',
    'the language that shall be translated from (a languagecode)'
  )
  .requiredOption('-o, --output <path>', 'translated output file (a jsonld file)')
  .requiredOption(
    '-s, --subscriptionKey <key-string>',
    'Subscription key for Azure AI Translator (a String)'
  )
  .on('--help', function () {
    console.log('Examples:')
    console.log(
      '  $ node autotranslateJ2.js -i <input> -g <languagecode> -m <languagecode> -o <output> -s <key-string> -l <location>'
    )
  })

program.parse(process.argv)
const options = program.opts()

translateFile(options)

// main function to translate the j2 file
function translateFile (options) {
  let j2Text = readJ2(options.input)
  const originalFilename = extractFilename(j2Text)
  const newFilename = convertFilename(originalFilename, options)
  j2Text = replaceFilename(j2Text, originalFilename, newFilename)
  processJ2Text(j2Text, options).then((translatedJ2Text) => {
    writeJ2(options.output, translatedJ2Text)
  })
}

function extractFilename (j2Text) {
  console.log('start extracting filename')
  const filenames = [...j2Text.matchAll(regexFilename)]
  if (filenames === null || filenames === undefined || filenames.length === 0) {
    console.error('No filename found in j2 file')
    process.exitCode = 1
    return null
  }
  const filename = filenames[0][1]
  return filename
}

function replaceFilename (j2Text, originalFilename, newFilename) {
  const newJ2Text = j2Text.replace(originalFilename, newFilename)
  return newJ2Text
}

function convertFilename (filename, options) {
  // Convert eg ap2.j2 to ap2_en.j2
  const parts = filename.split('.')
  const lang = options.goalLanguage
  let newFilename = ''
  // Check if filename already contains language code (possibleLanguages)
  if (possibleLanguages.some((el) => filename.includes('_' + el))) {
    // Replace the language code with the new language code
    newFilename = filename.replace(/(_de|_en|_fr|_nl)/, '_' + lang)
  } else {
    // Add the language code to the filename
    newFilename = parts[0] + '_' + lang + '.' + parts[1]
  }
  console.log('new filename: ' + newFilename)
  return newFilename
}

function readJ2 (filename) {
  console.log('start reading file ' + filename)
  try {
    const j2File = fs.readFileSync(filename, 'utf8')
    return j2File
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function writeJ2 (filename, j2Text) {
  console.log('start writing file ' + filename)
  try {
    fs.writeFileSync(filename, j2Text, 'utf8')
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

async function processJ2Text (j2Text, options) {
  // Iterate over the blocks based on the regular expression
  console.log('start translating blocks')
  const blockBegins = [...j2Text.matchAll(regexpBlockBegin)]
  const blockEnds = [...j2Text.matchAll(regexpBlockEnd)]
  if (blockBegins.length !== blockEnds.length) {
    console.error('Number of block starts and block ends does not match')
    process.exitCode = 1
    return null
  }
  const blockContents = []
  for (let i = 0; i < blockBegins.length; i++) {
    // get the content of the block
    const blockBegin = blockBegins[i]
    const blockEnd = blockEnds[i]
    const blockContent = j2Text.slice(blockBegin.index + blockBegin[0].length, blockEnd.index)
    blockContents.push(blockContent)
  }
  // translate the block contents
  const translatedBlockContents = await Promise.all(blockContents.map(async (blockContent) => {
    return await translateJ2Text(blockContent, options)
  }))
  // construct the translated j2 text
  let translatedJ2Text = ''
  let startIdx = 0
  for (let i = 0; i < blockBegins.length; i++) {
    translatedJ2Text += j2Text.slice(startIdx, blockBegins[i].index + blockBegins[i][0].length)
    translatedJ2Text += translatedBlockContents[i]
    translatedJ2Text += j2Text.slice(blockEnds[i].index, blockEnds[i].index + blockEnds[i][0].length)
    startIdx = blockEnds[i].index + blockEnds[i][0].length
  }
  return translatedJ2Text
}

async function translateJ2Text (text, options) {
  const translatedText = await fetch(
    endpoint + '/translate?api-version=3.0&to=' + options.goalLanguage + '&from=' + options.mainLanguage + '&textType=html',
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
      if (data.error !== undefined) {
        console.error('An error occured while translating text, thrown by Azure Translator')
        console.error('error', data.error.message)
        return 'Enter your translation here'
      }
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
