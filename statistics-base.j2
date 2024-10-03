const fs = require('fs')
const jsonfile = require('jsonfile')
const Set = require('collections/set')
const Map = require('collections/map')


const program = require('commander')
const newLineMd = '  '

// Mapping language codes to language names (per language)
const languageNames = {
  en: { en: 'English', nl: 'Engels', fr: 'Anglais', de: 'Englisch' },
  nl: { en: 'Dutch', nl: 'Nederlands', fr: 'Néerlandais', de: 'Niederländisch' },
  fr: { en: 'French', nl: 'Frans', fr: 'Français', de: 'Französisch' },
  de: { en: 'German', nl: 'Duits', fr: 'Allemand', de: 'Deutsch' }
}

program
  .version('1.0.0')
  .usage('node html-metadata-generator.js extracts metadata for the html pages in  a chosen language')
  .option('-h, --hostname <hostname>', 'the public hostname/domain on which the html is published. The hostname in the input file takes precedence.')
  .option('-r, --documentpath <path>', 'the document path on which the html is published')
  .option('-u, --uridomain <uridomain>', 'the domain of the URIs that should be excluded from this vocabulary')
  .option('-i, --input <path>', 'input file')
  .option('-s, --stakeholders <path>', 'input stakeholders file')
  .option('-o, --output <path>', 'output file (the statistics file)')
  .option('-p, --prefix <prefix>', 'prefix for the logging')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ statistics-base --help')
  console.log('  $ statistics-base -i <input> -o <output>')
})

program.parse(process.argv)
const options = program.opts()

render_statistics(options.input, options.stakeholders, options.output, options.prefix)

console.log(options.prefix + 'done' + newLineMd)

function render_statistics (input_filename, stakeholders_filename, output_filename, prefix) {
  console.log(prefix + 'start reading' + newLineMd)
  jsonfile.readFile(input_filename)
    .then(
      function (input) {
  	jsonfile.readFile(stakeholders_filename)
    	.then( function (stakeholders) {
		console.log(prefix + 'start processing' + newLineMd)
		const hostname = options.hostname
		let output = make_statistics(input, stakeholders, hostname, prefix)

		console.log(prefix + 'start writing' + newLineMd)
		    jsonfile.writeFile(output_filename, output, function (err) {
		      if (err) {
			process.exitCode = 1
			console.error(err)
			throw err
		      }
		      console.log(prefix + 'The file has been saved to ' + output_filename + newLineMd)
		    })
      	})
    	.catch(error => { console.error(error); process.exitCode = 1 })

      })
    .catch(error => { console.error(error); process.exitCode = 1 })
}





function getNamespaces (data, prefix) {
  console.log(prefix + 'Checking Namespaces' + newLineMd)
  let namespaces = []

  let classes = data.classes
  let attributes = data.attributes
  let datatypes = data.datatypes
  let referencedEntities = data.referencedEntities

  if (!(classes === undefined) && classes !== null ) {
  namespaces = classes.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)
  }
  if (!(attributes === undefined) && attributes !== null ) {
  namespaces = attributes.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)
  }
  if (!(datatypes === undefined) && datatypes !== null ) {
  namespaces = datatypes.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)
  }
  if (!(referencedEntities === undefined) && referencedEntities !== null ) {
  namespaces = referencedEntities.reduce(function (acc, elem) {
	  acc = pushNamespace(elem.assignedURI, acc)
	  return acc
  }, namespaces)
  }

  console.log(prefix + 'Finished' + newLineMd)
  return namespaces
}

function pushNamespace (uri, namespaces) {
  if (!(uri === undefined) && uri !== null && uri !== '') {
    const lastIndex = uri.lastIndexOf('/')
    const lastPart = uri.substring(lastIndex)
    if (!lastPart.includes('#') && (uri.substring(0, lastIndex).length > 7)) {
      namespaces = push(namespaces, uri.substring(0, lastIndex))
    } else if (!lastPart.includes('#') && (uri.substring(0, lastIndex).length <= 7)) {
      namespaces = push(namespaces, uri)
    } else {
      const lastHash = uri.lastIndexOf('#')
      namespaces = push(namespaces, uri.substring(0, lastHash))
    }
  }
  return namespaces
}

function push (namespaces, value) {
  if (!namespaces.includes(value)) {
    namespaces.push(value)
  }
  return namespaces
}

//-----------------------------------------------------------------------//
//
// extract metadata from expanded json
// Takes an expanded json root object as it is being parsed by jsonld
// together with the context such as it is being defined in the root of
// this repository and returns the metadata for the ontology that is
// encoded within the json ld.
// It in the form that the nunjucks template expects it.
// For an example please refer to the README.md.
//
// @param expanded the root class as it is being read by jsonld

