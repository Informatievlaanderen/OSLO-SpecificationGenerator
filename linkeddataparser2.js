const fs = require("fs");
const jsonld = require('jsonld');
const uris = require('./uris');

var Map = require("collections/map");
var Set = require("collections/set");

require("collections/shim-array");

//


/**
 * This is an adapted version of the orginal parser, it uses the json instead of the expanded jsonld representation
 * The purpose is to create the desired nunjuncks_json structure
 *
 * The linked data parser library provides support for converting
 * json ld files to a form that the nunjucks templates as they have been
 * defined on the data.vlaanderen.be repository can process.
 *
 * It's main entry points is parse_ontology_from_json_ld_file(json_ld_file, template_file)
 **/


    //
    // parse ontology from json ld
    // this function takes a reference to a json ld file containing
    // the description of an ontology encoded in json ld format and
    // returns a representation of that ontology that can be rendered
    // by the nunjucks template.
    //
    // @param filename the name of the file that contains the json ld representation
async function    parse_ontology_from_json_ld_file_voc(json_ld_file, hostname) {
        var ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'));
        expanded = await jsonld.expand(ld);
        //console.log(JSON.stringify(expanded));
        
        var codelist = getcodelist(ld);
        var nj_classes = ld.classes.reduce(function (acc, elem) {
		acc.push(make_nj_class_voc(elem));
		return acc;
            }, []);
        var nj_properties = ld.properties.reduce(function (acc, elem) {
		acc.push(make_nj_prop_voc(elem,codelist));
		return acc;
            }, []);
        var nj_ext_classes_list = ld.externals.reduce(function (acc, elem) {
	        var candidate = make_nj_ext_class_voc(elem);
		if (candidate.name && candidate.name.nl && candidate.show ) { acc.push(candidate) };
		return acc;
            }, []);
        var nj_ext_classes_set= new Set(nj_ext_classes_list);
        var nj_ext_classes = nj_ext_classes_set.toArray();
        var nj_ext_properties_list = ld.externalproperties.reduce(function (acc, elem) {
	        var candidate = make_nj_ext_prop_voc(elem, codelist);
		if (candidate.name && candidate.name.nl && candidate.show ) { acc.push(candidate) };
		return acc;
            }, []);
	    //console.log(JSON.stringify(nj_classes) );
        var nj_ext_properties_set= new Set(nj_ext_properties_list);
        var nj_ext_properties = nj_ext_properties_set.toArray();
	var nj_editors = ld.editors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "E"));
		return acc;
		}, []);
	var nj_contributors = ld.contributors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "C"));
		return acc;
		}, []);
	var nj_authors = ld.authors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "A"));
		return acc;
		}, []);
       
        for(i in expanded) {
            var vocabularium = expanded[i];
            var nunjucks_json = {
                metadata: make_nj_metadata(ld,hostname),
                classes: nj_classes,
                properties: nj_properties,
                contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
                external_terms: nj_ext_classes.concat(nj_ext_properties)
            };
            var datatypes = extract_datatypes_from_expanded_json(vocabularium);
            if(datatypes.length > 0) {
                nunjucks_json.datatypes = datatypes;
            }
            return nunjucks_json;
        }
    };


async function    parse_ontology_from_json_ld_file_ap(json_ld_file, hostname, forceskos) {
        var ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'));
        expanded = await jsonld.expand(ld);
        //console.log(JSON.stringify(expanded));
        
        var grouped0 = group_properties_per_class_all(ld);
        var codelist = getcodelist(ld);
        var package_map = get_package_map(ld);
        var classid_map = get_classid_map(ld);
        var dependencies = ld['dependencies'];
        if (! dependencies) { dependencies = []};
        var aux = {
		codelist: codelist,
		dependencies: dependencies,
		package_map: package_map,
		classid_map: classid_map,
		forceskos: forceskos
		};
        var nj_classes = make_nj_classes(ld.classes, grouped0, aux);
        var nj_datatypes = make_nj_datatypes(ld.classes, grouped0, aux);
       
	var nj_editors = ld.editors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "E"));
		return acc;
		}, []);
	var nj_contributors = ld.contributors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "C"));
		return acc;
		}, []);
	var nj_authors = ld.authors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "A"));
		return acc;
		}, []);
        for(i in expanded) {
            var vocabularium = expanded[i];
            var nunjucks_json = {
                metadata: make_nj_metadata(ld,hostname),
                classes: nj_classes,
                properties: extract_properties_from_expanded_json(vocabularium),
                contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
		datatypes: nj_datatypes,
                parents: []
            };
            return nunjucks_json;
        }
    };

async function    parse_ontology_from_json_ld_file_all(json_ld_file, hostname, forceskos) {
        var ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'));
        expanded = await jsonld.expand(ld);
        //console.log(JSON.stringify(expanded));
        
        var grouped0 = group_properties_per_class_all(ld);
        var codelist = getcodelist(ld);
        var package_map = get_package_map(ld);
        var classid_map = get_classid_map(ld);
        var dependencies = ld['dependencies'];
        if (! dependencies) { dependencies = []};
        var aux = {
		codelist: codelist,
		dependencies: dependencies,
		package_map: package_map,
		classid_map: classid_map,
		forceskos: forceskos
		};
        var nj_classes = make_nj_classes(ld.classes.concat(ld.externals), grouped0, aux);
        var nj_datatypes = make_nj_datatypes(ld.classes.concat(ld.externals), grouped0, aux);
	    //console.log(JSON.stringify(nj_classes) );
	var nj_editors = ld.editors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "E"));
		return acc;
		}, []);
	var nj_contributors = ld.contributors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "C"));
		return acc;
		}, []);
	var nj_authors = ld.authors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "A"));
		return acc;
		}, []);
       
        for(i in expanded) {
            var vocabularium = expanded[i];
            var nunjucks_json = {
                metadata: make_nj_metadata(ld,hostname),
                classes: nj_classes,
                properties: extract_properties_from_expanded_json(vocabularium),
                contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
		datatypes: nj_datatypes,
                parents: []
            };
            return nunjucks_json;
        }
    };

