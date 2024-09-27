import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/.';

export class FileUtils {
  static async readSeedCSVFile(fileName: string) {
    const seedFilePath = path.join(
      __dirname,
      '/../../../src/migrations/',
      '/seeddata/',
      fileName,
    );
    const content = fs.readFileSync(seedFilePath);
    const parsedData = parse(content, {
      columns: true,
      skip_empty_lines: true,
      auto_parse: true,
    });
    return parsedData;
  }
}
