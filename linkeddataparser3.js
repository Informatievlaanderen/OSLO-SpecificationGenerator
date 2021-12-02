const fs = require('fs')
const jsonld = require('jsonld')
const uris = require('./uris')
const Map = require('collections/map')
const Set = require('collections/set')

require('collections/shim-array')

/**
 * Pre Description:
 * This is an adapted version of the orginal parser, it uses the json instead of the expanded jsonld representation
 * The purpose is to create the desired nunjuncks_json structure
 *
 * The linked data parser library provides support for converting
 * json ld files to a form that the nunjucks templates as they have been
 * defined on the data.vlaanderen.be repository can process.
 *
 * It's main entry points is parse_ontology_from_json_ld_file(json_ld_file, template_file)
 *
 * New additions:
 * The Parser now additionally parses the file with regards to a chosen language
 **/

//
// parse ontology from json ld
// this function takes a reference to a json ld file containing
// the description of an ontology encoded in json ld format and
// returns a representation of that ontology that can be rendered
// by the nunjucks template.
//
// @param filename the name of the file that contains the json ld representation
async function parse_ontology_from_json_ld_file_voc (json_ld_file, hostname, language) {
  const ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'))
  const expanded = await jsonld.expand(ld)
  console.log('html will be generated in: ' + language)

  const codelist = getcodelist(ld)
  const nj_classes = ld.classes.reduce(function (acc, elem) {
    acc.push(make_nj_class_voc(elem, language))
    return acc
  }, [])
  // TODO Question, view method call
  const nj_properties = ld.properties.reduce(function (acc, elem) {
    acc.push(make_nj_prop_voc(elem, codelist, language))
    return acc
  }, [])
  const nj_ext_classes_list = ld.externals.reduce(function (acc, elem) {
    const candidate = make_nj_ext_class_voc(elem, language)
    if (candidate.name && candidate.show) { acc.push(candidate) };
    return acc
  }, [])
  const nj_ext_classes_set = new Set(nj_ext_classes_list)
  const nj_ext_classes = nj_ext_classes_set.toArray()
  const nj_ext_properties_list = ld.externalproperties.reduce(function (acc, elem) {
    const candidate = make_nj_ext_prop_voc(elem, codelist, language)
    if (candidate.name && candidate.show) { acc.push(candidate) };
    return acc
  }, [])
  const nj_ext_properties_set = new Set(nj_ext_properties_list)
  const nj_ext_properties = nj_ext_properties_set.toArray()
  const nj_editors = ld.editors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'E'))
    return acc
  }, [])
  const nj_contributors = ld.contributors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'C'))
    return acc
  }, [])
  const nj_authors = ld.authors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'A'))
    return acc
  }, [])

  for (const i in expanded) {
    const vocabularium = expanded[i]
    const nunjucks_json = {
      metadata: make_nj_metadata(ld, hostname),
      classes: nj_classes,
      properties: nj_properties,
      contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
      external_terms: nj_ext_classes.concat(nj_ext_properties)
    }
    const datatypes = extract_datatypes_from_expanded_json(vocabularium)
    if (datatypes.length > 0) {
      nunjucks_json.datatypes = datatypes
    }
    return nunjucks_json
  }
};

async function parse_ontology_from_json_ld_file_ap (json_ld_file, hostname, forceskos) {
  const ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'))
  const expanded = await jsonld.expand(ld)

  const grouped0 = group_properties_per_class_all(ld)
  const codelist = getcodelist(ld)
  const package_map = get_package_map(ld)
  const classid_map = get_classid_map(ld)
  let dependencies = ld.dependencies
  if (!dependencies) { dependencies = [] };
  const aux = {
    codelist: codelist,
    dependencies: dependencies,
    package_map: package_map,
    classid_map: classid_map,
    forceskos: forceskos
  }
  const nj_classes = make_nj_classes(ld.classes, grouped0, aux)
  const nj_datatypes = make_nj_datatypes(ld.classes, grouped0, aux)

  const nj_editors = ld.editors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'E'))
    return acc
  }, [])
  const nj_contributors = ld.contributors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'C'))
    return acc
  }, [])
  const nj_authors = ld.authors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'A'))
    return acc
  }, [])
  for (const i in expanded) {
    const vocabularium = expanded[i]
    const nunjucks_json = {
      metadata: make_nj_metadata(ld, hostname),
      classes: nj_classes,
      properties: extract_properties_from_expanded_json(vocabularium),
      contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
      datatypes: nj_datatypes,
      parents: []
    }
    return nunjucks_json
  }
};

