import csv
import pydash
import time


def convert_contributor_csv(path, voc):
    """
    Converts a CSV file containing contributor names and roles to a list containing all contributors.
    Each contributor is represented as a dict.

    :param path: path to a utf-8 encoded csv file
    :param voc: the header of the column in the CSV containing the roles of the contributors
    :return: a list
    """
    contributors = []

    with open(path, encoding="utf-8") as csvfile:
        dialect = csv.Sniffer().sniff(csvfile.read(4096))
        csvfile.seek(0)
        reader = csv.reader(csvfile, dialect)

        parsed_header = False
        col_last_name = -1
        col_first_name = -1
        col_email = -1
        col_affiliation = -1
        col_affiliation_website = -1
        col_role = -1

        for row in reader:
            if not parsed_header:
                parsed_header = True
                col_email = row.index('E-mail')
                col_last_name = row.index('Naam')
                col_first_name = row.index('Voornaam')
                col_affiliation = row.index('Affiliatie')
                col_affiliation_website = row.index('Website')
                col_role = row.index(voc)

            else:
                contributors.append({
                    'last_name': row[col_last_name],
                    'first_name': row[col_first_name],
                    'role': row[col_role],
                    'email': row[col_email],
                    'affiliation_name': row[col_affiliation],
                    'affiliation_website': row[col_affiliation_website]
                })

    return contributors
