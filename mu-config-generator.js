const fs = require('fs')
const jsonfile = require('jsonfile')
const jsonld = require('jsonld')
const StringBuilder = require("string-builder");

var program = require('commander');
const { domain } = require('process');

program
    .version('0.0.1')
    .usage('node specgen-jsonld-merger.js merges translation Json with original jsonld')
    .option('-i, --input <path>', 'input file (a jsonld file)')
    .option('-l, --language <languagecode>', 'wished language (languagecode)')
    .option('-o, --outputdirectory <path to directory>', 'output directory (directory path)')
    .option('-n, --namestring <boolean>', 'a variable to define if the name is a language-string (true) or a normal string (false + default) (boolean)')
    .option('-d, --definitionstring <boolean>', 'a variable to define if the definition is a language-string (true) or a normal string (false + default) (boolean)')
    .option('-u, --usagestring <boolean>', 'a variable to define if the usage is a language-string (true) or a normal string (false + default) (boolean)')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ specgen-shacl --help')
    console.log('  $ specgen-shacl -i <input> -o <output> -l <language>')
    process.exitCode = 1
})

program.parse(process.argv)

console.log(program.namestring)

const namestring = specify_string(program.namestring)
const definitionstring = specify_string(program.definitionstring)
const usagestring = specify_string(program.usagestring)

//Pluralize will not be gramatically correct in special cases but will work for the "usual" ones
//Recommend to check
const maybePluralize = (count, noun, suffix = 's') =>
    `${noun}${count !== 1 ? suffix : ''}`;

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
        domainBuilder = start_class(domainBuilder, currClass, language)
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
            var name = maybePluralize(2, get_name(domain, language)) 
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

function start_class(domainBuilder, currClass, language) {
    domainBuilder.append("(define-resource " + get_name(currClass, language) + " ()").appendLine()
    domainBuilder.append("   :class (s-url \"http://www.w3.org/2002/07/owl#Class\")").appendLine()
    //If you want any of the properties to be language-tagged you'll have to set their options to true 
    domainBuilder.append("   :properties `((:definition "+definitionstring+" ,(s-prefix \"sh:definition\"))").appendLine()
    domainBuilder.append("                 (:name "+namestring+" ,(s-prefix \"sh:name\"))").appendLine()
    domainBuilder.append("                 (:usage "+usagestring+" ,(s-prefix \"sh:usage\")))").appendLine()
    return domainBuilder
}

function end_class(domainBuilder, currClass, language) {
    var name = maybePluralize(2, get_name(currClass, language))
    domainBuilder.append(":resource-base (s-url \"" + currClass["@id"] + "\")").appendLine()
    domainBuilder.append(":on-path \"" + name + "\")").appendLine().appendLine()
    return domainBuilder
}

function get_name(obj, language) {
    if (obj.name !== undefined && obj.name[language] !== undefined) {
        return obj.name[language]
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