async function parse_ontology_from_json_ld_file_all (json_ld_file, hostname, forceskos, language) {
  const ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'))
  const expanded = await jsonld.expand(ld)

  const grouped0 = group_properties_per_class_all(ld)
  const codelist = getcodelist(ld)
  const package_map = get_package_map(ld)
  const classid_map = get_classid_map(ld)
  let dependencies = ld.dependencies
  if (!dependencies) { dependencies = [] };
  const aux = {
    codelist: codelist,
    dependencies: dependencies,
    package_map: package_map,
    classid_map: classid_map,
    forceskos: forceskos
  }
  const nj_classes = make_nj_classes(ld.classes.concat(ld.externals), grouped0, aux, language)
  const nj_datatypes = make_nj_datatypes(ld.classes.concat(ld.externals), grouped0, aux, language)
  const nj_editors = ld.editors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'E'))
    return acc
  }, [])
  const nj_contributors = ld.contributors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'C'))
    return acc
  }, [])
  const nj_authors = ld.authors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'A'))
    return acc
  }, [])

  for (const i in expanded) {
    const vocabularium = expanded[i]
    const nunjucks_json = {
      metadata: make_nj_metadata(ld, hostname),
      classes: nj_classes,
      properties: extract_properties_from_expanded_json(vocabularium),
      contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
      datatypes: nj_datatypes,
      parents: []
    }
    return nunjucks_json
  }
};

async function parse_ontology_from_json_ld_file_oj (json_ld_file, hostname, forceskos, language) {
  const ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'))
  const expanded = await jsonld.expand(ld)

  const grouped0 = group_properties_per_class_all(ld)
  const hier = class_hierarchy_extensional(ld.classes.concat(ld.externals))
  const grouped2 = group_properties_per_class_using_hierarchy(hier, grouped0)
  const codelist = getcodelist(ld)
  const package_map = get_package_map(ld)
  const classid_map = get_classid_map(ld)
  let dependencies = ld.dependencies
  if (!dependencies) { dependencies = [] };
  const aux = {
    codelist: codelist,
    dependencies: dependencies,
    package_map: package_map,
    classid_map: classid_map,
    forceskos: forceskos
  }
  const nj_classes = make_nj_classes(ld.classes, grouped2, aux, language)
  const nj_datatypes = make_nj_datatypes(ld.classes, grouped2, aux, language)

  const nj_editors = ld.editors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'E'))
    return acc
  }, [])
  const nj_contributors = ld.contributors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'C'))
    return acc
  }, [])
  const nj_authors = ld.authors.reduce(function (acc, elem) {
    acc.push(make_nj_person(elem, 'A'))
    return acc
  }, [])

  for (const i in expanded) {
    const vocabularium = expanded[i]
    const nunjucks_json = {
      metadata: make_nj_metadata(ld, hostname),
      classes: nj_classes,
      properties: extract_properties_from_expanded_json(vocabularium),
      contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
      datatypes: nj_datatypes,
      parents: []
    }
    return nunjucks_json
  }
};

async function parse_json_ld_file_to_exampletemplates (json_ld_file, hostname, language) {
  const ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'))
  // const expanded = await jsonld.expand(ld)
  // console.log(JSON.stringify(expanded));

  const grouped0 = group_properties_per_class_all(ld)
  const codelist = getcodelist(ld)
  const package_map = get_package_map(ld)
  const classid_map = get_classid_map(ld)
  let dependencies = ld.dependencies
  if (!dependencies) { dependencies = [] };

  const aux = {
    codelist: codelist,
    dependencies: dependencies,
    package_map: package_map,
    classid_map: classid_map,
    forceskos: false
  }
  const nj_classes = make_nj_classes(ld.classes.concat(ld.externals), grouped0, aux, language)
  const nj_datatypes = make_nj_datatypes(ld.classes.concat(ld.externals), grouped0, aux, language)
  // console.log(JSON.stringify(nj_classes) );

  const classes_json = {
    metadata: make_nj_metadata(ld, hostname),
    classes: nj_classes,
    datatypes: nj_datatypes,
    parents: []
  }
  return classes_json
};

function group_properties_per_class_all (json) {
  let classes = json.classes
  classes = classes.concat(json.externals)
  let properties = json.properties
  properties = properties.concat(json.externalproperties)

  return group_properties_per_class2(classes, properties, json)
};