async function    parse_ontology_from_json_ld_file_oj(json_ld_file, hostname, forceskos) {
        var ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'));
        expanded = await jsonld.expand(ld);
        //console.log(JSON.stringify(expanded));
        
        var grouped0 = group_properties_per_class_all(ld);
	    //console.log(grouped0);
        hier = class_hierarchy_extensional(ld['classes'].concat(ld['externals']))  ;
        var grouped2 = group_properties_per_class_using_hierarchy(hier, grouped0);
        var codelist = getcodelist(ld);
        var package_map = get_package_map(ld);
        var classid_map = get_classid_map(ld);
        var dependencies = ld['dependencies'];
        if (! dependencies) { dependencies = []};
        var aux = {
		codelist: codelist,
		dependencies: dependencies,
		package_map: package_map,
		classid_map: classid_map,
		forceskos: forceskos
		};
        var nj_classes = make_nj_classes(ld.classes, grouped2, aux);
	    //console.log(JSON.stringify(nj_classes) );
        var nj_datatypes = make_nj_datatypes(ld.classes, grouped2, aux);
       
	var nj_editors = ld.editors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "E"));
		return acc;
		}, []);
	var nj_contributors = ld.contributors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "C"));
		return acc;
		}, []);
	var nj_authors = ld.authors.reduce(function(acc, elem) {
	var nj_authors = ld.authors.reduce(function(acc, elem) {
		acc.push(make_nj_person(elem, "A"));
		return acc;
		}, []);
		acc.push(make_nj_person(elem, "A"));
		return acc;
		}, []);

        for(i in expanded) {
            var vocabularium = expanded[i];
            var nunjucks_json = {
                metadata: make_nj_metadata(ld,hostname),
                classes: nj_classes,
                properties: extract_properties_from_expanded_json(vocabularium),
                contributors: nj_authors.concat(nj_editors).concat(nj_contributors),
		datatypes: nj_datatypes,
                parents: []
            };
            return nunjucks_json;
        }
    };
   

async function    parse_json_ld_file_to_exampletemplates(json_ld_file, hostname) {
        var ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'));
        expanded = await jsonld.expand(ld);
        //console.log(JSON.stringify(expanded));
        
        var grouped0 = group_properties_per_class_all(ld);
        var codelist = getcodelist(ld);
        var package_map = get_package_map(ld);
        var classid_map = get_classid_map(ld);
        var dependencies = ld['dependencies'];
        if (! dependencies) { dependencies = []};

        var aux = {
		codelist: codelist,
		dependencies: dependencies,
		package_map: package_map,
		classid_map: classid_map,
		forceskos: false
		};
        var nj_classes = make_nj_classes(ld.classes.concat(ld.externals), grouped0, aux);
        var nj_datatypes = make_nj_datatypes(ld.classes.concat(ld.externals), grouped0, aux);
	    //console.log(JSON.stringify(nj_classes) );
       
        for(i in expanded) {
            var vocabularium = expanded[i];
            var classes_json = {
                metadata: make_nj_metadata(ld,hostname),
                classes: nj_classes,
		datatypes: nj_datatypes,
                parents: []
            };
            return classes_json;
        }
    };


    //
    // group the properties per class using the domain
    //   - variant 1: include only those which are identified as full members of the document
    //   - variant 2: include all classes and properties
    //
function     group_properties_per_class(json) {
            var classes = json['classes'];
            var properties = json['properties'];
            return group_properties_per_class2(classes, properties, json) 
    };

function     group_properties_per_class_all(json) {
            var classes = json['classes'];
            classes = classes.concat(json['externals']);
            var properties = json['properties'];
            properties = properties.concat(json['externalproperties']);
    	    
            return group_properties_per_class2(classes, properties, json) 
    };

function     group_properties_per_class2(classes, properties, json) {
            var grouped = new Map();
            var domain = [];
            var v = [];
            var vv = [];


            for (var key in classes ) {
                grouped.set(classes[key]['extra']['EA-Name'],  [])
            };
            for (var key in properties) {
           domain=[];

           if (!Array.isArray(properties[key].domain)) {
              domain = [properties[key].domain]
           } else {
              domain = properties[key].domain
           };

           for (var d in domain) {
                v = [];
               if (grouped.has(domain[d]['EA-Name'])) {
		   v = grouped.get(domain[d]['EA-Name']);
		   v.push(properties[key]);
		   grouped.set(domain[d]['EA-Name'], v)       
               } else {
		   grouped.set(domain[d]['EA-Name'],  [properties[key]]);
               }}
            };
            return grouped;
        };

     // note assumed is that EA-Parents is just a single value
