import path from 'path';
import { promises as fs } from 'fs';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Util } from './util';

export class Announcer {
  static client = new TextToSpeechClient();

  static async load(text: string) {
    const storage = path.resolve('public', 'tmp');
    if (!(await Util.isDirectory(storage))) {
      try {
        await fs.mkdir(storage);
      } catch (err) {
        console.error(err);
      }
    }

    const destination = path.resolve('public', 'tmp', `${text.replace(/\s+/g, '-').toLowerCase()}.mp3`);
    if (!(await Util.isFile(destination))) {
      try {
        await this.fetch(text, destination);
      } catch (err) {
        console.error(err);
      }
    }

    return '/' + path.relative(path.resolve('public'), destination);
  }

  static async fetch(text: string, destination: string) {
    try {
      const [response] = await this.client.synthesizeSpeech({
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'MALE', name: 'en-US-Wavenet-D' },
        audioConfig: { audioEncoding: 'MP3' },
      });

      await fs.writeFile(destination, response.audioContent, 'binary');

      console.log(`Audio content written to file: ${destination}`);
      return destination;
    } catch (err) {
      console.error(err);
      console.error(`Failed to fetch ${text}`);
    }
  }
}
