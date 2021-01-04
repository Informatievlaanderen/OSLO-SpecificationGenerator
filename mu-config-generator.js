const fs = require('fs')
const jsonfile = require('jsonfile')
var pluralize = require('pluralize')
const StringBuilder = require("string-builder");
var program = require('commander');

program
    .version('0.0.1')
    .usage('node specgen-jsonld-merger.js merges translation Json with original jsonld')
    .option('-i, --input <path>', 'input file (a jsonld file)')
    .option('-l, --language <languagecode>', 'wished language (languagecode)')
    .option('-o, --outputdirectory <path to directory>', 'output directory (directory path)')
    .option('-s, --stringtype <boolean>', 'a variable to define if the properties are a language-string (true) or a normal string (false + default) (boolean)')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ specgen-shacl --help')
    console.log('  $ specgen-shacl -i <input> -o <output> -l <language>')
    console.log('  $ specgen-shacl -i <input> -o <output> -l <language> -s <boolean>')
    process.exitCode = 1
})

program.parse(process.argv)

console.log(program.namestring)

const stringtype = specify_string(program.stringtype)

create_config(program.input, program.outputdirectory, program.language)
console.log('done')

function specify_string(bool) {
    switch (bool) {
        case "true":
        case true:
            return ":language-string"
        default:
            return ":string"
    }
}

function create_config(input_filename, outputdirectory, language) {
    console.log('start reading');
    jsonfile.readFile(input_filename)
        .then(
            function (input) {
                if (fs.existsSync(outputdirectory)) {
                    console.log('start processing')

                    write_domainlisp(outputdirectory, input, language);
                    write_repositorylisp(outputdirectory);

                }
                else {
                    console.log("The destined repository does not exist. Aborting.")
                    process.exitCode = 1;
                }
            })
        .catch(error => { console.error(error); process.exitCode = 1; })
}

function write_repositorylisp(outputdir) {
    var reposBuilder = new StringBuilder();
    reposBuilder.append("(in-package :mu-cl-resources)").appendLine()
    reposBuilder.append(";; NOTE").appendLine()
    reposBuilder.append(";; docker-compose stop; docker-compose rm; docker-compose up").appendLine()
    reposBuilder.append(";; after altering this file.").appendLine().appendLine()
    reposBuilder.append(";; Describe the prefixes which you'll use in the domain file here.").appendLine()
    reposBuilder.append(";; This is a short-form which allows you to write, for example,").appendLine()
    reposBuilder.append(";; (s-url \"http://purl.org/dc/terms/title\")").appendLine()
    reposBuilder.append(";; as (s-prefix \"dct:title\")").appendLine()
    reposBuilder.append(" (add-prefix \"sh\" \"http://www.w3.org/ns/shacl#\")").appendLine()
    fs.writeFile(getFilename(outputdir, "repository.lisp"), reposBuilder.toString(), function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log("Data saved to: " + getFilename(outputdir, "repository.lisp"));
    });
}

function write_domainlisp(outputdir, input, language) {
    var domainBuilder = initialize_domain_builder();
    for (let i = 0; i < input.classes.length; i++) {
        let currClass = input.classes[i]
        domainBuilder = start_class(domainBuilder, currClass, language, input)
        domainBuilder = check_domain(domainBuilder, currClass, input.properties, input.classes, language)
        domainBuilder = check_range(domainBuilder, currClass, input.properties, input.classes, language)
        domainBuilder = end_class(domainBuilder, currClass, language)
    }
    fs.writeFile(getFilename(outputdir, "domain.lisp"), domainBuilder.toString(), function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log("Data saved to: " + getFilename(outputdir, "domain.lisp"));
    });
}

function check_range(domainBuilder, currClass, properties, classes, language) {
    for (let p = 0; p < properties.length; p++) {
        let property = properties[p]
        if (property["range"] !== undefined) {
            for (let i = 0; i < property["range"].length; i++) {
                var range = property["range"][i]
                if (range["uri"] == currClass["@id"]) {
                    domainBuilder = write_range(domainBuilder, classes, property["domain"], property["@id"], language)
                }
            }
        }
    }
    return domainBuilder
}

function write_range(domainBuilder, classes, domainArray, id, language) {
    for (let i = 0; i < domainArray.length; i++) {
        var domain = get_equivalent_class(classes, domainArray[i]["uri"])
        if (domain != null) {
            domainBuilder.append("   :has-many `((" + get_name(domain, language) + " :via ,(s-url \"" + id + "\")").appendLine()
            domainBuilder.append("                        :inverse t").appendLine()
            var name = pluralize.plural(get_name(domain, language))
            domainBuilder.append("                        :as \"" + name + "\"))").appendLine()
        }
    }
    return domainBuilder
}