function group_properties_per_class2 (classes, properties, json) {
  const grouped = new Map()
  let domain = []
  let v = []

  for (const key in classes) {
    grouped.set(classes[key].extra['EA-Name'], [])
  };
  for (const key in properties) {
    domain = []

    if (!Array.isArray(properties[key].domain)) {
      domain = [properties[key].domain]
    } else {
      domain = properties[key].domain
    };

    for (const d in domain) {
      v = []
      if (grouped.has(domain[d]['EA-Name'])) {
        v = grouped.get(domain[d]['EA-Name'])
        v.push(properties[key])
        grouped.set(domain[d]['EA-Name'], v)
      } else {
        grouped.set(domain[d]['EA-Name'], [properties[key]])
      }
    }
  };
  return grouped
};

// extensional_hierachy
function class_hierarchy_extensional (classes) {
  const hierarchy = new Map()
  const ext_hierarchy = new Map()
  let parents = []

  for (const key in classes) {
    push_value_to_map_array(hierarchy, classes[key].extra['EA-Name'], classes[key].extra['EA-Parents'])
  };

  // make extensional
  for (const key in classes) {
    parents = class_parents(100, hierarchy, classes[key].extra['EA-Name'])
    ext_hierarchy.set(classes[key].extra['EA-Name'], parents)
  };

  return ext_hierarchy
};

function class_parents (level, hierarchy, c) {
  if (level < 1) {
    console.log('ERROR: the derivation of the parents hit the limit for ' + c)
    return []
  } else {
    let parents = []
    if (hierarchy.has(c)) {
      const parents0 = hierarchy.get(c)
      let ancestors = []
      for (const p in parents0) {
        ancestors = class_parents(level - 1, hierarchy, parents0[p])
        parents.push(ancestors)
        if (parents0[p] !== '') {
          parents.push([parents0[p]])
        };
      };
    } else {
      parents = []
    }
    return parents.flatten()
  }
};

//
// map_array = map(key, [ ... ] )
//
// pushes a single value for a key to the map_array
function push_value_to_map_array (mamap, key, value) {
  let v = []
  if (mamap.has(key)) {
    v = mamap.get(key)
    v.push(value)
    mamap.set(key, v)
  } else {
    mamap.set(key, [value])
  }
};

//
// looks like order dependent. If the parent has not been handle befor the childern
// it gets an incomplete result

//
// add the classes serialised according to the childeren serialization...
function group_properties_per_class_using_hierarchy (hierarchy, grouped) {
  const hierarchy_grouped = new Map()
  let vv = []

  hierarchy.forEach(function (hvalue, hkey, hmap) {
    vv = []
    for (const akey in hvalue) {
      if (grouped.has(hvalue[akey])) {
        vv.push([grouped.get(hvalue[akey])])
      };
    };

    if (grouped.has(hkey)) {
      vv.push([grouped.get(hkey)])
    };
    hierarchy_grouped.set(hkey, vv.flatten().flatten())
  })
  return hierarchy_grouped
};

//
// map the range for each property to its document scoped version
//    * dependencies as given by the user
//    * package_map = {EA-class -> EA-Package}
//    * property_range = the EA-range of the property
function map_range (dependencies, package_map, property_range, property_range_uri, range_label, range_package, language) {
  let scoped_range = []
  if (package_map.has(property_range)) {
    // if it has a package then it is at least defined in the local space
    scoped_range = dependencies.reduce(function (acc, elem) {
      if (elem.package === package_map.get(property_range)) {
        // a dependency has been defined for this range
        acc = {
          //   range_uri : elem.packageurl + "#" + property_range,
          range_uri: '#' + range_label[language],
          range_puri: property_range_uri,
          range_label: range_label
        }
      }
      return acc
    },
    {
      range_uri: '#' + range_label[language],
      range_puri: property_range_uri,
      range_label: range_label
    }
    )
  } else {
    // not part of any package
    scoped_range = dependencies.reduce(function (acc, elem) {
      if (elem.package === range_package) {
        // a dependency has been defined for this range
        acc = {
          range_uri: elem.packageurl + '#' + property_range,
          range_puri: property_range_uri,
          range_label: range_label
        }
      }
      return acc
    },
    {
      range_uri: property_range_uri,
      range_puri: property_range_uri,
      range_label: range_label
    }
    )
  }

  return scoped_range
}

