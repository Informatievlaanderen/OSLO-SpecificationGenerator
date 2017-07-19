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
		print "ERROR - Incorrect arguments"
		print HELP
		sys.exit(2)		

	if len(opts) == 0:
		print HELP

	for opt, arg in opts:
 		if opt == '-h':
			print HELP
			sys.exit(2)
 		elif opt in ("-i", "--input"):
			input_file = arg
			# create jsonLD from inputfile
			generateJSONLD(input_file)
		else:
			print HELP


def generateJSONLD(input_file):
	content = readFile(input_file)
	result = processInput(content) # tuple with classes, enums and attributes/connectors
	writeOutput(input_file,result)



# read file
def readFile(input_file):
	print 'reading file: ' + input_file

	classes = []
	enums = []
	attributes = []

	arr_already_outputted = [] #array to keep track of already outputted classes / attributes to avoid duplicates

	with open(input_file,'rb') as tsvfile: 
		reader = csv.reader(tsvfile, delimiter="\t", quotechar='"')

		# loop through tsv file
		for row in reader:

			ea_type 	= row[0] 
			ea_package 	= row[1]
			ea_name 	= row[2]
			ea_domain 	= row[5]
			namespace	= row[18]
			localname	= row[19]
			var_type 	= row[20]
			var_range 	= row[22]
			cardinality	= row[-1]

			#for classes
			if ea_type == "CLASS":
				classes.append("\t\t\"" + ea_name + "\":\"" + namespace + localname + "\"")
				

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
					attribute += (",\n\t\t\t\"@container\":\"@set\"\n") # e.g. "@type":"http://example.com#literal"
				else: 
					attribute += ("\n")

				attribute +=("\t\t}") #e.g. },

				attributes.append(attribute)

	return (classes,attributes)

# process input file
def processInput(content):
	print "process input"

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

	print "Succesfully converted " + input_file + " to " + OUTPUTFILE


if __name__ == "__main__": main(sys.argv[1:])