function      class_hierarchy_parents(classes) { 
           var hierarchy = new Map(); 
           var v = [];
           
           for (var key in classes) {
                 push_value_to_map_array(hierarchy, classes[key]['extra']['EA-Name'], classes[key]['extra']['EA-Parents'])
           }
        return hierarchy
	
     };
    // support EA-Parents2 which is a list
function     class_hierarchy_parents2(classes) { 
           var hierarchy = new Map(); 
           var v = [];
           
           for (var key in classes) {
		 for (var p in classes[key]['extra']['EA-Parents2'] ) {
                 	push_value_to_map_array(hierarchy, classes[key]['extra']['EA-Name'], p.name)
		}
           }
        return hierarchy
	
     };

     // note assumed is that EA-Parents is just a single value
function      class_hierarchy_childern(classes) { 
           var hierarchy = new Map(); 
           var v = [];
           
           for (var key in classes) {
                push_value_to_map_array(hierarchy, classes[key]['extra']['EA-Parents'], classes[key]['extra']['EA-Name'])
           }
        return hierarchy
	
     };

function      class_hierarchy_childern2(classes) { 
           var hierarchy = new Map(); 
           var v = [];
           
           for (var key in classes) {
		 for (var p in classes[key]['extra']['EA-Parents2'] ) {
                	push_value_to_map_array(hierarchy, p.name, classes[key]['extra']['EA-Name'])
		}
           }
        return hierarchy
	
     };

     // extensional_hierachy
function      class_hierarchy_extensional(classes) { 
           var hierarchy = new Map(); 
           var ext_hierarchy = new Map(); 
           var parents = [];
           
           for (var key in classes) {
                push_value_to_map_array(hierarchy, classes[key]['extra']['EA-Name'], classes[key]['extra']['EA-Parents'])
           };

           // make extensional
           for (var key in classes) {
                parents = class_parents(100, hierarchy, classes[key]['extra']['EA-Name'])
                ext_hierarchy.set(classes[key]['extra']['EA-Name'], parents)
           };
              
        return ext_hierarchy
	
     };

function      class_hierarchy_extensional2(classes) { 
           var hierarchy = new Map(); 
           var ext_hierarchy = new Map(); 
           var parents = [];
           
           for (var key in classes) {
		 for (var p in classes[key]['extra']['EA-Parents2'] ) {
                	push_value_to_map_array(hierarchy, classes[key]['extra']['EA-Name'], p);
		}
           };

           // make extensional
           for (var key in classes) {
                parents = class_parents(100, hierarchy, classes[key]['extra']['EA-Name'])
                ext_hierarchy.set(classes[key]['extra']['EA-Name'], parents)
           };
              
        return ext_hierarchy
	
     };


function     class_parents(level, hierarchy, c) {
        if (level < 1) {
            console.log('ERROR: the derivation of the parents hit the limit for ' + c);
            return [];
        } else {
	    if (hierarchy.has(c)) {
            let parents0 = hierarchy.get(c);
	    var parents =[];
            var ancestors = [];
            for (var p in parents0)  {
                ancestors = class_parents(level -1, hierarchy, parents0[p]);
                parents.push(ancestors);
		if (parents0[p] !== '') {
		    parents.push([parents0[p]]);
			    };
                 };
	    } else { 
		    parents = []
	    }
            return parents.flatten();
        }
    };
    
    //
    // unique_elements in arrqy
    //
function     array_unique_elements(array) {
        var m = new Map();

        for (var e in array) {
            m.set(e, 1)
        };
 
        return m.keys();       
    };


    //
    // map_array = map(key, [ ... ] )
    // 
    // pushes a single value for a key to the map_array
