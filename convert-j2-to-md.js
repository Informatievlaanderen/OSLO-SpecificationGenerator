const { program } = require('commander')
const fs = require('node:fs')

const regexpBlockBegin = /{%\s*block\s*\w*\s*%\s*}\n*/g
const regexpBlockEnd = /\n*{%\s*endblock\s*%\s*}\n*/g
const regexpKey = /{%\s*block\s([^"']+)\s*%\s*}\n*/g

program.usage(
  'node convert-j2-to-md.js converts a j2 file to markdown files'
)
  .requiredOption('-i, --input <path>', 'input file to convert (a j2 file)')
  .on('--help', function () {
    console.log('Examples:')
    console.log(
      '  $ node convert-j2-to-md.js -i <input>'
    )
  })

program.parse(process.argv)
const options = program.opts()

convertJ2ToMd(options)

// main function to convert the j2 file
function convertJ2ToMd (options) {
  const j2Text = readJ2(options.input)
  convertJ2TextToMd(j2Text)
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

function writeMd (filename, mdText) {
  console.log('start writing file ' + filename)
  try {
    fs.writeFileSync(filename, mdText, 'utf8')
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function convertJ2TextToMd (j2Text) {
  const blockBegins = [...j2Text.matchAll(regexpBlockBegin)]
  const blockEnds = [...j2Text.matchAll(regexpBlockEnd)]
  const blockKeys = [...j2Text.matchAll(regexpKey)].map((key) => key[1].trim())
  if (blockBegins.length !== blockEnds.length) {
    console.error('Number of block starts and block ends does not match')
    process.exitCode = 1
    return null
  }
  for (let i = 0; i < blockBegins.length; i++) {
    // get the content of the block
    const blockBegin = blockBegins[i]
    const blockEnd = blockEnds[i]
    const blockContent = j2Text.slice(blockBegin.index + blockBegin[0].length, blockEnd.index)
    // write block content to md file with key as filename
    const key = blockKeys[i]
    writeMd('./' + key + '.md', blockContent)
  }
}
