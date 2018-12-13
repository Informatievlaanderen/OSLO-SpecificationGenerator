#Documentation
## Running this tool
To run this tool you can simply use the following command:
```
> node pretty-print.js --input [JSON-LD INPUT FILENAME] --output [JSON-LD OUTPUT FILENAME] [--descending] [ATTRIBUTE TO SORT ON] [--descending] [SECOND ATTRIBUTE TO SORT ON]
```
An example:
```
node pretty-print.js --input example.jsonld --output exampleORDERED.jsonld --descending "foaf:last_name" --descending "foaf:first_name"
```
Running the above example will result in an JSON-LD file that is sorted descending on "foaf:last_name" and secondly also descending on "foaf:first_name".
```
It must be noted that not all arguments are mandatory. The "--descending" arguments are optional and by leaving them out the user can sort in ascendingly, for example:
```
node pretty-print.js --input example.jsonld --output exampleORDERED.jsonld "foaf:last_name" "foaf:first_name"
```
Running the above example will result in an JSON-LD file that is sorted ascendingly on "foaf:last_name" and secondly also ascendingly on "foaf:first_name".
```
If no attributes ("foaf:last_name" or foaf:first_name for example) to sort on are provided, nothing in the file will be sorted. 
```

#Todo list
- Throw an error if no attributes are provided
- Seperate into functions/modules 
- Set a default output path

- Create integration/unit tests 
- Currently nested attributes cannot be sorted on