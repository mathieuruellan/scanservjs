const fs = require('fs');
const log = require('loglevel').getLogger('Api');

const Config = require('../config/config');
const Context = require('./Context');
const Device = require('./Device');
const FileInfo = require('./FileInfo');
const Process = require('./Process');
const Request = require('./Request');
const Scanimage = require('./Scanimage');

class Api {
  static async fileList() {
    log.debug('fileList()');
    return await new Promise((resolve, reject) => {
      let outdir = Config.outputDirectory;
      fs.readdir(outdir, (err, list) => {
        if (err) {
          reject(err);
        }
  
        let files = list
          .map(f => new FileInfo(outdir + f))
          .filter(f => ['.tif', '.jpg', '.png', '.pdf'].includes(f.extension));

        log.debug(files);
        resolve(files);
      });
    });
  }

  static fileDelete(fullpath) {
    const file = new FileInfo(fullpath);
    return file.delete();
  }

  static async createPreview(req) {
    const context = await Context.create();
    const request = new Request(context).extend({
      params: {
        deviceId: req.params.deviceId,
        mode: req.params.mode,
        resolution: Config.previewResolution,
        brightness: req.params.brightness,
        contrast: req.params.contrast,
        dynamicLineart: req.params.dynamicLineart
      }
    });

    const cmd = `${Scanimage.command(request)} > ${Config.previewDirectory}preview.tif`;
    log.debug('Executing cmd:', cmd);
    await Process.spawn(cmd);
    return {};
  }

  static async readPreview() {
    let options = {
      default: Config.previewDirectory + 'default.jpg',
      source: Config.previewDirectory + 'preview.tif',
      target: Config.previewDirectory + 'preview.jpg',
      trim: false
    };

    let source = new FileInfo(options.source);
    if (!source.exists()) {
      return new FileInfo(options.default).toBuffer();
    }
  
    let buffer = source.toBuffer();
    return await Process.chain(Config.previewPipeline.commands, buffer, true);
  }

  static async scan(req) {
    const context = await Context.create();
    const request = new Request(context).extend(req);
    const pipeline = context.pipelines.filter(p => p.description === request.pipeline)[0];
    const cmds = [Scanimage.command(request)].concat(pipeline.commands);

    log.debug('Executing cmds:', cmds);
    const buffer = await Process.chain(cmds);
    const filename = `${Config.outputDirectory}${Config.filename()}.${pipeline.extension}`;
    const file = new FileInfo(filename);
    file.save(buffer);
    log.debug(`Written data to: ${filename}`);

    return {};
  }

  static async context(force) {
    if (force) {
      Device.reset();
    }
    return await Context.create();
  }
}

module.exports = Api;