function     push_value_to_map_array(mamap, key, value) {
       var v = [];
       if (mamap.has(key)) {
       	v = mamap.get(key);
        v.push(value);
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
function     group_properties_per_class_using_hierarchy(hierarchy, grouped) {
            var hierarchy_grouped = new Map();
            var v = [];
            var vv = [];

            hierarchy.forEach(function(hvalue, hkey, hmap) {
            vv = [];
                for (var akey in hvalue) {
		   if (grouped.has(hvalue[akey])) {
                          vv.push([grouped.get(hvalue[akey])]);
		   };
                };

		   if (grouped.has(hkey)) {
                          vv.push([grouped.get(hkey)]);
		   };
                hierarchy_grouped.set(hkey, vv.flatten().flatten())
            }); 
            return hierarchy_grouped;
  };

  //
  // map the range for each property to its document scoped version
  //    * dependencies as given by the user
  //    * package_map = {EA-class -> EA-Package}
  //    * property_range = the EA-range of the property
  //    scoped_range = 
//    HARDCODED SELECTION OF .nl label
function map_range(dependencies, package_map, property_range, property_range_uri, range_label, range_package) {
	if ( package_map.has(property_range) ) {
               // if it has a package then it is at least defined in the local space
	       scoped_range = dependencies.reduce(function(acc, elem) {
		if (elem.package === package_map.get(property_range)) {
		  // a dependency has been defined for this range
		  acc = {
//			range_uri : elem.packageurl + "#" + property_range,
		        range_uri : "#" + range_label.nl,
			range_puri : property_range_uri,
			range_label : range_label
			}
		}
		return acc;
		}, 
		  { range_uri : "#" + range_label.nl,
		    range_puri : property_range_uri,
		    range_label : range_label}
                 );
	} else {
        // not part of any package
	       scoped_range = dependencies.reduce(function(acc, elem) {
		if (elem.package === range_package) {
		  // a dependency has been defined for this range
		  acc = {
			range_uri : elem.packageurl + "#" + property_range,
			range_puri : property_range_uri,
			range_label : range_label
			}
		}
		return acc;
		}, 
                    {
			range_uri : property_range_uri,
		        range_puri : property_range_uri,
			range_label : range_label
			}
                 );
	}

   	return scoped_range;
}

   // if the class is member of the package_map (means the class is mentioned on the document)
   // then it gets a scoped url, otherwise it uses the default.
function get_scoped_class_uri(dependencies, package_map, myname, mypackage, mylabel, mydefault) {

	// start with the default
   var scoped_class_uri = mydefault;
	// if part of the published classes use relative scoped url
   if ( package_map.has(myname) ) {
      scoped_class_uri = "#" + mylabel;
    };
	// overwrite with the package dependencies resolution
      scoped_class_uri = dependencies.reduce(function(acc, elem) {
		if (elem.package === mypackage) {
		    acc = elem.packageurl + "#" + mylabel
		}
		return acc;
		}, 
		scoped_class_uri
		);

    return scoped_class_uri;
}


     // note assumed is that EA-Parents is just a single value
     // map: EA-Name -> EA-Package
function  get_package_map(json) { 
           var classes = json['classes'].concat(json['externals']);
           var package_map = new Map(); 
           
           for (var key in classes) {
                 package_map.set( classes[key]['extra']['EA-Name'], classes[key]['extra']['EA-Package'])
           }
        return package_map
	
     };

     // map: EA-Name -> label
function  get_classid_map(json) { 
           var classes = json['classes'].concat(json['externals']);
           var classid_map = new Map(); 
           
           for (var key in classes) {
		if (classes[key].label) {
                 classid_map.set( classes[key]['extra']['EA-Name'], classes[key].label)
		}
           }
        return classid_map 
	
     };

function get_classid(classid_map, eaname) {
	var classid = { nl: eaname };
	if (classid_map.has(eaname)) {
		classid =  classid_map.get(eaname)
	}; 
	return classid;
	};




   //
   // map EA-classnames to codelists
function    getcodelist(json) {
      var classes = json['classes'];
      classes = classes.concat(json['externals']);

      var codelistmap = new Map();
      for (var c in classes) {
	if (classes[c]['ap-codelist'] && classes[c]['ap-codelist'] !== "") {
	    codelistmap.set(classes[c]['extra']['EA-Name'], classes[c]['ap-codelist'])
	}
      }
      return codelistmap;
    };
        
   //
   // make the classes structure based on the grouping
   //
function    make_nj_classes2(classes, grouped) {

   console.log('make nunjuncks classes');

   var nj_classes= [];
   var nj_class = new Map();
   var prop= new Map();
   var props =[];
 

   classes.forEach(function(element) { 
    
     
     nj_class = {
                    uri: element["@id"],
                    name: element.name,
                    description: element.description,
                    usage: element.usage
                }
     //console.log(nj_class);	   

     var gindex = element['extra']['EA-Name'];

     var g = [];
     if (grouped.has(gindex)) {
     var g=grouped[gindex];
	   //console.log(g);
	   if (g == null) {g = []};
     var g= grouped.get(gindex);
	   //console.log(g);
	   if (g == null) {g = []};
     } else {
	     g =[]
     };
     props=[];
     var range = {};
     nj_class.properties = props;
     Object.entries(g).forEach(
	    ([pkey, value]) => {
	      var card = value.minCardinality + ".." + value.maxCardinality;
	      // TODO: bug if no range is given
              if (value.range && value.range[0] && value.range[0]['EA-Name']) {
		  range = {label: value.range[0]['EA-Name'], uri: value.range[0].uri}
              } else {
		  range = {}
	      };
              prop = {
                    uri: value["@id"],
                    name: value.name,
                    description: value.description,
                    usage: value.usage,
                    domain: value.domain,
		    range: range,
		    cardinality: card,
                    codelist_uri: "" // TODO
                    }
              props.push( prop);
  	  });
     nj_class.properties = props;
     nj_classes.push(nj_class);
    });

 
   return nj_classes;
};

function make_nj_classes(classes, grouped, aux) {

   console.log('make nunjuncks classes');

   var nj_classes= [];

   nj_classes = classes.reduce(function(accumulator, element) { 
	   if ((element['extra']['EA-Type'] !== 'DATATYPE') && (element['extra']['EA-Type'] !== 'ENUMERATION')) {
	   accumulator.push(make_nj_class(element, grouped, aux ));
	   };
	   return accumulator;
   }, []);
	return nj_classes;
};

function make_nj_datatypes(classes, grouped, aux) {

   console.log('make nunjuncks classes');

   var nj_classes= [];

   nj_classes = classes.reduce(function(accumulator, element) { 
	   if (element['extra']['EA-Type'] === 'DATATYPE') {
	   accumulator.push(make_nj_class(element, grouped, aux ));
	   };
	   return accumulator;
   }, []);
	return nj_classes;
};

function make_nj_enumerations(classes) {

   console.log('make nunjuncks enumerations ');

   var nj_classes= [];

   nj_classes = classes.reduce(function(accumulator, element) { 
	   if (element['extra']['EA-Type'] === 'ENUMERATION') {
	   accumulator.push(make_nj_enumeration(element ));
	   };
	   return accumulator;
   }, []);
	return nj_classes;
};

function make_nj_enumeration(element ) {
     
   // basic enum data
   var  nj_enumeration = {
                    uri: element["@id"],
                    name: element.name,
                    sort_nl: element.name.nl,
                    description: element.description,
                    usage: element.usage
		};

   if (element['extra']['codelist']) { nj_enumeration.codelist = element['extra']['codelist'] };

}



/* create all info aof a class
   element = the EA-element which is a class
   grouped = an auxiliary structure which contains all properties per class
   aux = an auxiliary structure consisting of a codelists, package_map, dependency information
*/
function make_nj_class(element, grouped, aux ) {
   var codelist = aux.codelist;
   var dependencies = aux.dependencies;
   var package_map = aux.package_map;
   var classid_map = aux.classid_map;
   let forceskos = aux.forceskos;
   var prop= new Map();
   var props =[];
     
   // basic class data
   var  nj_class = {
                    uri: element["@id"],
                    name: element.name,
                    sort_nl: element.name.nl,
                    description: element.description,
                    usage: element.usage
                }
   // if the class is actually a reuse of an class from another applicationprofile
   var scoped_class_uri = dependencies.reduce(function(acc, elem) {
		if (elem.package === element.extra['EA-Package']) {
		  // a dependency has been defined for this class
		  acc = elem.packageurl + "#" + element.extra['EA-Name']
		}
		return acc;
		}, 
		""
		);
    if (scoped_class_uri !== "") {
	nj_class.scopeduri = scoped_class_uri
	};

    // the superclasses of the class
    var parents = element.extra['EA-Parents2'];
    var scoped_parents = parents.reduce(function(acc, elem) {
		if (elem.label !== "") {
		   elem.scoped_uri = get_scoped_class_uri(dependencies, package_map, elem.name, elem.package, elem.label, elem.uri) 
		} else {
		   console.log("ERROR: a parent of " + element.name + " has no label, use EA-Name");
		   elem.scoped_uri = get_scoped_class_uri(dependencies, package_map, elem.name, elem.package, elem.name, elem.uri) 
                   elem.label = elem.name
		}
		acc.push(elem)
		return acc;
		},
		[]
		);
    nj_class.parents = scoped_parents;

     //console.log(nj_class);	   

     var gindex = element['extra']['EA-Name'];

     var g = [];
     if (grouped.has(gindex)) {
     var g=grouped[gindex];
	   //console.log(g);
	   if (g == null) {g = []};
     var g= grouped.get(gindex);
	   //console.log(g);
	   if (g == null) {g = []};
     } else {
	     g =[]
     };
     props=[];
     var range = [];
     var codelisturi = "";
     var card = "";
     nj_class.properties = props;
     Object.entries(g).forEach(
	    ([pkey, value]) => {
              card = "";
	      if (value.minCardinality && value.maxCardinality) {
		  if (value.minCardinality == value.maxCardinality) {
			card = value.minCardinality;
		  } else {
	          card = value.minCardinality + ".." + value.maxCardinality;
		  }
		} 
			
	      if (value.range) {
              range = value.range.reduce(function(racc, relem) { 
               if (relem['EA-Name']) {
		  racc.push({range_label: relem['EA-Name'], range_uri: relem.uri});
                  } 
  		  return racc;
               }, []);
              var rlabel="";
              scoped_range = value.range.reduce(function(racc, relem) { 
               if (relem['EA-Name']) {
		  rlabel = get_classid(classid_map,relem['EA-Name']);
		  racc.push(map_range(dependencies, package_map, relem['EA-Name'], relem.uri, rlabel, relem['EA-Package']));
                  } 
  		  return racc;
               }, []);
	      } else {
		range = []
		scoped_range = []
	      };

              codelisturi = value.range.reduce(function(racc, relem) { 
               	  if (relem['EA-Name']) {
		      if (codelist.get(relem['EA-Name'])) {
	                if (racc && racc !== "") { console.log('INFO: overwrite codelist reference: ' + racc)};	    
			racc = codelist.get(relem['EA-Name']);
		      }
                  } 
  		  return racc;
               }, value.extra["ap-codelist"] );

	      if ( codelisturi != "" ) {
		if ( scoped_range == null || scoped_range[0] == null || scoped_range[0].range_uri == null ) {
		    console.log("ERROR: the range of property " + value.name.nl + "is empty and not defined as a skos:Concept, force it");
	            scoped_range[0] = {
			range_puri : "http://www.w3.org/2004/02/skos/core#Concept",
			range_label : "Concept",
                        range_uri : "http://www.w3.org/2004/02/skos/core#Concept" 
			}
		    
		} else {
		
		if ( scoped_range[0].range_uri != "http://www.w3.org/2004/02/skos/core#Concept" ) {
		    console.log("WARNING: the range of property " + value.name.nl + ": <" + value["@id"] + "> is not skos:Concept");
		    if (forceskos) {
		    	console.log("WARNING: force it");
			scoped_range[0].range_uri = "http://www.w3.org/2004/02/skos/core#Concept" ;
			}
	      }}};
              
              prop = {
                    uri: value["@id"],
                    name: value.name,
  		    sort_nl: value.name.nl,
                    description: value.description,
                    usage: value.usage,
                    domain: value.domain,
		    range: range,
		    scopedrange: scoped_range,
		    cardinality: card,
                    codelist_uri: codelisturi
                    }
              props.push( prop);
  	  });
     nj_class.properties = props;

     return nj_class;
};

function make_nj_class_voc(element) {
     
   var  nj_class = {
                    uri: element["@id"],
                    name: element.name,
                    sort_nl: element.name.nl,
                    description: element.description,
                    usage: element.usage,
                    equivalent:  [],
                    parents: element.parents
                }


     return nj_class;
};

function make_nj_ext_class_voc(element) {
   
     
   var  nj_class = {
                    uri: element["@id"],
                    name: element.name,
                    description: element.description,
		    usage: element.usage,
                    sort_nl: element.name.nl
                }

   if (nj_class.uri.startsWith("https://data.vlaanderen.be")) {
        nj_class.indvl = true
   } else {
        nj_class.indvl = false
   };
   if (nj_class.inpackage == "ACTIVE_PACKAGE") {
        nj_class.inpackage = true
   } else {
        nj_class.inpackage = false
   };

   if (element.extra.Scope) {
      if (element.extra.Scope == "TRANSLATIONS_ONLY") {
	 nj_class.inscope = true
      } else {
         nj_class.inscope = false
      }
   }

   if (! nj_class.indvl && nj_class.inscope) {
      nj_class.show = true
   } else {
      nj_class.show = false
   }

     return nj_class;
};


function make_nj_prop_voc(element, codelist) {

              var domain = element.domain.reduce(function(racc, relem) { 
               if (relem['EA-Name']) {
		  racc.push(relem.uri);
                  } 
  		  return racc;
               }, []);
              var range = element.range.reduce(function(racc, relem) { 
               if (relem['EA-Name']) {
		  racc.push(relem.uri);
                  } 
  		  return racc;
               }, []);
              var codelisturi = element.range.reduce(function(racc, relem) { 
               	  if (relem['EA-Name']) {
		      if (codelist.get(relem['EA-Name'])) {
	                if (racc && racc !== "") { console.log('INFO: overwrite codelist reference: ' + racc)};	    
			racc = codelist.get(relem['EA-Name']);
		      }
                  } 
  		  return racc;
               }, element.extra["ap-codelist"] );
              
              var nj_prop = {
                    uri: element["@id"],
                    name: element.name,
  		    sort_nl: element.name.nl,
                    description: element.description,
                    usage: element.usage,
                    domain: domain,
		    range: range,
		    parents: element.generalization

                    }


     return nj_prop;
};

function make_nj_ext_prop_voc(element, codelist) {

              
              var nj_prop = {
                    uri: element["@id"],
                    name: element.name,
                    description: element.description,
		    usage: element.usage,
  		    sort_nl: element.name.nl,

                    }
   if (element.extra.Scope) {
      if (element.extra.Scope == "TRANSLATIONS_ONLY") {
	 nj_prop.inscope = true
      } else {
         nj_prop.inscope = false
      }
   }

   if (nj_prop.uri.startsWith("https://data.vlaanderen.be")) {
        nj_prop.indvl = true
   } else {
        nj_prop.indvl = false
   };

   if (nj_prop.inpackage == "ACTIVE_PACKAGE") {
        nj_prop.inpackage = true
   } else {
        nj_prop.inpackage = false
   };

   if (! nj_prop.indvl && nj_prop.inscope) {
      nj_prop.show = true
   } else {
      nj_prop.show = false
   }
   
   return nj_prop;

};


function    make_nj_properties_from_classes(nj_classes) {
	var mylist = nj_classes.reduce(function(acc, elem) {
	 acc.push(elem.properties);  
         return acc;
	}, []);
        var myset = new Set(mylist);
        return myset.toArray();
}

    // extract classes from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the classes that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
function    extract_classes_from_expanded_json(expanded) {
        var classes = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( class_in_type(uris.CLASS, type)) {
                var new_class = {
                    uri: defined_entity["@id"],
                    name: extract_language_strings(defined_entity[uris.NAME]),
                    description: extract_language_strings(defined_entity[uris.DESCRIPTION])
                };
                if(uris.USAGE in defined_entity) {
                    new_class.usage = extract_language_strings(defined_entity[uris.USAGE]);
                }
                var class_properties = extract_all_properties_with_domain_from_expanded_json(expanded, new_class.uri);
                if(class_properties.length > 0) {
                    new_class.properties = class_properties;
                }
                classes.push(new_class);
            }
        }
        return classes;
    };

    // extract classes from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the classes that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
function     extract_classes_from_expanded_json(expanded) {
        var classes = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( class_in_type(uris.CLASS, type)) {
                var new_class = {
                    uri: defined_entity["@id"],
                    name: extract_language_strings(defined_entity[uris.NAME]),
                    description: extract_language_strings(defined_entity[uris.DESCRIPTION])
                };
                if(uris.USAGE in defined_entity) {
                    new_class.usage = extract_language_strings(defined_entity[uris.USAGE]);
                }
                var class_properties = extract_all_properties_with_domain_from_expanded_json(expanded, new_class.uri);
                if(class_properties.length > 0) {
                    new_class.properties = class_properties;
                }
                classes.push(new_class);
            }
        }
        return classes;
    };

    // extract all the properties with a certain domain from the expanded json
    // takes a class URI and an expanded json root object as it is was parsed
    // by jsonld together with the context and returns all the properties who
    // have as domain the URI passed.
    //
    // @param expanded the root class that was parsed by jsonld
    // @param domain a string containing the URI of the class that you want the
    //               domain to be restricted to
