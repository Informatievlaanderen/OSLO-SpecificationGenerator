const { program } = require('commander')
const fs = require('node:fs')

program
  .usage(
    'node merge-overviewreport.js merges the previous and the current overview report'
  )
  .requiredOption('-p, --previous <path>', 'previous overview report')
  .requiredOption('-c, --current <path>', 'current overview report')
  .requiredOption('-o, --output <path>', 'output file')
  .on('--help', function () {
    console.log('Examples:')
    console.log(
      '  $ node merge-overviewreport.js -p <previous> -c <current> -o <output>'
    )
  })

program.parse(process.argv)
const options = program.opts()

mergeOverviewreport(options.previous, options.current, options.output)

function mergeOverviewreport (previousFilename, currentFilename, outputFilename) {
  console.log('start reading')
  const dataPrev = readMdAndConvertToJSON(previousFilename)
  const dataCur = readMdAndConvertToJSON(currentFilename)
  // If no previous data is found, just write the current data to the output file
  if (dataPrev === undefined || dataPrev.data.length === 0) {
    fs.writeFileSync(outputFilename, dataCur.legend + '\n' + dataCur.data)
    console.log('The file has been saved to ' + outputFilename)
    return
  }
  const previous = dataPrev.data
  const legendCur = dataCur.legend
  const current = dataCur.data
  const merged = mergeFiles(previous, current)
  const md = convertToMd(merged, legendCur)
  console.log('start writing')
  fs.writeFileSync(outputFilename, md)
  console.log('The file has been saved to ' + outputFilename)
}

function readMdAndConvertToJSON (filename) {
  try {
    const mdText = fs.readFileSync(filename, 'utf-8')
    // Parse legend
    const legendStartIndex = 0
    const legendEndIndex = mdText.indexOf('| Specification |', legendStartIndex)
    const mainTable = mdText.slice(legendEndIndex)
    const legend = mdText.slice(legendStartIndex, legendEndIndex)
    // Parse main table
    const lines = mainTable.trim().split('\n')
    const header = lines[0].split('|').map(item => item.trim())
    const data = lines.slice(2).map(line => {
      const values = line.split('|').map(item => item.trim())
      const obj = {}
      for (let i = 1; i < header.length - 1; i++) {
        obj[header[i]] = values[i]
      }
      return obj
    })
    return { data, legend }
  } catch (err) {
    console.error('error', err)
    process.exitCode = 1
    return undefined
  }
}

function mergeFiles (previous, current) {
  const merged = current
  // Loop through all specifcation in previous, when not found in current, add to merged
  for (const prev of previous) {
    const found = current.find(cur => cur.Specification === prev.Specification)
    if (!found) {
      merged.push(prev)
    }
  }
  return merged
}

function convertToMd (jsonObj, legend) {
  let md = legend + '\n'
  md += '| ' + Object.keys(jsonObj[0]).join(' | ') + ' |\n'
  md += '| ' + Object.keys(jsonObj[0]).map(() => '---').join(' | ') + ' |\n'
  for (const obj of jsonObj) {
    md += '| ' + Object.values(obj).join(' | ') + ' |\n'
  }
  return md
}