// if the class is member of the package_map (means the class is mentioned on the document)
// then it gets a scoped url, otherwise it uses the default.
function get_scoped_class_uri (dependencies, package_map, myname, mypackage, mylabel, mydefault) {
  // start with the default
  let scoped_class_uri = mydefault
  // if part of the published classes use relative scoped url
  if (package_map.has(myname)) {
    scoped_class_uri = '#' + mylabel
  };
  // overwrite with the package dependencies resolution
  scoped_class_uri = dependencies.reduce(function (acc, elem) {
    if (elem.package === mypackage) {
      acc = elem.packageurl + '#' + mylabel
    }
    return acc
  },
  scoped_class_uri
  )

  return scoped_class_uri
}

// note assumed is that EA-Parents is just a single value
// map: EA-Name -> EA-Package
function get_package_map (json) {
  const classes = json.classes.concat(json.externals)
  const package_map = new Map()

  for (const key in classes) {
    package_map.set(classes[key].extra['EA-Name'], classes[key].extra['EA-Package'])
  }
  return package_map
};

// map: EA-Name -> label
function get_classid_map (json) {
  const classes = json.classes.concat(json.externals)
  const classid_map = new Map()

  for (const key in classes) {
    if (classes[key].label) {
      classid_map.set(classes[key].extra['EA-Name'], classes[key].label)
    }
  }
  return classid_map
};

function get_classid (classid_map, eaname, language) {
  let classid = { [language]: eaname }
  if (classid_map.has(eaname)) {
    classid = classid_map.get(eaname)
  };
  return classid
};

//
// map EA-classnames to codelists
function getcodelist (json) {
  let classes = json.classes
  classes = classes.concat(json.externals)

  const codelistmap = new Map()
  for (const c in classes) {
    if (classes[c]['ap-codelist'] && classes[c]['ap-codelist'] !== '') {
      codelistmap.set(classes[c].extra['EA-Name'], classes[c]['ap-codelist'])
    }
  }
  return codelistmap
};

function make_nj_classes (classes, grouped, aux, language) {
  console.log('make nunjuncks classes')

  let nj_classes = []

  nj_classes = classes.reduce(function (accumulator, element) {
    if ((element.extra['EA-Type'] !== 'DATATYPE') && (element.extra['EA-Type'] !== 'ENUMERATION')) {
      accumulator.push(make_nj_class(element, grouped, aux, language))
    };
    return accumulator
  }, [])
  return nj_classes
};

function make_nj_datatypes (classes, grouped, aux, language) {
  console.log('make nunjuncks classes')

  let nj_classes = []

  nj_classes = classes.reduce(function (accumulator, element) {
    if (element.extra['EA-Type'] === 'DATATYPE') {
      accumulator.push(make_nj_class(element, grouped, aux, language))
    };
    return accumulator
  }, [])
  return nj_classes
};

