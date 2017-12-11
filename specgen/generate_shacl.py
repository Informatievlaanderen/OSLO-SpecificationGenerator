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

	arr_already_outputted = [] #array to keep track of already outputted classes / attributes to avoid duplicates

	# open file
	with open(input_file) as tsvfile: 
		reader = csv.DictReader(tsvfile, delimiter="\t", quotechar='"')

		# loop through tsv file
		i = 0
		for row in reader:

			class_type 	= row['EA-Type'] 
			class_name 	= row['EA-Name']
			namespace	= row['namespace']
			localname	= row['localname']

			if (class_type == "CLASS") or (class_type == "DATATYPE"):
				classes.append([i])
				classes[i].append("<"+namespace+localname+"Shape"+">\n")
				classes[i].append("	a sh:NodeShape ;\n")
				classes[i].append("	sh:targetClass <"+namespace+localname+"> ;\n")
				with open(input_file) as tsvfile: 
					reader2 = csv.DictReader(tsvfile, delimiter="\t", quotechar='"')
					for attribute in reader2: 
						ea_type 	= attribute['EA-Type'] 
						ea_name 	= attribute['EA-Name']
						ea_domain 	= attribute['EA-Domain']
						namespace	= attribute['namespace']
						localname	= attribute['localname']
						var_type 	= attribute['type']
						var_range 	= attribute['range']
						definition 	= attribute['ap-definition-nl'].replace('\n', ' ')
						mincard		= attribute['min card']
						maxcard		= attribute['max card']
						if ((ea_type == "attribute") or (ea_type == "connector")) and ea_domain == class_name:
							classes[i].append("	sh:property [\n")
							classes[i].append("		sh:name \""+ea_name+"\" ;\n")
							classes[i].append("		sh:description \""+definition+"\" ;\n")
							classes[i].append("		sh:path <"+namespace+localname+"> ;\n")
							if var_range != "":
								classes[i].append("		sh:class <"+var_range+"> ;\n")
							if (mincard != "0") and (mincard != ""):
								classes[i].append("		sh:minCount "+mincard+" ;\n")
							if (maxcard != "*") and (maxcard != ""):
								classes[i].append("		sh:maxCount "+maxcard+" ;\n")
							classes[i].append("	] ;\n")
				
				classes[i].append("	sh:closed false .\n")
				i += 1

			
		return (classes)

# process input file, return SHACL
def processInput(content):
	print("process input")

	result = ''
	classes = content
	#SHACL header
	result += "@prefix sh:      <http://www.w3.org/ns/shacl#> .\n"


	# classes
	for iClass in classes: 
		for line in iClass[1:]:
			result += line
		result += "\n"

	return result


# write to output file
def writeOutput(input_file, output, output_file): 
	

	#output file
	OUTPUTFILE = open(output_file,"w") # open output file

	OUTPUTFILE.write(output)

	OUTPUTFILE.close() #close output file

	print("Succesfully converted " + input_file + " to " + output_file)


if __name__ == "__main__": main(sys.argv[1:])
