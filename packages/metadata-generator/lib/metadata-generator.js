#!/usr/bin/env node

import { Command } from 'commander';
import jsonfile from 'jsonfile';

const newLineMd = '  ';

// Mapping language codes to language names (per language)
const languageNames = {
  en: { en: 'English', nl: 'Engels', fr: 'Anglais', de: 'Englisch' },
  nl: {
    en: 'Dutch',
    nl: 'Nederlands',
    fr: 'Néerlandais',
    de: 'Niederländisch',
  },
  fr: { en: 'French', nl: 'Frans', fr: 'Français', de: 'Französisch' },
  de: { en: 'German', nl: 'Duits', fr: 'Allemand', de: 'Deutsch' },
};

const program = new Command();

program
  .version('1.0.0')
  .usage('node html-metadata-generator.js extracts metadata for the html pages in a chosen language')
  .option(
    '-h, --hostname <hostname>',
    'the public hostname/domain on which the html is published. The hostname in the input file takes precedence.',
  )
  .option(
    '-r, --documentpath <path>',
    'the document path on which the html is published',
  )
  .option(
    '-m, --mainlanguage <languagecode>',
    'the language to display (a languagecode string)',
  )
  .option(
    '-g, --primarylanguage <languagecode>',
    'the primary language of the publication environment (a languagecode string)',
  )
  .option(
    '-u, --uridomain <uridomain>',
    'the domain of the URIs that should be excluded from this vocabulary',
  )
  .option('-i, --input <path>', 'input file')
  .option('-o, --output <path>', 'output file (the metadata file)')
  .option('-p, --prefix <prefix>', 'prefix for the logging');

program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ html-metadata-generator --help');
  console.log('  $ html-metadata-generator -m <mainlanguage> -i <input> -o <output>');
});

program.parse(process.argv);
const options = program.opts();

render_metadata(
  options.input,
  options.output,
  options.mainlanguage,
  options.prefix,
);

console.log(options.prefix + 'done' + newLineMd);