/* create all info aof a class
   element = the EA-element which is a class
   grouped = an auxiliary structure which contains all properties per class
   aux = an auxiliary structure consisting of a codelists, package_map, dependency information
*/
function make_nj_class (element, grouped, aux, language) {
  const codelist = aux.codelist
  const dependencies = aux.dependencies
  const package_map = aux.package_map
  const classid_map = aux.classid_map
  const forceskos = aux.forceskos
  let prop = new Map()
  let props = []

  // basic class data
  const nj_class = {
    uri: element['@id'],
    name: get_neutral_attribute(element, 'name'),
    label: get_language_attribute(element, 'label', language),
    sort: get_sort(element, language),
    description: get_language_attribute(element, 'definition', language),
    usage: get_language_attribute(element, 'usage', language)
  }
  // if the class is actually a reuse of an class from another applicationprofile
  const scoped_class_uri = dependencies.reduce(function (acc, elem) {
    if (elem.package === element.extra['EA-Package']) {
      // a dependency has been defined for this class
      acc = elem.packageurl + '#' + element.extra['EA-Name']
    }
    return acc
  },
  ''
  )
  if (scoped_class_uri !== '') {
    nj_class.scopeduri = scoped_class_uri
  };

  // the superclasses of the class
  const parents = element.extra['EA-Parents2']
  const scoped_parents = parents.reduce(function (acc, elem) {
    if (elem.label !== '') {
      elem.scoped_uri = get_scoped_class_uri(dependencies, package_map, elem.name, elem.package, elem.label, elem.uri)
    } else {
      console.log('ERROR: a parent of ' + element.name + ' has no label, use EA-Name')
      elem.scoped_uri = get_scoped_class_uri(dependencies, package_map, elem.name, elem.package, elem.name, elem.uri)
      elem.label = elem.name
    }
    acc.push(elem)
    return acc
  },
  []
  )
  nj_class.parents = scoped_parents

  const gindex = element.extra['EA-Name']

  let g = []
  if (grouped.has(gindex)) {
    g = grouped[gindex]
    if (g == null) { g = [] };
    g = grouped.get(gindex)
    if (g == null) { g = [] };
  } else {
    g = []
  };
  props = []
  let range = []
  let codelisturi = ''
  let card = ''
  nj_class.properties = props
  Object.entries(g).forEach(
    ([pkey, value]) => {
      card = ''
      if (value.minCardinality && value.maxCardinality) {
        if (value.minCardinality === value.maxCardinality) {
          card = value.minCardinality
        } else {
          card = value.minCardinality + '..' + value.maxCardinality
        }
      }
      let scoped_range = []
      if (value.range) {
        range = value.range.reduce(function (racc, relem) {
          if (relem['EA-Name']) {
            racc.push({ range_label: relem['EA-Name'], range_uri: relem.uri })
          }
          return racc
        }, [])
        let rlabel = ''
        scoped_range = value.range.reduce(function (racc, relem) {
          if (relem['EA-Name']) {
            rlabel = get_classid(classid_map, relem['EA-Name'], language)
            racc.push(map_range(dependencies, package_map, relem['EA-Name'], relem.uri, rlabel, relem['EA-Package'], language))
          }
          return racc
        }, [])
      } else {
        range = []
        scoped_range = []
      };

      codelisturi = value.range.reduce(function (racc, relem) {
        if (relem['EA-Name']) {
          if (codelist.get(relem['EA-Name'])) {
            if (racc && racc !== '') { console.log('INFO: overwrite codelist reference: ' + racc) };
            racc = codelist.get(relem['EA-Name'])
          }
        }
        return racc
      }, value.extra['ap-codelist'])

      if (codelisturi !== '') {
        if (scoped_range == null || scoped_range[0] == null || scoped_range[0].range_uri == null) {
          console.log('ERROR: the range of property ' + value.name + ' is empty and not defined as a skos:Concept, force it')
          scoped_range[0] = {
            range_puri: 'http://www.w3.org/2004/02/skos/core#Concept',
            range_label: 'Concept',
            range_uri: 'http://www.w3.org/2004/02/skos/core#Concept'
          }
        } else {
          if (scoped_range[0].range_uri !== 'http://www.w3.org/2004/02/skos/core#Concept') {
            console.log('WARNING: the range of property ' + value.name + ': <' + value['@id'] + '> is not skos:Concept')
            if (forceskos) {
              console.log('WARNING: force it')
              scoped_range[0].range_uri = 'http://www.w3.org/2004/02/skos/core#Concept'
            }
          }
        }
      };

      prop = {
        uri: value['@id'],
        name: get_neutral_attribute(value, 'name'),
        sort: get_sort(value, language),
        label: get_language_attribute(value, 'label', language),
        description: get_language_attribute(value, 'definition', language),
        usage: get_language_attribute(value, 'usage', language),
        domain: value.domain,
        range: range,
        scopedrange: scoped_range,
        cardinality: card,
        codelist_uri: codelisturi
      }
      props.push(prop)
    })
  nj_class.properties = props

  return nj_class
};

function make_nj_class_voc (element, language) {
  const nj_class = {
    uri: element['@id'],
    name: get_neutral_attribute(element, 'name'),
    label: get_language_attribute(element, 'label', language),
    sort: get_sort(element, language),
    description: get_language_attribute(element, 'definition', language),
    usage: get_language_attribute(element, 'usage', language),
    equivalent: [],
    parents: element.parents
  }

  return nj_class
};

function get_language_attribute (element, attr, language) {
  if (element[attr] !== undefined && element[attr] != null && element[attr][language] !== undefined) {
    const attribute = element[attr]
    return attribute
  } else {
    return {}
  }
}

function get_neutral_attribute (element, attr) {
  if (element[attr] !== undefined && element[attr] != null) {
    const attribute = element[attr]
    return attribute
  } else {
    return {}
  }
}

