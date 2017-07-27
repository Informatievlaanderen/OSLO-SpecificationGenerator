#!/usr/bin/env python

import sys
import getopt
import csv


HELP = "USAGE: 	generate_jsonld.py -i filename.tsv \n" \
		"		generate_jsonld.py --input filename.tsv"

def main(argv):

	input_file = ''

	# check arguments
	try: 
		opts, args = getopt.getopt(argv,"hi:",["help","input="])
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
                        # create jsonLD from inputfile
                        generateJSONLD(input_file)
                else:
                        print(HELP)


def generateJSONLD(input_file):
	content = readFile(input_file) # returns tuple with classes and attributes/connectors
	result = processInput(content) # returns the jsonld
	writeOutput(input_file,result) # writes the jsonld to file



# read file and return tuple with classes and attributes/connectors
def readFile(input_file):
	print('reading file: ' + input_file)

	classes = []
	enums = []
	attributes = []

	arr_already_outputted = [] #array to keep track of already outputted classes / attributes to avoid duplicates

	# open file
	with open(input_file) as tsvfile: 
		reader = csv.DictReader(tsvfile, delimiter="\t", quotechar='"')

		# loop through tsv file
		for row in reader:

			ea_type 	= row['EA-Type'] 
			ea_package 	= row['EA-Package']
			ea_name 	= row['EA-Name']
			ea_domain 	= row['EA-Domain']
			namespace	= row['namespace']
			localname	= row['localname']
			var_type 	= row['type']
			var_range 	= row['range']
			cardinality	= row['max card']

			#for classes
			if ea_type == "CLASS":
				classes.append("\t\t\"" + ea_name + "\":\"" + namespace + localname + "\"")
				
			#for enumerations
			if ea_type == "ENUMERATION":
				enums.append(ea_name)

			#for connectors or attributes
			if ea_type == "connector" or ea_type == "attribute":
				attribute = ''

				if ea_name in arr_already_outputted: 
					continue
				else:
					arr_already_outputted.append(ea_name)

				##logic for ignoring enumeration attributes
				if ea_domain in enums:
					continue
				
				attribute += ("\t\t\"" + ea_name + "\":{\n") # e.g. "label":{
				attribute += ("\t\t\t\"@id\":\"" + namespace + localname + "\",\n") # e.g. "@id":"http://example.com#name",
				attribute +=("\t\t\t\"@type\":\"" + var_range + "\"") # e.g. "@type":"http://example.com#literal" 

				if cardinality == '*':
					attribute += (",\n\t\t\t\"@container\":\"@set\"\n")
				else: 
					attribute += ("\n")

				attribute +=("\t\t}") #e.g. },

				attributes.append(attribute)

	return (classes,attributes)

# process input file, return jsonld
def processInput(content):
	print("process input")

	result = ''

	classes = content[0]
	attributes = content[1]

	#jsonld header
	result += "{\n\t\"@context\":\n\t{\n"


	# classes
	for iClass in classes: 
		result += iClass + ",\n"

	result += "\n"

	row = 0
	for iAttributes in attributes:
		if row == len(attributes)-1:
			result += iAttributes + "\n" # no comma for last attribute
		else:
			result += iAttributes + ",\n" 
		row += 1
		
	#footer jsonld
	result += "\t}\n}"


	return result


# write to output file
def writeOutput(input_file, output): 
	
	#create name for outputfile
	OUTPUTFILE = input_file.split('/')[-1][:-4] + '.jsonld' #e.g. digimelding-ap.tsv --> digimelding-ap.jsonld

	#output file
	output_file = open(OUTPUTFILE,"w") # open output file

	output_file.write(output)

	output_file.close() #close output file

	print("Succesfully converted " + input_file + " to " + OUTPUTFILE)


if __name__ == "__main__": main(sys.argv[1:])
