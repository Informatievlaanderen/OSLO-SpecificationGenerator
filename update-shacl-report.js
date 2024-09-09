const { program } = require('commander')
const fs = require('node:fs')

const regexUrn = /urn:[^\s"]+/g

program
  .usage('node update-shacl-report.js adds links to the shacl report')
  .requiredOption('-i, --input <path>', 'input file to update (a shacl report)')
  .requiredOption('-a, --all <path>', 'all json ld file for the link')
  .requiredOption('-o, --output <path>', 'output file (a shacl report)')
  .requiredOption('-l, --link <link>', 'link to the all file')
  .on('--help', function () {
    console.log('Examples:')
    console.log('  $ node update-shacl-report.js -i <input> -a <all> -o <output>')
  })

program.parse(process.argv)
const options = program.opts()

updateShaclReport(options.input, options.all, options.output, options.link)

function updateShaclReport (filename, allFilename, outputFilename, link) {
  const data = readData(filename)
  const allFile = readData(allFilename)
  const newData = updateReport(data, allFile, link)
  writeShaclReport(newData, outputFilename)
}

function readData (filename) {
  try {
    const shaclReport = fs.readFileSync(filename, 'utf-8')
    return shaclReport
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function writeShaclReport (data, filename) {
  try {
    fs.writeFileSync(filename, data)
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function updateReport (data, allFile, link) {
  let urns = [...data.matchAll(regexUrn)].map(match => match[0])
  // remove duplicates based on the urn
  urns = urns.reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], [])
  for (const urn of urns) {
    const lineNumber = findLine(allFile, urn)
    // add link to shacl report
    if (lineNumber !== 0) {
      data = data.replaceAll(urn, '[' + urn + '](' + link + '#L' + lineNumber + ')')
    }
  }
  return data
}

function findLine (AllFile, urn) {
  const lines = AllFile.split('\n')
  let index = 1
  for (const line of lines) {
    if (line.includes(urn)) {
      return index
    }
    index++
  }
  return 0
}
