import { Injectable } from '@nestjs/common';

@Injectable()
export class SesMailService {
  constructor() {}
  private templatePath = 'src/core/email/templates/';

  /**
   * Function for sending aws sesemail
   * @param to - to email address
   * @param filename - name of template/html file
   * @param data - key value pair of data to be replaced
   * @param subject - optional mail subject
   */
  public async sentMail() {
    // Code to send mail
  }
}
