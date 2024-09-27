import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

export function configureHandlebars() {
  const partialsDir = 'src/core/email/templates/partials';
  const filenames = readdirSync(partialsDir);
  filenames.forEach((filename) => {
    const partialName = filename.replace('.hbs', '');
    const partialPath = join(partialsDir, filename);
    const partialTemplate = readFileSync(partialPath, 'utf-8');
    Handlebars.registerPartial(partialName, partialTemplate);
  });
}
