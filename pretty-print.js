const fs = require('fs');  

let arguments = Array.prototype.slice.call(process.argv, 2);
let inputPath;
let outputPath;
let keysToSort = ["authors", "editors", "contributors"];

//reading the arguments in cmd
if (arguments.shift() == "--input")
{
    inputPath = arguments.shift();
}
else
{
    throw new Error("Should provide input file")
}
if(arguments.shift() == "--output")
{
    outputPath = arguments.shift();
}
else
{
    throw new Error("Should provide output file")
}

//Import Json-LD file and parse it + select the authors part from that file
let dataFile = fs.readFileSync(inputPath);
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
for(key in keysToSort)
{
    parsedData = sortOnKey(parsedData, keysToSort[key], sortOnAttributes);
}

//Output and write to file
fs.writeFileSync(outputPath, JSON.stringify(parsedData, null, 4));