function     extract_all_properties_with_domain_from_expanded_json(expanded, domain) {
        var properties = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( class_in_type(uris.PROPERTY, type)) {
                var parsed_property = {
                    uri: defined_entity["@id"],
                    name: extract_language_strings(defined_entity[uris.NAME]),
                    description: extract_language_strings(defined_entity[uris.DESCRIPTION]),
                    domain: extract_strings(defined_entity[uris.DOMAIN]),
                    range: extract_strings(defined_entity[uris.RANGE])
                };
                if(uris.GENERALIZATION in defined_entity) {
                    parsed_property["parents"] = extract_strings(defined_entity[uris.GENERALIZATION]);
                }
                if(uris.CARDINALITY in defined_entity) {
                    parsed_property.cardinality = defined_entity[uris.CARDINALITY][0]['@value'];
                }
                if(uris.USAGE in defined_entity) {
                    parsed_property.usage = extract_language_strings(defined_entity[uris.USAGE]);
                }
                if(parsed_property.domain.indexOf(domain) > -1) {
                    properties.push(parsed_property);
                };
            }
        }
        return properties;
    };



    // extract datatypes from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the datatypes that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
function     extract_datatypes_from_expanded_json(expanded) {
        var datatypes = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( class_in_type(uris.DATATYPE, type)) {
                var new_datatype = {
                    uri: defined_entity["@id"],
                    name: extract_language_strings(defined_entity[uris.NAME]),
                    description: extract_language_strings(defined_entity[uris.DESCRIPTION])
                };
                if(uris.USAGE in defined_entity) {
                    new_datatype.usage = extract_language_strings(defined_entity[uris.USAGE]);
                }
                var datatype_properties = extract_all_properties_with_domain_from_expanded_json(expanded, new_datatype.uri);
                if(datatype_properties.length > 0) {
                    new_datatype.properties = datatype_properties;
                }
                datatypes.push(new_datatype);
            }
        }
        return datatypes;
    };

    // extract properties from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the properties that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