// sort value: if label is present, use it, otherwise use UML name
function get_sort (element, language) {
  let sort = {}
  if (element.label !== undefined && element.label != null && element.label[language] !== undefined) {
    sort = element.label[language]
  } else {
    sort = get_neutral_attribute(element, 'name')
  }
  if (sort === {}) {
    sort = 'undefined'
  }
  return sort
}

function make_nj_ext_class_voc (element, language) {
  const nj_class = {
    uri: element['@id'],
    name: get_neutral_attribute(element, 'name'),
    label: get_language_attribute(element, 'label', language),
    description: get_language_attribute(element, 'definition', language),
    usage: get_language_attribute(element, 'usage', language),
    sort: get_sort(element, language)
  }

  if (nj_class.uri.startsWith('https://data.vlaanderen.be')) {
    nj_class.indvl = true
  } else {
    nj_class.indvl = false
  };
  if (nj_class.inpackage === 'ACTIVE_PACKAGE') {
    nj_class.inpackage = true
  } else {
    nj_class.inpackage = false
  };

  if (element.extra.Scope) {
    if (element.extra.Scope === 'TRANSLATIONS_ONLY') {
      nj_class.inscope = true
    } else {
      nj_class.inscope = false
    }
  }

  if (!nj_class.indvl && nj_class.inscope) {
    nj_class.show = true
  } else {
    nj_class.show = false
  }

  return nj_class
};

// TODO Why does this only work with String value, not object (no "description":{"en:" "String@en"} but "description":"String@en")
function make_nj_prop_voc (element, codelist, language) {
  const domain = element.domain.reduce(function (racc, relem) {
    if (relem['EA-Name']) {
      racc.push(relem.uri)
    }
    return racc
  }, [])
  const range = element.range.reduce(function (racc, relem) {
    if (relem['EA-Name']) {
      racc.push(relem.uri)
    }
    return racc
  }, [])
  const codelisturi = element.range.reduce(function (racc, relem) {
    if (relem['EA-Name']) {
      if (codelist.get(relem['EA-Name'])) {
        if (racc && racc !== '') { console.log('INFO: overwrite codelist reference: ' + racc) };
        racc = codelist.get(relem['EA-Name'])
      }
    }
    return racc
  }, element.extra['ap-codelist'])

  const nj_prop = {
    uri: element['@id'],
    name: get_neutral_attribute(element, 'name'),
    label: get_language_attribute(element, 'label', language),
    sort: get_sort(element, language),
    description: get_language_attribute(element, 'definition', language),
    usage: get_language_attribute(element, 'usage', language),
    domain: domain,
    range: range,
    parents: element.generalization

  }

  return nj_prop
};

function make_nj_ext_prop_voc (element, codelist, language) {
  const nj_prop = {
    uri: element['@id'],
    name: get_neutral_attribute(element, 'name'),
    label: get_language_attribute(element, 'label', language),
    description: get_language_attribute(element, 'definition', language),
    usage: get_language_attribute(element, 'usage', language),
    sort: get_sort(element, language)

  }
  if (element.extra.Scope) {
    if (element.extra.Scope === 'TRANSLATIONS_ONLY') {
      nj_prop.inscope = true
    } else {
      nj_prop.inscope = false
    }
  }

  if (nj_prop.uri.startsWith('https://data.vlaanderen.be')) {
    nj_prop.indvl = true
  } else {
    nj_prop.indvl = false
  };

  if (nj_prop.inpackage === 'ACTIVE_PACKAGE') {
    nj_prop.inpackage = true
  } else {
    nj_prop.inpackage = false
  };

  if (!nj_prop.indvl && nj_prop.inscope) {
    nj_prop.show = true
  } else {
    nj_prop.show = false
  }

  return nj_prop
};