function check_domain(domainBuilder, currClass, properties, classes, language) {
    for (let p = 0; p < properties.length; p++) {
        let property = properties[p]
        for (let i = 0; i < property["domain"].length; i++) {
            var domain = property["domain"][i]
            if (domain["uri"] == currClass["@id"]) {
                domainBuilder = write_domain(domainBuilder, classes, property["range"], property["@id"], language)
            }
        }
    }
    return domainBuilder
}

function write_domain(domainBuilder, classes, rangeArray, id, language) {
    for (let i = 0; i < rangeArray.length; i++) {
        var range = get_equivalent_class(classes, rangeArray[i]["uri"])
        if (range != null) {
            domainBuilder.append("   :has-one `((" + get_name(range, language) + " :via ,(s-url \"" + id + "\")").appendLine()
            domainBuilder.append("                        :as \"" + get_name(range, language) + "\"))").appendLine()
        }
    }
    return domainBuilder
}

function get_equivalent_class(inputArray, currId) {
    for (i = 0; i < inputArray.length; i++) {
        if (inputArray[i]['@id'] == currId) {
            return inputArray[i]
        }
    }
    return null
}

function initialize_domain_builder() {
    var domainBuilder = new StringBuilder();
    domainBuilder.append("(in-package :mu-cl-resources)").appendLine()
    domainBuilder.append(";; NOTE").appendLine()
    domainBuilder.append(";; docker-compose stop; docker-compose rm; docker-compose up").appendLine()
    domainBuilder.append(";; after altering this file.").appendLine().appendLine()
    return domainBuilder
}

function start_class(domainBuilder, currClass, language, input) {
    domainBuilder.append("(define-resource " + get_name(currClass, language) + " ()").appendLine()
    domainBuilder.append("   :class (s-url \"http://www.w3.org/2002/07/owl#Class\")").appendLine()
    //If you want any of the properties to be language-tagged you'll have to set their options to true 
        domainBuilder = write_properties(domainBuilder, currClass, input)
    return domainBuilder
}

function write_properties(domainBuilder, currClass, input) {
    var dict = get_properties(currClass, input)
    if (dict.length > 0) {
        domainBuilder.append("   :properties `((")
        for (let i = 0; i < dict.length; i++) {
            let item = dict[i]
            let id = item.key
            let name = (item.value).replace(" ", "")
            if (i != 0) {
                domainBuilder.appendLine()
                domainBuilder.append("                 (")
            } 
            domainBuilder.append(":" + name + " " + stringtype + " ,(s-url \"" + id + "\"))")
        }
        domainBuilder.append(")").appendLine()
    }
    return domainBuilder
}

function get_properties(currClass, input) {
    var properties = input.properties
    var propdict = []
    for (let p = 0; p < properties.length; p++) {
        let property = properties[p]
        for (let i = 0; i < property["domain"].length; i++) {
            var domain = property["domain"][i]
            if (domain["uri"] == currClass["@id"]) {
                propdict = get_literal_props(property, propdict)
            }
        }
    }
    return propdict
}

function get_literal_props(property, propdict) {
    var range = property.range
    for (let i = 0; i < range.length; i++) {
        var item = range[i]
        if (is_literal(item["uri"])) {
            propdict.push({
                key:   property["@id"],
                value: item["EA-Name"]
            });
        }
    }
    return propdict
}

function is_literal(id) {
    var literals = ["http://www.w3.org/2001/XMLSchema#", "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "https://www.w3.org/TR/xmlschema11-2/#"]

    for (let i = 0; i < literals.length; i++) {
        var literal = literals[i]
        if (id.includes(literal)) {
            return true
        }
    }
    return false
}

function end_class(domainBuilder, currClass, language) {
    var name = pluralize.plural(get_name(currClass, language))
    domainBuilder.append(":resource-base (s-url \"" + currClass["@id"] + "\")").appendLine()
    domainBuilder.append(":on-path \"" + name + "\")").appendLine().appendLine()
    return domainBuilder
}

function get_name(obj, language) {
    if (obj.name !== undefined) {
        return obj.name
    } else {
        console.log("No name for specified language in object: " + obj["@id"] + " usind EA-Name instead: " + obj["extra"]["EA-Name"])
        return obj["extra"]["EA-Name"]
    }
}

function getFilename(directory, file) {
    if (directory.charAt(directory.length - 1) == "/" || directory.charAt(directory.length - 1) == "\\") {
        return directory + file
    } else {
        return (directory + "\\" + file)
    }
}
