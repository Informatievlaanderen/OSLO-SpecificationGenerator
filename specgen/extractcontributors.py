import csv
import pydash

def convert_contributor_csv(path, voc):
    items = []
    result = ""

    with open(path) as csvfile:
        dialect = csv.Sniffer().sniff(csvfile.read(1024))
        csvfile.seek(0)
        reader = csv.reader(csvfile, dialect)
        header = False

        for row in reader:
            if not header:
                header = row
            else:
                item = {}
                for i in range(0, len(row)):
                    item[header[i]] = row[i]
                items.append(item)

    contributors = pydash.filter_(items, {voc: 'C'})
    editors = pydash.filter_(items, {voc: 'E'})
    authors = pydash.filter_(items, {voc: 'A'})

    contributor_emails = pydash.map_(contributors.copy(), 'E-mail')
    editor_emails = pydash.map_(editors.copy(), 'E-mail')
    author_emails = pydash.map_(authors.copy(), 'E-mail')

    if len(items) > 0:
        result += "\n[overview]\n"
        result += 'voc=%s\n' % voc.lower()
        if len(contributor_emails) > 0:
            result += 'contributors=%s\n' % ','.join(contributor_emails)
        if len(editor_emails) > 0:
            result += 'editors=%s\n' % ','.join(editor_emails)
        if len(author_emails) > 0:
            result += 'authors=%s\n' % ','.join(author_emails)

        for contributor in contributor_emails:
            result += "\n[contributor:%s]\n" % contributor
            bijdrager = pydash.find(contributors, {'E-mail': contributor})

            if bijdrager is not None:
                result += 'naam=%s, %s\n' % (bijdrager['Naam'], bijdrager['Voornaam'])
                result += 'email=%s\n' % bijdrager['E-mail']
                result += 'organisatie=%s\n' % bijdrager['Affiliatie']
                result += 'website=%s\n' % bijdrager['Website']

        for author in author_emails:
            result += "\n[author:%s]\n" % author
            bijdrager = pydash.find(authors, {'E-mail': author})

            if bijdrager is not None:
                result += 'naam=%s, %s\n' % (bijdrager['Naam'], bijdrager['Voornaam'])
                result += 'email=%s\n' % bijdrager['E-mail']
                result += 'organisatie=%s\n' % bijdrager['Affiliatie']
                result += 'website=%s\n' % bijdrager['Website']

        for editor in editor_emails:
            result += "\n[editor:%s]\n" % editor
            bijdrager = pydash.find(editors, {'E-mail': editor})

            if bijdrager is not None:
                result += 'naam=%s, %s\n' % (
                bijdrager['Naam'], bijdrager['Voornaam'])
                result += 'email=%s\n' % bijdrager['E-mail']
                result += 'organisatie=%s\n' % bijdrager['Affiliatie']
                result += 'website=%s\n' % bijdrager['Website']

    return result