async function render_metadata(
  input_filename,
  output_filename,
  language,
  prefix,
) {
  console.log(prefix + 'start reading' + newLineMd);
  try {
    const input = await jsonfile.readFile(input_filename);
    console.log(prefix + 'start processing' + newLineMd);
    const hostname = options.hostname;
    const output = make_nj_metadata(input, hostname, language, prefix);

    console.log(prefix + 'start writing' + newLineMd);
    await jsonfile.writeFile(output_filename, output);
    console.log(prefix + 'The file has been saved to ' + output_filename + newLineMd);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

function getNamespaces(data, prefix) {
  console.log(prefix + 'Checking Namespaces' + newLineMd);
  let namespaces = [];

  const classes = data.classes;
  const attributes = data.attributes;
  const datatypes = data.datatypes;
  const referencedEntities = data.referencedEntities;

  if (classes) {
    namespaces = classes.reduce(
      (acc, elem) => pushNamespace(elem.assignedURI, acc),
      namespaces,
    );
  }
  if (attributes) {
    namespaces = attributes.reduce(
      (acc, elem) => pushNamespace(elem.assignedURI, acc),
      namespaces,
    );
  }
  if (datatypes) {
    namespaces = datatypes.reduce(
      (acc, elem) => pushNamespace(elem.assignedURI, acc),
      namespaces,
    );
  }
  if (referencedEntities) {
    namespaces = referencedEntities.reduce(
      (acc, elem) => pushNamespace(elem.assignedURI, acc),
      namespaces,
    );
  }

  console.log(prefix + 'Finished' + newLineMd);
  return namespaces;
}

function pushNamespace(uri, namespaces) {
  if (uri) {
    const lastIndex = uri.lastIndexOf('/');
    const lastPart = uri.substring(lastIndex);
    if (!lastPart.includes('#') && uri.substring(0, lastIndex).length > 7) {
      namespaces = push(namespaces, uri.substring(0, lastIndex));
    } else if (
      !lastPart.includes('#') &&
      uri.substring(0, lastIndex).length <= 7
    ) {
      namespaces = push(namespaces, uri);
    } else {
      const lastHash = uri.lastIndexOf('#');
      namespaces = push(namespaces, uri.substring(0, lastHash));
    }
  }
  return namespaces;
}

function push(namespaces, value) {
  if (!namespaces.includes(value)) {
    namespaces.push(value);
  }
  return namespaces;
}

function make_nj_metadata(json, hostname, language, prefix) {
  let hn = json.hostname;
  if (!hn) {
    hn = hostname || 'https://data.vlaanderen.be';
  }
  if (json.navigation) {
    json.navigation.self = hn + json.urlref;
  } else {
    console.log('Warning: no navigation defined for this rendering' + newLineMd);
    json.navigation = {
      self: hn + json.urlref,
    };
  }

  const docstatus = json['publication-state'];
  let docstatuslabel = '';

  switch (docstatus) {
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/Kandidaat-standaard':
      docstatuslabel = 'Kandidaat-standaard';
      break;
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/Standaard':
      docstatuslabel = 'Standaard';
      break;
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/HerroepenStandaard':
      docstatuslabel = 'Herroepen Standaard';
      break;
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpdocumentInOntwikkeling':
      docstatuslabel = 'Ontwerpdocument';
      break;
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/ErkendeStandaard':
      docstatuslabel = 'Erkende Standaard';
      break;
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/OntwerpStandaard':
      docstatuslabel = 'Ontwerp Standaard';
      break;
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/KandidaatStandaard':
      docstatuslabel = 'Kandidaat Standaard';
      break;
    case 'https://data.vlaanderen.be/id/concept/StandaardStatus/NotaWerkgroep':
      docstatuslabel = 'Nota Werkgroep';
      break;
    default:
      docstatuslabel = 'Onbekend';
  }
  if (!json.license) {
    json.license =
      'https://data.vlaanderen.be/id/licentie/modellicentie-gratis-hergebruik/v1.0';
  }

  let documentconfig = {};
  if (json.documentconfig) {
    documentconfig = json.documentconfig;
  }

  let titel = '';
  if (json.translation) {
    for (const i in json.translation) {
      if (json.translation[i].language === language) {
        titel = json.translation[i].title;
      }
    }
    if (!titel) {
      titel = json.title;
    }
  } else {
    titel = json.title;
  }

  const usednamespaces = getNamespaces(json, prefix);
  let inDomainNamespaces = [];

  if (options.uridomain) {
    const pattern = new RegExp(options.uridomain);
    inDomainNamespaces = usednamespaces.reduce((acc, elem) => {
      if (pattern.test(elem)) {
        acc.push(elem);
      }
      return acc;
    }, []);
  }

  const translationObj = json.translation?.find((translation) => translation.language === language);
  const autotranslate = translationObj?.autotranslate || false;

  let primaryLanguage = options.primarylanguage;
  if (primaryLanguage && languageNames[primaryLanguage]) {
    primaryLanguage = languageNames[primaryLanguage][language];
  }

  const meta = {
    title: titel,
    uri: json['@id'],
    issued: json['publication-date'],
    baseURI: json.baseURI,
    baseURIabbrev: json.baseURIabbrev,
    filename: json.name,
    navigation: json.navigation,
    license: json.license,
    documenttype: json.type,
    documentconfig: documentconfig,
    status: docstatus,
    statuslabel: docstatuslabel,
    documentroot: options.documentpath,
    repositoryurl: json.repository + '/tree/' + json.documentcommit,
    changelogurl:
      json.repository + '/blob/' + json.documentcommit + '/CHANGELOG',
    feedbackurl: json.feedbackurl,
    standaardregisterurl: json.standaardregisterurl,
    dependencies: json.dependencies,
    usesVocs: [],
    usesAPs: [],
    namespaces: usednamespaces,
    inDomainNamespaces: inDomainNamespaces,
    autotranslate: autotranslate,
    primaryLanguage: primaryLanguage,
    hostname: hostname,
    uridomain: options.uridomain,
  };
  return meta;
}
