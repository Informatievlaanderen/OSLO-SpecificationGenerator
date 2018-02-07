#!/usr/bin/env python

import sys
import getopt
import csv


HELP = "USAGE: 	generate_shacl.py -i filename.tsv -o output.ttl \n" \
		"		generate_shacl.py --input filename.tsv --output output.ttl"

def main(argv):

	input_file = ''
	output_file = ''

	# check arguments
	try: 
		opts, args = getopt.getopt(argv,"hi:",["help","input=","output="])
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

	# create SHACL from inputfile
	generateSHACL(input_file,output_file)


def generateSHACL(input_file,output_file):
	content = readFile(input_file) # returns tuple with classes and attributes/connectors
	result = processInput(content) # returns the SHACL
	writeOutput(input_file,result,output_file) # writes the SHACL to file



# read file and return tuple with classes and attributes/connectors
def readFile(input_file):
	print('reading file: ' + input_file)

	classes = []
	namespace = "http://data.vlaanderen.be/id/conceptschema/"

	arr_already_outputted = [] #array to keep track of already outputted classes / attributes to avoid duplicates

	# open file
	with open(input_file, encoding="utf8") as tsvfile: 
		reader = csv.DictReader(tsvfile, delimiter="\t", quotechar='"')
		header = False

		# loop through tsv file
		for row in reader:

			ea_type 	= row['EA-Type'] 
			ea_name 	= row['EA-Name']
			ea_package 	= row['EA-Package']
			localname	= row['localname']
			definition 	= row['ap-definition-nl']
			note	 	= row['ap-usageNote-nl']
			domain 		= row['EA-Domain']

			if ea_type == "ENUMERATION":
				classes.append("\<"+namespace+ea_name.replace(' ', '_')+">\n")
				classes.append("    a skos:ConceptScheme ;\n")
				classes.append("    rdfs:label \""+ea_name+"\"@nl .\n\n")

			if (ea_type == "attribute") and (ea_package == "Codelijsten"):
				classes.append("\<"+namespace+domain+"#"+ea_name.replace(' ', '_')+">\n")
				classes.append("    a skos:Concept ;\n")
				classes.append("    rdfs:label \""+ea_name+"\"@nl ;\n")
				classes.append("    skos:definition \""+definition.replace('\"', '')+"\"@nl ;\n")
				if note:
					classes.append("    skos:note \""+note.replace('\"', '')+"\"@nl ;\n")
				classes.append("    skos:notation \""+ea_name+"\"@nl ;\n")
				classes.append("    skos:inScheme <"+namespace+domain+"> .\n\n")

			
		return (classes)

# process input file, return SKOS Codelist
def processInput(content):
	print("process input")

	result = ''
	classes = content
	# header
	result += "@prefix skos:      <http://www.w3.org/2004/02/skos/core#> .\n"
	result += "@prefix rdfs:      <http://www.w3.org/2000/01/rdf-schema#> .\n\n"


	# classes
	for iClass in classes: 
		for line in iClass[1:]:
			result += line

	return result


# write to output file
def writeOutput(input_file, output, output_file): 
	

	#output file
	OUTPUTFILE = open(output_file,"w") # open output file

	OUTPUTFILE.write(output)

	OUTPUTFILE.close() #close output file

	print("Succesfully converted " + input_file + " to " + output_file)


if __name__ == "__main__": main(sys.argv[1:])