function make_statistics (json, stakeholders, hostname, prefix) {
  let hn = json.hostname
  if (hn == null) {
    hn = (hostname != null) ? hostname : 'https://data.vlaanderen.be'
  }
  if (json.navigation) {
    json.navigation.self = hn + json.urlref
  } else {
    console.log('Warning: no navigation defined for this rendering' + newLineMd)
    json.navigation = {
      self: hn + json.urlref
    }
  }

  const docstatus = json['publication-state']
  let docstatuslabel = ''

  switch (docstatus) {
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/Kandidaat-standaard':
      docstatuslabel = 'Kandidaat-standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/Standaard':
      docstatuslabel = 'Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/HerroepenStandaard':
      docstatuslabel = 'Herroepen Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpdocumentInOntwikkeling':
      docstatuslabel = 'Ontwerpdocument'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/ErkendeStandaard':
      docstatuslabel = 'Erkende Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpStandaard':
      docstatuslabel = 'Ontwerp Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/KandidaatStandaard':
      docstatuslabel = 'Kandidaat Standaard'
      break
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/NotaWerkgroep':
      docstatuslabel = 'Nota Werkgroep'
      break
    default:
      docstatuslabel = 'Onbekend'
  };

  let titel = json.title

  let usednamespaces = getNamespaces(json, prefix)

  stakeholders.contributors = reduce_stakeholders(stakeholders.contributors)
  stakeholders.editors = reduce_stakeholders(stakeholders.editors)
  stakeholders.authors = reduce_stakeholders(stakeholders.authors)


  let participants = []

  participants = stakeholders.contributors.reduce(function (acc, elem) {
     if (acc.has(elem)) { console.log(options.prefix + JSON.stringify(elem) ) } else {acc.add(elem) }
     return acc
  }, participants)
  participants = stakeholders.editors.reduce(function (acc, elem) {
     if (acc.has(elem)) { console.log(options.prefix + JSON.stringify(elem)) } else {acc.add(elem) }
     return acc
  }, participants)
  participants = stakeholders.authors.reduce(function (acc, elem) {
     if (acc.has(elem)) { console.log(options.prefix + JSON.stringify(elem)) } else {acc.add(elem) }
     return acc
  }, participants)

  let organisations = new Map()
  organisations = map_organisations(stakeholders.contributors, organisations) 
  organisations = map_organisations(stakeholders.editors, organisations) 
  organisations = map_organisations(stakeholders.authors, organisations) 

  count_organisations = count_org_participants(organisations)

  let calc_values = {
    authors: stakeholders.authors,
    editors: stakeholders.editors,
    contributors: stakeholders.contributors,
    participants: participants,
    classes: count_classes(json),
    properties: count_properties(json),
    externalclasses: count_extclasses(json),
    externalproperties: count_extproperties(json),
    organisations: org_to_json(organisations),
  }

  const statistics = {
    title: titel,
    uri: json['@id'],
    issued: json['publication-date'],
    baseURI: json.baseURI,
    baseURIabbrev: json.baseURIabbrev,
    navigation: json.navigation,
    documenttype: json.type,
    status: docstatus,
    statuslabel: docstatuslabel,
    namespaces: usednamespaces,

    authors: stakeholders.authors.length,
    editors: stakeholders.editors.length,
    contributors: stakeholders.contributors.length,
    participants: participants.length,
    classes: count_classes(json).length,
    properties: count_properties(json).length,
    externalclasses: count_extclasses(json).length,
    externalproperties: count_extproperties(json).length,
    totalterms: count_terms(json),
    totalorganisations: organisations.length,
    organisations: count_organisations,
    specifications: [],

    values : calc_values

    


  }
  return statistics
};


const scope_external = "https://data.vlaanderen.be/id/concept/scope/External"

function map_terms(terms) {
   let result = terms.map(function(values, key) { 
      let v = {}
      v.assignedURI = values.assignedURI
      v.label = values.apLabel ? values.apLabel : values.vocLabel ? values.vocLabel : values.diagramLabel
      return v
   })
   return result
}

function count_classes(input) {
   let internalc = input.classes.filter((c) => c.scope != scope_external );
   let internald = input.datatypes.filter((c) => c.scope != scope_external );
   let internale = input.referencedEntities.filter((c) => c.scope != scope_external );
   return map_terms(internalc.concat(internald).concat(internale))
}


function count_extclasses(input) {
   let externalc = input.classes.filter((c) => c.scope === scope_external );
   let externald = input.datatypes.filter((c) => c.scope === scope_external );
   let externale = input.referencedEntities.filter((c) => c.scope === scope_external );
   return map_terms(externalc.concat(externald).concat(externale))
}


function count_properties(input) {
   let propc = input.attributes.filter((c) => c.scope != scope_external );
   return map_terms(propc)
}


function count_extproperties(input) {
   let propc = input.attributes.filter((c) => c.scope === scope_external );
   return map_terms(propc)
}


function count_terms(input) {
   return input.classes.length + input.datatypes.length + input.referencedEntities.length + input.attributes.length
}

function reduce_stakeholders(stakeholders) {
  let updatedstakeholders = stakeholders.reduce(function (acc, elem) {
          let newelem = {}
          newelem.name = elem.firstName + elem.lastName 
          newelem.name = newelem.name.toLowerCase().replace(/\s+/g, '')
          newelem.affiliation = elem.affiliation.affiliationName.toLowerCase().replace(/\s+/g, '')
	  acc.push(newelem)
	  return acc
  }, [])
  return updatedstakeholders  
}

function map_organisations(participants, organisations) {
  let new_organisations = participants.reduce(function (acc, elem) {
     if (acc.has(elem.affiliation)) { 
          let v = acc.get(elem.affiliation)
          if (v.has(elem)) { console.log(options.prefix + JSON.stringify(elem)) } else { v.add(elem) }
          acc.set(elem.affiliation, v)
        } else {
         acc.set(elem.affiliation, [elem]) }
     return acc
  }, organisations)

  return new_organisations

}

function org_to_json(organisations) {
  let json = organisations.reduce(function(acc, value, key) {
		let v = {}
		v.affiliation = key
                v.names = value
		acc.push(v)
                return acc
             }, [] )
  return json
}


function count_org_participants(organisations) {
  let counts = organisations.reduce(function(acc, value, key) {
      acc.push({"affiliation": key, "participants" : value.length})
      return acc
     },  [])
  return counts
}
