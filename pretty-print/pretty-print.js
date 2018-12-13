const fs = require('fs');  
const program = require('commander');
 
program
  .version('0.8.0')
  .usage('pretty-print a json-ld context')
  .option('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file (the context)')
  .option('-s, --sortkeys <keys>', 'keys to sort on',  ["authors", "editors", "contributors"])
  .option('--descending', 'sort descending (ascending default)')

program.on('--help', function(){
  console.log('')
  console.log('Examples:');
  console.log('  $ pretty-print --help');
  console.log('  $ pretty-print -i <input> -o <output>');
});

program.parse(process.argv);

//Import Json-LD file and parse it + select the authors part from that file
let dataFile = fs.readFileSync(program.input);
let parsedData = JSON.parse(dataFile);

//Create objects from these arguments and put them in the attributes array
var attributes = [];

for (let index = 0; index < arguments.length; index++) 
{
    let ascending = true;
    if (arguments[index] == "--descending") 
    {
        ascending = false;
        index++;
    }

    const element = arguments[index];
    attributes.push({ascending: ascending, attribute: element});
}

//Sort on the attributes 
let sortOnAttributes = function(a, b)
{
    debugger;
    for (let index = 0; index < attributes.length; index++) 
    {
        const element = attributes[index];
        if (element.ascending) 
        {
            if (a[element.attribute] < b[element.attribute]) 
                return -1;
            if (a[element.attribute] > b[element.attribute])
                return 1;
        }
        else
        {
            if (a[element.attribute] < b[element.attribute]) 
                return 1;
            if (a[element.attribute] > b[element.attribute])
                return -1;
        }
    }
  
    return 0;
}

//sorts a certain key within a hash with the given function
let sortOnKey = function(hash, key, sortFunction)
{
    let arrayToSort = hash[key];
    hash[key] = arrayToSort.sort(sortFunction);
    return hash;
}

//loops through the keys in the keyToSort array and apply the sortOnAttributes function
for(key in program.sortkeys)
{
    parsedData = sortOnKey(parsedData, program.sortkeys[key], sortOnAttributes);
}

//Output and write to file
fs.writeFileSync(program.output, JSON.stringify(parsedData, null, 4));
