import type { ISpecification, OSLOReport } from '@oslo-flanders/types';
import { logger } from '@oslo-flanders/types';
import jsonfile = require('jsonfile');
import { helper } from './Helpers';

export interface IReportTranslatorOptions {
  baseLanguage: string;
  targetLanguage: string;
  outputFile: string;
}

export class ReportTranslator implements ISpecification {
  public report: OSLOReport;
  public options: IReportTranslatorOptions;

  public constructor(report: OSLOReport, options: IReportTranslatorOptions) {
    this.report = report;
    this.options = options;
  }

  public generateSpecification = async (): Promise<void> => {
    const reportObject = JSON.parse(JSON.stringify(this.report));
    const translationSimplifiedReportObject = this.createTranslatableJson(
      reportObject,
      this.options.baseLanguage,
      this.options.targetLanguage,
    );
    const translatedReportObject =
      this.mergeTranslation(
        translationSimplifiedReportObject,
        reportObject,
        this.options.baseLanguage,
        this.options.targetLanguage,
      );

    jsonfile.writeFile(this.options.outputFile, translatedReportObject)
      .then(res => {
        logger.info(`[ReportTranslator]: Write complete, file saved to: ${this.options.outputFile}`);
      })
      .catch(error => {
        logger.error(`[ReportTranslator]: Something went wrong when writing to file ${this.options.outputFile}:`);
        logger.error(error);
        process.exitCode = 1;
      });
  };

  public createTranslatableJson = (reportObject: any, baseLanguage: string, targetLanguage: string): any => {
    const result: any = {};
    result.baseURI = reportObject.baseURI;

    result.classes = reportObject.classes &&
      reportObject.classes.map((classObject: any) =>
        helper.extractTargetAttributesToNewObject(classObject, baseLanguage, targetLanguage));

    result.properties = reportObject.properties &&
      reportObject.properties.map((propertyObject: any) =>
        helper.extractTargetAttributesToNewObject(propertyObject, baseLanguage, targetLanguage));

    result.externals = reportObject.externals &&
      reportObject.externals.map((externalObject: any) =>
        helper.extractTargetAttributesToNewObject(externalObject, baseLanguage, targetLanguage));

    result.externalproperties = reportObject.externalproperties &&
      reportObject.externalproperties.map((externalObject: any) =>
        helper.extractTargetAttributesToNewObject(externalObject, baseLanguage, targetLanguage));

    return result;
  };

  public mergeTranslation = (
    translationSimplifiedReportObject: any,
    originalReportObject: any,
    baseLanguage: string,
    targetLanguage: string,
  ): any => {
    const translatedReportObject: any = {};

    if (translationSimplifiedReportObject.baseURI) {
      translatedReportObject.baseURI = translationSimplifiedReportObject.baseURI;
    }

    translatedReportObject.classes =
      helper.translateProperty(
        translationSimplifiedReportObject.classes,
        originalReportObject,
        baseLanguage,
        targetLanguage,
        'classes',
      );

    translatedReportObject.properties =
      helper.translateProperty(
        translationSimplifiedReportObject.properties,
        originalReportObject,
        baseLanguage,
        targetLanguage,
        'properties',
      );

    translatedReportObject.externals =
      helper.translateProperty(
        translationSimplifiedReportObject.externals,
        originalReportObject,
        baseLanguage,
        targetLanguage,
        'externals',
      );

    translatedReportObject.externalproperties = helper.translateProperty(
      translationSimplifiedReportObject.externalproperties,
      originalReportObject,
      baseLanguage,
      targetLanguage,
      'externalproperties',
    );

    return translatedReportObject;
  };
}
