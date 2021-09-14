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