// extract all the properties with a certain domain from the expanded json
// takes a class URI and an expanded json root object as it is was parsed
// by jsonld together with the context and returns all the properties who
// have as domain the URI passed.
//
// @param expanded the root class that was parsed by jsonld
// @param domain a string containing the URI of the class that you want the
//               domain to be restricted to
function extract_all_properties_with_domain_from_expanded_json (expanded, domain) {
  const properties = []
  const reverses = expanded['@reverse']
  const defined_enitities = reverses[uris.IS_DEFINED_BY]
  for (const i in defined_enitities) {
    const defined_entity = defined_enitities[i]
    const type = defined_entity['@type']
    if (class_in_type(uris.PROPERTY, type)) {
      const parsed_property = {
        uri: defined_entity['@id'],
        name: extract_language_strings(defined_entity[uris.NAME]),
        description: extract_language_strings(defined_entity[uris.DESCRIPTION]),
        domain: extract_strings(defined_entity[uris.DOMAIN]),
        range: extract_strings(defined_entity[uris.RANGE])
      }
      if (uris.GENERALIZATION in defined_entity) {
        parsed_property.parents = extract_strings(defined_entity[uris.GENERALIZATION])
      }
      if (uris.CARDINALITY in defined_entity) {
        parsed_property.cardinality = defined_entity[uris.CARDINALITY][0]['@value']
      }
      if (uris.USAGE in defined_entity) {
        parsed_property.usage = extract_language_strings(defined_entity[uris.USAGE])
      }
      if (parsed_property.domain.indexOf(domain) > -1) {
        properties.push(parsed_property)
      };
    }
  }
  return properties
};

// extract datatypes from expanded json
// Takes an expanded json root object as it is being parsed by jsonld
// together with the context such as it is being defined in the root of
// this repository and returns the datatypes that are being encoded within
// It in the form that the nunjucks template expects it.
// For an example please refer to the README.md.
//
// @param expanded the root class as it is being read by jsonld
function extract_datatypes_from_expanded_json (expanded) {
  const datatypes = []
  const reverses = expanded['@reverse']
  const defined_enitities = reverses[uris.IS_DEFINED_BY]
  for (const i in defined_enitities) {
    const defined_entity = defined_enitities[i]
    const type = defined_entity['@type']
    if (class_in_type(uris.DATATYPE, type)) {
      const new_datatype = {
        uri: defined_entity['@id'],
        name: extract_language_strings(defined_entity[uris.NAME]),
        description: extract_language_strings(defined_entity[uris.DESCRIPTION])
      }
      if (uris.USAGE in defined_entity) {
        new_datatype.usage = extract_language_strings(defined_entity[uris.USAGE])
      }
      const datatype_properties = extract_all_properties_with_domain_from_expanded_json(expanded, new_datatype.uri)
      if (datatype_properties.length > 0) {
        new_datatype.properties = datatype_properties
      }
      datatypes.push(new_datatype)
    }
  }
  return datatypes
};

// extract properties from expanded json
// Takes an expanded json root object as it is being parsed by jsonld
// together with the context such as it is being defined in the root of
// this repository and returns the properties that are being encoded within
// It in the form that the nunjucks template expects it.
// For an example please refer to the README.md.
//
// @param expanded the root class as it is being read by jsonld
function extract_properties_from_expanded_json (expanded) {
  const properties = []
  const reverses = expanded['@reverse']
  const defined_enitities = reverses[uris.IS_DEFINED_BY]
  for (const i in defined_enitities) {
    const defined_entity = defined_enitities[i]
    const type = defined_entity['@type']
    if (class_in_type(uris.PROPERTY, type)) {
      const parsed_property = {
        uri: defined_entity['@id'],
        name: extract_language_strings(defined_entity[uris.NAME]),
        description: extract_language_strings(defined_entity[uris.DESCRIPTION]),
        domain: extract_strings(defined_entity[uris.DOMAIN]),
        range: extract_strings(defined_entity[uris.RANGE])
      }
      if (uris.CARDINALITY in defined_entity) {
        parsed_property.cardinality = defined_entity[uris.CARDINALITY][0]['@value']
      }
      if (uris.USAGE in defined_entity) {
        parsed_property.usage = extract_language_strings(defined_entity[uris.USAGE])
      }
      if (uris.GENERALIZATION in defined_entity) {
        parsed_property.parents = extract_strings(defined_entity[uris.GENERALIZATION])
      }
      properties.push(parsed_property)
    }
  }
  return properties
};

// extract contributors from expanded json
// Takes an expanded json root object as it is being parsed by jsonld
// together with the context such as it is being defined in the root of
// this repository and returns the contributors that are being encoded within
// It in the form that the nunjucks template expects it. It also applies the
// correct role based on the predicate that connects this contributor to the
// ontology.
// For an example please refer to the README.md.
//
// The result of this function will look like:
// contributors: [
//     {
//         role: "A|E|C",
//         first_name: "fn",
//         last_name: "ln",
//         affiliation: {
//             name: "aff",
//             website: "url"
//         },
//         email: "a@a.com"
//     }
// ]
//
// @param expanded the root class as it is being read by jsonld
function make_nj_person (element, type) {
  const nj_person = {
    role: type,
    first_name: element['foaf:firstName'],
    last_name: element['foaf:lastName'],
    affiliation: {}

  }
  if (element.affiliation && element.affiliation['foaf:name']) {
    nj_person.affiliation.name = element.affiliation['foaf:name']
  };
  if (element.affiliation && element.affiliation['foaf:homepage']) {
    nj_person.affiliation.website = element.affiliation['foaf:homepage']
  };
  if (element['foaf:mbox']) { nj_person.email = element['foaf:mbox'] };
  return nj_person
}

