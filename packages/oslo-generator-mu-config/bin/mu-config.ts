import { OSLOReport } from '@oslo-flanders/types';
import type { OptionValues } from 'commander';
import { program } from 'commander';
import jsonfile = require('jsonfile');
import { MuConfigGenerator } from '..';

program
  .usage('Merges translation json with original jsonld')
  .requiredOption('-i, --input <path>', 'input file (a jsonld file)')
  .requiredOption('-l, --language <languagecode>', 'target language (languagecode)')
  .option('-o, --outputDirectory <path to directory>', 'output directory (directory path). Default: data', 'data')
  .option(
    '-s, --stringType <boolean>',
    'a variable to define if the properties are a language-string (true) or a normal string (false). Default: false',
    false,
  )
  .option(
    '-e, --externals <boolean>',
    'include external classes and properties in the configuration or not. Default: false',
    false,
  )
  .parse();

const options = program.opts();

const run = async (_options: OptionValues): Promise<void> => {
  const data = await jsonfile.readFile(_options.input);
  const report = new OSLOReport(data);
  const generator = new MuConfigGenerator(
    report,
    {
      outputDirectory: _options.outputDirectory,
      targetLanguage: _options.language,
      stringType: _options.stringType,
      includeExternals: _options.externals,
    },
  );

  await generator.generateSpecification();
};

run(options).catch(error => console.log(error));
