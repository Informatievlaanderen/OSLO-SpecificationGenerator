const fs = require('fs')
const jsonfile = require('jsonfile')
const nunjucks = require('nunjucks');

var program = require('commander')

program
    .version('0.8.0')
    .usage('node exampletemplate-generator.js creates jsonld files per class')
    .option('-d, --directory <directory>', 'directory where you saved your example templates (not the context!)')
    .option('-o, --outputdirectory <directory>', 'outputdirectory to save the new files to. If it is the same as the directory, the files in there will be overwritten.')

program.on('--help', function () {
    console.log('')
    console.log('Examples:')
    console.log('  $ exampletemplate-generator --help')
    console.log('  $ exampletemplate-generator -i <input> -o <output>')
})

program.parse(process.argv)

var directory = program.directory || '/exampletemplates/'
nunjucks.configure(directory, {
    autoescape: true
})

render_exampletemplate_from_json_ld_file(program.directory, program.outputdirectory)
console.log('done')

function render_exampletemplate_from_json_ld_file(directory, outputdirectory) {
    console.log('start reading')
    fs.readdir(directory, (err, files) => {
        files.forEach(file => {
            let path = directory+"\\"+file
            if (fs.lstatSync(path).isDirectory()) {
                render_exampletemplate_from_json_ld_file(path, outputdirectory+"\\"+file)
            } else {
                handleFile(path, outputdirectory, file)
            }
        });
    });

}

function handleFile (input, outputdirectory, file) {
    jsonfile.readFile(input)
                .then(
                    function (json) {
                        json = iterate_over_json(json)
                        var output = getOutputFile(outputdirectory, file)

                        if (!fs.existsSync(outputdirectory)){
                            fs.mkdirSync(outputdirectory);
                        }

                        jsonfile.writeFile(output, json)
                        .then(res => {
                          console.log('Write complete to: ' + output)
                        })
                        .catch(error => { console.error(error); process.exitCode = 1 })
                    })
                .catch(error => { console.error(error); process.exitCode = 1 })
}

function getOutputFile (dir, file) {
    if (dir.charAt(dir.length-1) == "\\" || dir.charAt(dir.length-1) == "/") {
        return dir+file
    } else if (dir.includes("/") && dir.charAt(dir.length-1) != "/") {
        return dir+"/"+file
    } else {
        return dir+"\\"+file
    }
}

function iterate_over_json(json) {
    for (let key in json) {
        if (!(json[key] === undefined) && json[key] != null && typeof json[key] != 'object') {
            json = write_value(json, key)
        }
        if (!(json[key] === undefined) && typeof json[key] == 'object') {
            iterate_over_json(json[key])
        }
    }
    return json;
}

function write_value(json, key) {
    var value = json[key]
    switch(value) {
        case "{{STRING}}":
            value = generate_string(25)
            break;
        case "{{VAL}}":
            value = generate_string(10)
            break;
        case "{{ANYURI}}":
        case "{{ID}}":
            value = generate_uri()
            break;
        case "{{DATETIME}}":
            value = generate_date()
            break;
        default:
            if (value.includes("{{")) {
                console.log(value);
                value = generate_string(10)
            }
            break;
    }
    json[key] = value
    return json
}

function generate_string(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generate_value(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generate_number(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min; 
  } 

function generate_date() {
    var start = new Date(getRandomIntInclusive(2000,2019), getRandomIntInclusive(1,12), getRandomIntInclusive(1,28))
    var end = new Date()
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generate_uri() {
    return "http://" + generate_value(8) + "/" + generate_value(14) + "/" + generate_value(10) + "#"
}

//uuid could be added to generate that