// extract metadata from expanded json
// Takes an expanded json root object as it is being parsed by jsonld
// together with the context such as it is being defined in the root of
// this repository and returns the metadata for the ontology that is
// encoded within the json ld.
// It in the form that the nunjucks template expects it.
// For an example please refer to the README.md.
//
// @param expanded the root class as it is being read by jsonld

// the values in this config will be always Dutch
// translation (EN, FR, ...) are collected from other sources
function make_nj_metadata (json, hostname) {
  let hn = json.hostname
  if (hn == null) {
    hn = (hostname != null) ? hostname : 'https://data.vlaanderen.be'
  }
  if (json.navigation) {
    json.navigation.self = hn + json.urlref
  } else {
    console.log('Warning: no navigation defined for this rendering')
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
  if (!json.license || json.license === '') {
    // set default value
    json.license = 'https://data.vlaanderen.be/id/licentie/modellicentie-gratis-hergebruik/v1.0'
  }

  let documentconfig = {}	
  if (!json.documentconfig || json.documentconfig === '') {
    // set default value
    documentconfig = {}
  } else {
    documentconfig = json.documentconfig
  }


  const meta = {
    title: json.title,
    uri: json['@id'],
    issued: json['publication-date'],
    baseURI: json.baseURI,
    baseURIabbrev: json.baseURIabbrev,
    filename: json.name,
    navigation: json.navigation,
    license: json.license,
    documenttype: json.type,
    documentconfig: documentconfig,	  
    status: docstatus,
    statuslabel: docstatuslabel,
    repositoryurl: json.repository + '/tree/' + json.documentcommit,
    changelogurl: json.repository + '/blob/' + json.documentcommit + '/CHANGELOG',
    feedbackurl: json.feedbackurl,
    standaardregisterurl: json.standaardregisterurl,
    dependencies: json.dependencies,
    usesVocs: [],
    usesAPs: []
  }
  return meta
};

// class in type
// returns true if the passed classname is found within
// one of the strings in the types array
//
// example:
// > class_in_type("http://example.com/Example", [ "http://example.com/Test" ])
// > false
// > class_in_type("http://example.com/Example", [ "http://example.com/Example", ... ])
// > true
//
// @param classname the name of the class that is being checked
// @param types an array of strings representing types
function class_in_type (classname, types) {
  for (const i in types) {
    const type = types[i]
    if (type.indexOf(classname) > -1) {
      return true
    }
  }
  return false
};

// extract language strings
// Takes a string bag as it is being produced by jsonld when
// expanding a json ld object and returns the strings in
// it with the languages being the keys and the values the
// values.
//
// example:
// > extract_langageu_strings([{"@value":"house", "@language": "en"}])
// > { en: "house"}
//
// @param expanded_string_bags an array of string as they are being
//                             parsed by jsonld
function extract_language_strings (expanded_string_bag) {
  const bag = {}
  for (const i in expanded_string_bag) {
    const language_string = expanded_string_bag[i]
    bag[language_string['@language']] = language_string['@value']
  }
  return bag
};

// extract strings
// takes a string bag as it is being produced by jsonld when
// expanding a json ld object and returns the strings in
// it as an array.
//
// example:
// > extract_langageu_strings([{"@value":"house", "@language": "en"}])
// > [ "house" ]
//
// @param expanded_string_bags an array of string as they are being
//                             parsed by jsonld
function extract_strings (expanded_string_bag) {
  const bag = []
  for (const i in expanded_string_bag) {
    const string = expanded_string_bag[i]
    bag.push(string['@value'])
  }
  return bag
};

module.exports = { parse_ontology_from_json_ld_file_voc, parse_ontology_from_json_ld_file_ap, parse_ontology_from_json_ld_file_oj, parse_ontology_from_json_ld_file_all, parse_json_ld_file_to_exampletemplates }
