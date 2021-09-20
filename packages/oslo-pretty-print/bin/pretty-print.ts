import type { OptionValues } from 'commander';
import { program } from 'commander';
import jsonfile = require('jsonfile');
import { PrettyPrinter } from '..';
import { OSLOReport } from '../../oslo-generator-jsonld/node_modules/@oslo-flanders/types';

program
  .usage('pretty-print a json-ld context')
  .requiredOption('-i, --input <path>', 'input file (a jsonld file)')
  .option('-o, --output <path>', 'output file. Default context.jsonld', 'context.jsonld')
  .option('-s, --sortkeys [keys...]', 'keys to sort on. Default: none', '')
  .option('-a, --sortAttributes [attributes...]',
    'attributes to sort on. Use prefixes to set sorting order per attribute as asc: or desc:. Default: none ',
    '')
  .option('--descending', 'set global sorting order to descending. Default: ascending (false)', false)
  .parse();

const options = program.opts();

const run = async (_options: OptionValues): Promise<void> => {
  const data = await jsonfile.readFile(_options.input);
  const report = new OSLOReport(data);
  const generator = new PrettyPrinter(report,
    {
      outputFile: _options.output,
      sortingAttributes: _options.sortAttributes || [],
      sortingKeys: _options.sortKeys || [],
      descendingSort: _options.descending,
    });

  await generator.generateSpecification();
};

run(options).catch(error => console.error(error));
