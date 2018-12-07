const fs = require("fs");
const jsonld = require('jsonld');
const uris = require('./uris');
/**
 * The linked data parser library provides support for converting
 * json ld files to a form that the nunjucks templates as they have been
 * defined on the data.vlaanderen.be repository can process.
 *
 * It's main entry points is parse_ontology_from_json_ld_file(json_ld_file, template_file)
  */
const LinkedDataParser =  {
    // parse ontology from json ld
    // this function takes a reference to a json ld file containing
    // the description of an ontology encoded in json ld format and
    // returns a representation of that ontology that can be rendered
    // by the nunjucks template.
    //
    // @param filename the name of the file that contains the json ld representation
    parse_ontology_from_json_ld_file: async function(json_ld_file) {
        var ld = JSON.parse(fs.readFileSync(json_ld_file, 'utf-8'));
        expanded = await jsonld.expand(ld);
        for(i in expanded) {
            var vocabularium = expanded[i];
            var nunjucks_json = {
                metadata: this.extract_metadata_from_expanded_json(vocabularium),
                classes: this.extract_classes_from_expanded_json(vocabularium),
                properties: this.extract_properties_from_expanded_json(vocabularium),
                contributors: this.extract_contributors_from_expanded_json(vocabularium),
                externals: this.extract_externals_from_expanded_json(vocabularium),
                parents: []
            };
            var datatypes = this.extract_datatypes_from_expanded_json(vocabularium);
            if(datatypes.length > 0) {
                nunjucks_json.datatypes = datatypes;
            }
            return nunjucks_json;
        }
    },

    // extract classes from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the classes that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
    extract_classes_from_expanded_json: function(expanded) {
        var classes = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( this.class_in_type(uris.CLASS, type)) {
                var new_class = {
                    uri: defined_entity["@id"],
                    name: this.extract_language_strings(defined_entity[uris.NAME]),
                    description: this.extract_language_strings(defined_entity[uris.DESCRIPTION])
                };
                if(uris.USAGE in defined_entity) {
                    new_class.usage = this.extract_language_strings(defined_entity[uris.USAGE]);
                }
                var class_properties = this.extract_all_properties_with_domain_from_expanded_json(expanded, new_class.uri);
                if(class_properties.length > 0) {
                    new_class.properties = class_properties;
                }
                classes.push(new_class);
            }
        }
        return classes;
    },

    // extract all the properties with a certain domain from the expanded json
    // takes a class URI and an expanded json root object as it is was parsed
    // by jsonld together with the context and returns all the properties who
    // have as domain the URI passed.
    //
    // @param expanded the root class that was parsed by jsonld
    // @param domain a string containing the URI of the class that you want the
    //               domain to be restricted to
    extract_all_properties_with_domain_from_expanded_json: function(expanded, domain) {
        var properties = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( this.class_in_type(uris.PROPERTY, type)) {
                var parsed_property = {
                    uri: defined_entity["@id"],
                    name: this.extract_language_strings(defined_entity[uris.NAME]),
                    description: this.extract_language_strings(defined_entity[uris.DESCRIPTION]),
                    domain: this.extract_strings(defined_entity[uris.DOMAIN]),
                    range: this.extract_strings(defined_entity[uris.RANGE])
                };
                if(uris.GENERALIZATION in defined_entity) {
                    parsed_property["parents"] = this.extract_strings(defined_entity[uris.GENERALIZATION]);
                }
                if(uris.CARDINALITY in defined_entity) {
                    parsed_property.cardinality = defined_entity[uris.CARDINALITY][0]['@value'];
                }
                if(uris.USAGE in defined_entity) {
                    parsed_property.usage = this.extract_language_strings(defined_entity[uris.USAGE]);
                }
                if(parsed_property.domain.indexOf(domain) > -1) {
                    properties.push(parsed_property);
                };
            }
        }
        return properties;
    },

    // extract datatypes from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the datatypes that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
    extract_datatypes_from_expanded_json: function(expanded) {
        var datatypes = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( this.class_in_type(uris.DATATYPE, type)) {
                var new_datatype = {
                    uri: defined_entity["@id"],
                    name: this.extract_language_strings(defined_entity[uris.NAME]),
                    description: this.extract_language_strings(defined_entity[uris.DESCRIPTION])
                };
                if(uris.USAGE in defined_entity) {
                    new_datatype.usage = this.extract_language_strings(defined_entity[uris.USAGE]);
                }
                var datatype_properties = this.extract_all_properties_with_domain_from_expanded_json(expanded, new_datatype.uri);
                if(datatype_properties.length > 0) {
                    new_datatype.properties = datatype_properties;
                }
                datatypes.push(new_datatype);
            }
        }
        return datatypes;
    },

    // extract properties from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the properties that are being encoded within
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
    extract_properties_from_expanded_json: function(expanded) {
        var properties = [];
        reverses = expanded["@reverse"];
        var defined_enitities = reverses[uris.IS_DEFINED_BY];
        for(i in defined_enitities) {
            var defined_entity = defined_enitities[i];
            var type = defined_entity["@type"];
            if( this.class_in_type(uris.PROPERTY, type)) {
                var parsed_property = {
                    uri: defined_entity["@id"],
                    name: this.extract_language_strings(defined_entity[uris.NAME]),
                    description: this.extract_language_strings(defined_entity[uris.DESCRIPTION]),
                    domain: this.extract_strings(defined_entity[uris.DOMAIN]),
                    range: this.extract_strings(defined_entity[uris.RANGE])
                };
                if(uris.CARDINALITY in defined_entity) {
                    parsed_property.cardinality = defined_entity[uris.CARDINALITY][0]['@value'];
                }
                if(uris.USAGE in defined_entity) {
                    parsed_property.usage = this.extract_language_strings(defined_entity[uris.USAGE]);
                }
                if(uris.GENERALIZATION in defined_entity) {
                    parsed_property["parents"] = this.extract_strings(defined_entity[uris.GENERALIZATION]);
                }
                properties.push(parsed_property);
            }
        }
        return properties;
    },


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

    extract_contributors_from_expanded_json: function(expanded) {
        var contributors = [];
        contributors = contributors.concat(this._extract_contributors_from_expanded_json(expanded[uris.AUTHORS], "A"));
        contributors = contributors.concat(this._extract_contributors_from_expanded_json(expanded[uris.EDITORS], "E"));
        contributors = contributors.concat(this._extract_contributors_from_expanded_json(expanded[uris.CONTRIBUTORS], "C"));
        return contributors;
    },

    // private supporting method for the extract contributors from expanded json
    // function that makes abstractions of the connecting properties and role codes
    _extract_contributors_from_expanded_json: function(expanded_people, role) {
        var people = [];
        for(i in expanded_people) {
            var person = expanded_people[i];
            var type = person["@type"];
            if( this.class_in_type(uris.PERSON, type)) {
                var parsed_person = {
                    role: role,
                    first_name: person[uris.FIRSTNAME][0]["@value"],
                    last_name: person[uris.LASTNAME][0]["@value"],
                    email: person[uris.MAILBOX][0]["@value"]
                };
                if(uris.AFFILIATION in person) {
                    parsed_person.affiliation = {
                        name: person[uris.AFFILIATION][0][uris.FOAFNAME][0]["@value"],
                        website: person[uris.AFFILIATION][0][uris.HOMEPAGE][0]["@value"]
                    };
                }
                people.push(parsed_person);
            }
        }
        return people;
    },



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
    extract_externals_from_expanded_json: function(expanded) {
        var externals = [];
        var defined_externals = expanded[uris.EXTERNALS];
        for(i in defined_externals) {
            var defined_external = defined_externals[i];
            var type = defined_external["@type"];
            if( this.class_in_type(uris.EXTERNALCLASS, type)) {
                externals.push({
                    uri: defined_external["@id"],
                    name: this.extract_language_strings(defined_external[uris.NAME])
                });
            }
        }
        return externals;
    },

    // extract metadata from expanded json
    // Takes an expanded json root object as it is being parsed by jsonld
    // together with the context such as it is being defined in the root of
    // this repository and returns the metadata for the ontology that is
    // encoded within the json ld.
    // It in the form that the nunjucks template expects it.
    // For an example please refer to the README.md.
    //
    // @param expanded the root class as it is being read by jsonld
    extract_metadata_from_expanded_json: function(expanded) {
        var meta = {
            title: this.extract_language_strings(expanded[uris.NAME]),
            uri: expanded["@id"]
        };

        meta.prefix = "";
        meta.abstract = [];
        meta.comment = [];
        if(uris.DESCRIPTION in expanded) {
            meta.description = this.extract_language_strings(expanded[uris.DESCRIPTION]);
        }
        if(uris.ISSUED in expanded) {
            meta.issued = this.extract_functional_property(expanded[uris.ISSUED]);
        }
        if(uris.MODIFIED in expanded) {
            meta.modified = this.extract_functional_property(expanded[uris.MODIFIED]);
        }

        return meta;
    },

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
    class_in_type: function(classname, types) {
        for(i in types) {
            var type = types[i];
            if(type.indexOf(classname) > -1) {
                return true;
            }
            return false;
        }
    },

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
    extract_language_strings: function(expanded_string_bag) {
        var bag = {};
        for(i in expanded_string_bag) {
            var language_string = expanded_string_bag[i];
            bag[language_string["@language"]] = language_string["@value"];
        }
        return bag;
    },

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
    extract_strings: function(expanded_string_bag) {
        var bag = [];
        for(i in expanded_string_bag) {
            var string = expanded_string_bag[i];
            bag.push(string["@value"]);
        }
        return bag;
    },

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
    extract_functional_property: function(expanded_property) {
        if(expanded_property.length > 0) {
            return expanded_property[0]["@value"];
        }
        return 0;
    }
};

module.exports = LinkedDataParser;
