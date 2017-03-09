import csv


def convert_csv(path):
    result = ""

    with open(path) as csvfile:
        dialect = csv.Sniffer().sniff(csvfile.read(1024))
        csvfile.seek(0)
        reader = csv.reader(csvfile, dialect)
        for row in reader:
            print(dialect.delimiter)
            print(row)

    print(result)
    return result