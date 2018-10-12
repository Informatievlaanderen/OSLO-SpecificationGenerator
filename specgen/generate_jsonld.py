#!/usr/bin/env python

import sys
import getopt
import csv
import os


HELP = "USAGE: 	generate_jsonld.py -i filename.tsv -o output.jsonld \n" \
    "		generate_jsonld.py --input filename.tsv --output output.jsonld"


def main(argv):

    input_file = ''
    output_file = ''

    # check arguments
    try:
        opts, args = getopt.getopt(argv, "hi:", ["help", "input=", "output="])
    except getopt.GetoptError:
        print("ERROR - Incorrect arguments")
        print(HELP)
        sys.exit(2)

    if len(opts) == 0:
        print(HELP)

    for opt, arg in opts:
        if opt == '-h':
            print(HELP)
            sys.exit(2)
        elif opt in ("-i", "--input"):
            input_file = arg
        elif opt in ("-o", "--output"):
            output_file = arg
        else:
            print(HELP)

    # create jsonLD from inputfile
    generateJSONLD(input_file, output_file)


def generateJSONLD(input_file, output_file):
    # returns tuple with classes and attributes/connectors
    content = readFile(input_file)
    result = processInput(content)  # returns the jsonld
    writeOutput(input_file, result, output_file)  # writes the jsonld to file


# read file and return tuple with classes and attributes/connectors
def readFile(input_file):
    print('reading file: ' + input_file)

    classes = []
    enums = []
    attributes = []

    # array to keep track of already outputted classes / attributes to avoid duplicates
    arr_already_outputted = []

    # open file
    with open(input_file, encoding="utf-8") as tsvfile:
        reader = csv.DictReader(tsvfile, delimiter="\t", quotechar='"')

        # loop through tsv file
        for row in reader:

            ea_type = row['EA-Type']
            ea_package = row['EA-Package']
            ea_name = row['EA-Name']
            ea_domain = row['EA-Domain']
            namespace = row['namespace']
            localname = row['localname']
            var_type = row['type']
            var_range = row['range']
            cardinality = row['max card']

            # for classes
            if ea_type == "CLASS":
                classes.append("\t\t\"" + ea_name + "\":\"" +
                               namespace + localname + "\"")

            # for enumerations
            if ea_type == "ENUMERATION":
                enums.append(ea_name)

            # for connectors or attributes
            if ea_type == "connector" or ea_type == "attribute":
                attribute = ''
                jsonld_label = ''

                if namespace + localname in arr_already_outputted:
                    continue
                elif ea_name in arr_already_outputted:
                    jsonld_label = ea_domain + "." + ea_name
                    arr_already_outputted.append(ea_domain + "." + ea_name)
                else:
                    jsonld_label = ea_name
                    arr_already_outputted.append(ea_name)
                    arr_already_outputted.append(namespace + localname)

                # logic for ignoring enumeration attributes
                if ea_domain in enums:
                    continue

                attribute += ("\t\t\"" + jsonld_label +
                              "\":{\n")  # e.g. "label":{
                # e.g. "@id":"http://example.com#name",
                attribute += ("\t\t\t\"@id\":\"" +
                              namespace + localname + "\",\n")
                # e.g. "@type":"http://example.com#literal"
                if var_range != "":
                    attribute += ("\t\t\t\"@type\":\"" + var_range + "\"")

                if cardinality == '*':
                    attribute += (",\n\t\t\t\"@container\":\"@set\"\n")
                else:
                    attribute += ("\n")

                attribute += ("\t\t}")  # e.g. },

                attributes.append(attribute)

    return (classes, attributes)

# process input file, return jsonld


def processInput(content):
    print("process input")

    result = ''

    classes = sorted(content[0])
    attributes = sorted(content[1])

    # jsonld header
    result += "{\n\t\"@context\":\n\t{\n"

    # classes
    for iClass in classes:
        result += iClass + ",\n"

    result += "\n"

    row = 0
    for iAttributes in attributes:
        if row == len(attributes) - 1:
            result += iAttributes + "\n"  # no comma for last attribute
        else:
            result += iAttributes + ",\n"
        row += 1

    # footer jsonld
    result += "\t}\n}"

    return result


# write to output file
def writeOutput(input_file, output, output_file):
    # Write to specified file
    if not os.path.exists(os.path.dirname(output_file)):
        os.makedirs(os.path.dirname(output_file))

    # output file
    OUTPUTFILE = open(output_file, "w", encoding='utf-8')  # open output file

    OUTPUTFILE.write(output)

    OUTPUTFILE.close()  # close output file

    print("Succesfully converted " + input_file + " to " + output_file)


if __name__ == "__main__":
    main(sys.argv[1:])
