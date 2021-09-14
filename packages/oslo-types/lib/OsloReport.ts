export class OSLOReport {
  public context: object;
  public documentId: string;
  public label: Record<string, string>;
  public issued: string;
  public license: string;
  public title: Record<string, string>;
  public extra: object;
  public authors: object[];
  public contributors: object[];
  public editors: object[];
  public classes: object[];
  public properties: object[];
  public externals: object[];
  public externalProperties: object[];
  //
  // "name": "persoon",
  // "type": "voc",
  // "eap": "OSLO-Persoon-VOC.eap",
  // "diagram": "OSLO-Persoon",
  // "template": "persoon-voc.j2",
  // "title": "Persoon",
  // "publication-state": "https://data.vlaanderen.be/id/concept/StandaardStatus/Standaard",
  // "publication-date": "2018-07-03",
  // "contributors-file": "stakeholders.csv",
  // "contributors-column": "Persoon",
  // "site": "site-skeleton",
  // "feedbackurl": "https://github.com/informatievlaanderen/OSLO-Discussion",
  // "standaardregisterurl": "https://data.vlaanderen.be/standaarden/erkende-standaarden/vocabularium-persoon/vocabularium-persoon.html",
  // "config": "config/config-voc.json",
  // "urlref": "/doc/vocabularium/persoon/ontwerpdocument/2020-01-06",
  // "repository": "https://github.com/Informatievlaanderen/OSLOthema-persoon",
  // "branchtag": "master",
  // "filename": "config/persoon.json",
  // "navigation": {
  // "prev": "/doc/vocabularium/persoon/standaard/2018-07-03"
  // },
  // "documentcommit": "38b982f20d6ec3396d908c5b6d616ae011dc9c93",
  // "toolchaincommit": "7227c3b23456439be61f29cb2bf24d3c95490744",
  // "hostname": "https://data.vlaanderen.be"
  //

  public constructor(data: any) {
    this.context = data['@context'];
    this.documentId = data['@id'];

    this.label = {};
    Object.keys(data.label).forEach(language => {
      this.label[`${language}`] = data.label[language];
    });

    this.issued = data.issued;
    this.license = data.license;

    this.title = {};
    Object.keys(data).forEach(key => {
      if (key.includes('title')) {
        const language = key.split('title-').pop();
        this.title[language!] = data[key];
      }
    });

    this.extra = data.extra;
    this.authors = data.authors;
    this.editors = data.editors;
    this.contributors = data.contributors;
    this.classes = data.classes;
    this.properties = data.properties;
    this.externals = data.externals;
    this.externalProperties = data.externalproperties;
  }
}