function     extract_properties_from_expanded_json(expanded) {
        var properties = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( class_in_type(uris.PROPERTY, type)) {
                var parsed_property = {
                    uri: defined_entity["@id"],
                    name: extract_language_strings(defined_entity[uris.NAME]),
                    description: extract_language_strings(defined_entity[uris.DESCRIPTION]),
                    domain: extract_strings(defined_entity[uris.DOMAIN]),
                    range: extract_strings(defined_entity[uris.RANGE])
                };
                if(uris.CARDINALITY in defined_entity) {
                    parsed_property.cardinality = defined_entity[uris.CARDINALITY][0]['@value'];
                }
                if(uris.USAGE in defined_entity) {
                    parsed_property.usage = extract_language_strings(defined_entity[uris.USAGE]);
                }
                if(uris.GENERALIZATION in defined_entity) {
                    parsed_property["parents"] = extract_strings(defined_entity[uris.GENERALIZATION]);
                }
                properties.push(parsed_property);
            }
        }
        return properties;
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
function make_nj_person(element, type) {
	var nj_person = {
		role : type,
		first_name: element["foaf:firstName"],
		last_name: element["foaf:lastName"],
	        affiliation: {}

	};
	if (element.affiliation && element.affiliation["foaf:name"]) {
		nj_person.affiliation.name =  element.affiliation["foaf:name"];
	};
	if (element.affiliation && element.affiliation["foaf:homepage"]) {
		nj_person.affiliation.website =  element.affiliation["foaf:homepage"]
	};
	if (element["foaf:mbox"]) {nj_person.email =  element["foaf:mbox"]};
	return nj_person;
}


