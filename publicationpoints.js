const fs = require('fs')
const jsonfile = require('jsonfile')
const Set = require('collections/set')
const Map = require('collections/map')

const program = require('commander')

program
  .version('1.0.0')
  .usage('node publicationpoints.js uses a publicationpoints file to create a navigation graph')
  .option('-i, --input <path>', 'input file')
  .option('-o, --output <path>', 'output file (the statistics file)')
  .option('-p, --prefix <prefix>', 'prefix for the logging')

program.on('--help', function () {
  console.log('')
  console.log('Examples:')
  console.log('  $ node /app/publicationpoints.js --help')
  console.log('  $ node /app/publicationpoints.js -i <input> -o <output>')
})

program.parse(process.argv)
const options = program.opts()
var publicationpoints = new Map()

render_navigation(options.input, options.output, options.prefix)

console.log(options.prefix + 'done')

function render_navigation (input_filename, output_filename, prefix) {
  console.log(prefix + 'start reading' )
  jsonfile.readFile(input_filename)
    .then(
      function (input) {
		console.log(prefix + 'start processing')
		let output = make_navigation(input, prefix)

		console.log(prefix + 'start writing')
		    jsonfile.writeFile(output_filename, output, function (err) {
		      if (err) {
			process.exitCode = 1
			console.error(err)
			throw err
		      }
		      console.log(prefix + 'The file has been saved to ' + output_filename )
		    })
      })
    .catch(error => { console.error(error); process.exitCode = 1 })
}


//-----------------------------------------------------------------------//
//

function make_navigation (json, prefix) {
//  if (json.navigation) {
//    json.navigation.self = hn + json.urlref
//  } else {
//    console.log('Warning: no navigation defined for this rendering' )
//    json.navigation = {
//      self: hn + json.urlref
//    }
//  }
  let map_urlref = json.reduce(function (acc, elem) {
	  if (acc.has(elem.urlref)) {
		  console.log('Error: urlref ' + elem.urlref + ' multiple times defined: incorrect publication' )
	  } else {
		  acc.add(elem, elem.urlref)
	  }
	  return acc
  }, new Map())

  let root_urlrefs = map_urlref.reduce(function (acc, elem, key) {
	  let nav = elem.navigation
	  if (nav === undefined) {
		  acc.push(key)
	  } else {
		  if (nav.prev === undefined) {
			  acc.push(key)
		  }
	  }
	  return acc
   }, [])


  let root_versionless = root_urlrefs.reduce(function (acc, elem) {
	  let sa = map_urlref.get(elem).seealso
	  if (sa !== undefined) {
		  let el = {}
		  el.urlref = map_urlref.get(elem).urlref
		  el.sameAs = sa
		  el.expanded = false
		  acc.add(el, el.urlref)
	  }
	  return acc
  }, new Map() )

//  if (root_urlrefs.length != root_versionless ) {
//	  console.log('Error: there are root specifications published without a versionless variant')
//	  console.log('       These extra are not taken into account for the global statistics')
//  }

	/*
	 * structure to be created
	 *
	 * [ {
	 *     urlref : 
	 *     sameAs : {
	 *                urlref : ""
	 *                prev : Obj  
	 *                expanded: false
	 *                }
	 *              }
	 *    expanded: true
	 *    }
	 *    ]
	 */
   

  let allps = map_urlref.reduce(function(acc, elem, key) {
	  if (! root_versionless.has(key)) {
		  acc.add(elem, key)
	  }
	  return acc
  }, new Map())

  let maxdepth = 3
  let depth = 0
  let roots=root_versionless.length

  publicationpoints = allps
  while (allps.length != 0  &&  depth < maxdepth) {

	  nv = root_versionless.reduce(function (acc, elem, key) {
		  let el = expand_not_expanded_elem(elem)
		  acc.add(el, key)
		  return acc
	  },  new Map() )

          allps = publicationpoints
          root_versionless = nv
	  
	  console.log(prefix + ' processing depth ' + depth)
	  depth = depth +1
  }



  let navigation = root_versionless.reduce( function (acc, elem, key) {
	  acc.push(elem)
	  return acc
  }, [])

  if (navigation.length !== roots) {
     console.log('Error: some roots have been disappeared')
  }
  if (allps.length > 0 ) {
	  console.log('Error: some publication points have not been connected with a versionless root')
	  console.log('       These publication points will not be taken into account for the statistics')
  }

  return navigation
};



function expand_not_expanded_elem(tree) {
  if (tree.expanded === true ) {
	  if (tree.sameAs !== undefined ) {
		  let sa = expand_not_expanded_elem(tree.sameAs)
		  tree.sameAs = sa
		  return tree
	  } else {
		  if (tree.prev !== undefined )  {
		  	let sa = expand_not_expanded_elem(tree.prev)
		  	tree.prev = sa
			  return tree
		  } else {
			  console.log(options.prefix + 'Element found without a previous')
			  return tree
		  }
	  }
  } else {
	  if (tree.sameAs !== undefined ) {
		  let sa = expand_element_sameas(tree)
		  return sa 
	  } else {
		  if (tree.prev !== undefined )  {
		  	let sa = expand_element_previous(tree)
		  	return sa
		  } else {
			  console.log(options.prefix + 'Element found without a previous')
			  return tree
		  }
	  }
  }
}

function expand_element_sameas(elem) {
	 let prevelem = publicationpoints.get(elem.sameAs)
	 if (prevelem === undefined ) {
	 	console.log(' Error: reference to unknown publication point: ' + elem.sameAs)
		elem.expanded = true
	  } else {
	 	elem.expanded = true
	        elem.sameAs = {}
		elem.sameAs.urlref = prevelem.urlref
		  if ( prevelem.navigation === undefined || prevelem.navigation.prev === undefined ) {
			  elem.sameAs.expanded = true
		  } else {
		elem.sameAs.prev = prevelem.navigation.prev
		elem.sameAs.expanded = false
			  }
		publicationpoints.delete(elem.sameAs.urlref)
	 }
	return elem
}

function expand_element_previous(elem) {
	 let prevelem = publicationpoints.get(elem.prev)
	 if (prevelem === undefined ) {
	 	console.log(' Error: reference to unknown publication point: ' + elem.prev)
		elem.expanded = true
	  } else {
	 	elem.expanded = true
	        elem.prev = {}
		elem.prev.urlref = prevelem.urlref
		  if ( prevelem.navigation === undefined || prevelem.navigation.prev === undefined ) {
			  elem.prev.expanded = true
		  }else {
		elem.prev.prev = prevelem.navigation.prev
		elem.prev.expanded = false
			  }
		publicationpoints.delete(elem.prev.urlref)
	 }
	return elem
}

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
