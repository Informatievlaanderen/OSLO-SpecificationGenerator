const { program } = require('commander')
const fs = require('node:fs')
const jsonfile = require('jsonfile')

const regexUrn = /urn:[^\s"]+/g

program
  .usage('node report_lines_links creates a table with line numbers for interlinking reports based on oslo:urn ids')
  .requiredOption('-i, --input <path>', 'input file from which the line numbers are to be created')
  .requiredOption('-o, --output <path>', 'output file with lines and links')
  .on('--help', function () {
    console.log('Examples:')
    console.log('  $ node report_lines_links.js -i <input> -o <output>')
  })

program.parse(process.argv)
const options = program.opts()

report_lines_links(options.input, options.output)

function report_lines_links(filename, outputFilename) {
  const allFile = readData(filename)
  jsonfile.readFile(filename)
      .then(
         function (inputJson) {
  		let newData = lines_links(allFile, inputJson)
	        newData = newData.join('\n')	
  		writeLinesLinks(newData, outputFilename)
       }).catch(error => { console.error(error); process.exitCode = 1 })
}

function readData (filename) {
  try {
    const report = fs.readFileSync(filename, 'utf-8')
    return report
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function writeLinesLinks(data, filename) {
  try {
    fs.writeFileSync(filename, data)
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
}

function lines_links(allFile, alljson) {
  let urnlines = []

	let pafter = findLine(allFile,'"packages": [')
	let purns  = all_urn(alljson.packages)
	urnlines = purns.reduce(function(acc, elem) {
		let line = findLineNbAfter1Occ(allFile, elem, pafter)
		acc.push(elem + " = " + line)
		return acc
	},urnlines)

	let cafter = findLine(allFile,'"classes": [')
	let curns = all_urn(alljson.classes)
	urnlines = curns.reduce(function(acc, elem) {
		let line = findLineNbAfter1Occ(allFile, elem, cafter)
		acc.push(elem + " = " + line)
		return acc
	},urnlines)

	let aafter = findLine(allFile,'"attributes": [')
	let aurns = all_urn(alljson.attributes)
	urnlines = aurns.reduce(function(acc, elem) {
		let line = findLineNbAfter1Occ(allFile, elem, aafter)
		acc.push(elem + " = " + line)
		return acc
	},urnlines)

	let rafter = findLine(allFile,'"referencedEntities": [')
	let rurns = all_urn(alljson.referencedEntities)
	urnlines = rurns.reduce(function(acc, elem) {
		let line = findLineNbAfter1Occ(allFile, elem, rafter)
		acc.push(elem + " = " + line)
		return acc
	},urnlines)

	let dafter = findLine(allFile,'"datatypes": [')
	let durns = all_urn(alljson.datatypes)
	urnlines = durns.reduce(function(acc, elem) {
		let line = findLineNbAfter1Occ(allFile, elem, dafter)
		acc.push(elem + " = " + line)
		return acc
	},urnlines)
 
  return urnlines
}


//
// find the linenumber of the first occurrance after line X 
// This is needed to point to the definition in the list and not to 
// the usage of the urn other elements in the report 
//
function findLineNbAfter1Occ (AllFile, urn, after) {
  const lines = AllFile.split('\n')
  let index = 1
  for (const line of lines) {
    if ( index < after ) {
	    index++
    } else {
	    if (line.includes(urn)) {
	      return index
	    }
	    index++
    }
  }
  return 0
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


function all_urn(list) {
	let urns = list.reduce(function(acc,elem) {
		acc.push(elem['@id'])
		return acc
	}, [])
	return urns
}