function     extract_contributors_from_expanded_json(expanded) {
        var contributors = [];
        contributors = contributors.concat(_extract_contributors_from_expanded_json(expanded[uris.AUTHORS], "A"));
        contributors = contributors.concat(_extract_contributors_from_expanded_json(expanded[uris.EDITORS], "E"));
        contributors = contributors.concat(_extract_contributors_from_expanded_json(expanded[uris.CONTRIBUTORS], "C"));
        return contributors;
    };

    // private supporting method for the extract contributors from expanded json
    // function that makes abstractions of the connecting properties and role codes
function     _extract_contributors_from_expanded_json(expanded_people, role) {
        var people = [];
        for(i in expanded_people) {
            var person = expanded_people[i];
            var type = person["@type"];
            if( class_in_type(uris.PERSON, type)) {
                var parsed_person = {
                    role: role,
                    first_name: person[uris.FIRSTNAME][0]["@value"],
                    last_name: person[uris.LASTNAME][0]["@value"],
                    email: person[uris.MAILBOX][0]["@value"]
                };
                if(uris.AFFILIATION in person) {
                    parsed_person.affiliation = {
                        name: person[uris.AFFILIATION][0][uris.FOAFNAME][0]["@value"],
                        website: _get_affiliation_homepage(person)
                    };
                }
                people.push(parsed_person);
            }
        }
        return people;
    };

function     _get_affiliation_homepage(person) {
	// There might not be a HOMEPAGE defined
	try {
	    return person[uris.AFFILIATION][0][uris.HOMEPAGE][0]["@value"];
	} catch(err) {
	    console.log('INFO: affiliation homepage is not present');	    
	    return null;
	};
    };

    // extract externals from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the external entities that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // the produced json looks like this:
    // external_terms: [
    //     {
    //         name: {
    //             nl: "Agent",
    //             en: "Agent"
    //         },
    //         uri: "http://purl.org/dc/terms/Agent"
    //     },
    // ]
    //
    // @param expanded the root class as it is being read by jsonld
function     extract_externals_from_expanded_json(expanded) {
        var externals = [];
        var defined_externals = expanded[uris.EXTERNALS];
        for(i in defined_externals) {
            var defined_external = defined_externals[i];
            var type = defined_external["@type"];
            if( class_in_type(uris.EXTERNALCLASS, type)) {
                externals.push({
                    uri: defined_external["@id"],
                    name: extract_language_strings(defined_external[uris.NAME])
                });
            }
        }
        return externals;
    };

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
function     make_nj_metadata(json, hostname) {
	var hn = json.hostname
        if (hn == null) { 
		hn = (hostname != null) ? hostname :  "https://data.vlaanderen.be" }
	json.navigation.self = hn + json.urlref;
        
        var docstatus = json['publication-state'];
	
        switch (docstatus) {
          case "https://data.vlaanderen.be/id/concept/StandaardStatus/Kandidaat-standaard":
		docstatuslabel = "Kandidaat-standaard";
		break;
          case "https://data.vlaanderen.be/id/concept/StandaardStatus/Standaard":
		docstatuslabel = "Standaard";
		break;
	  case "https://data.vlaanderen.be/id/concept/StandaardStatus/HerroepenStandaard":
		docstatuslabel = "Herroepen Standaard";
		break;
	  case "https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpdocumentInOntwikkeling":
    		docstatuslabel = "Ontwerpdocument";
		break;
	  case "https://data.vlaanderen.be/id/concept/StandaardStatus/ErkendeStandaard":
    		docstatuslabel = "Erkende Standaard";
		break;
	  case "https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpStandaard":
    		docstatuslabel = "Ontwerp Standaard";
		break;
	  case "https://data.vlaanderen.be/id/concept/StandaardStatus/KandidaatStandaard":
    		docstatuslabel = "Kandidaat Standaard";
		break;
	  case "https://data.vlaanderen.be/id/concept/StandaardStatus/NotaWerkgroep":
    		docstatuslabel = "Nota Werkgroep";
		break;
          default: 
		docstatuslabel = "Onbekend"
        };
	if (! json.license || json.license == "") {
	  // set default value
	  json.license="https://data.vlaanderen.be/id/licentie/modellicentie-gratis-hergebruik/v1.0"
        }

        var meta = {
            title: {nl: json.title},
            uri: json['@id'],
	    issued:  json['publication-date'],
	    baseURI: json.baseURI,
	    baseURIabbrev: json.baseURIabbrev,
            filename: json.name,
 	    navigation: json.navigation,
	    license: json.license,
	    status: docstatus,
	    statuslabel: docstatuslabel,
            repositoryurl: json.repository + "/tree/" + json.documentcommit,
            changelogurl: json.repository + "/blob/" + json.documentcommit + "/CHANGELOG",
	    feedbackurl: json.feedbackurl,
	    standaardregisterurl: json.standaardregisterurl,
            dependencies: json.dependencies,
	    usesVocs : [],
	    usesAPs: []
        };
	return meta;
	
};

function     extract_metadata_from_expanded_json(expanded) {
        var meta = {
            title: extract_language_strings(expanded[uris.NAME]),
            uri: expanded["@id"]
        };

        meta.prefix = "";
        meta.abstract = [];
        meta.comment = [];
        if(uris.DESCRIPTION in expanded) {
            meta.description = extract_language_strings(expanded[uris.DESCRIPTION]);
        }
        if(uris.ISSUED in expanded) {
            meta.issued = extract_functional_property(expanded[uris.ISSUED]);
        }
        if(uris.MODIFIED in expanded) {
            meta.modified = extract_functional_property(expanded[uris.MODIFIED]);
        }

        return meta;
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
function     class_in_type(classname, types) {
        for(i in types) {
            var type = types[i];
            if(type.indexOf(classname) > -1) {
                return true;
            }
            return false;
        }
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
function     extract_language_strings(expanded_string_bag) {
        var bag = {};
        for(i in expanded_string_bag) {
            var language_string = expanded_string_bag[i];
            bag[language_string["@language"]] = language_string["@value"];
        }
        return bag;
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
function     extract_strings(expanded_string_bag) {
        var bag = [];
        for(i in expanded_string_bag) {
            var string = expanded_string_bag[i];
            bag.push(string["@value"]);
        }
        return bag;
    };

    // extract functional property
    // Takes an expanded property as it is being parsed by jsonld
    // generally of the form:
    // [{ "@value": "This is the contents of my string" }] and returns
    // the value of the first object it encounters. If there is no value
    // then this function returns 0
    //
    // example:
    // > extract_functional_property([{"@value": "house"}])
    // > "house"
    //
    // @param expanded_property the property whose value is being extracted
function     extract_functional_property(expanded_property) {
        if(expanded_property.length > 0) {
            return expanded_property[0]["@value"];
        }
        return 0;
    }

module.exports = {parse_ontology_from_json_ld_file_voc, parse_ontology_from_json_ld_file_ap, parse_ontology_from_json_ld_file_oj, parse_ontology_from_json_ld_file_all, parse_json_ld_file_to_exampletemplates };
