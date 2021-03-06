const log = require('loglevel').getLogger('Scanimage');

const CmdBuilder = require('./CmdBuilder');
const Config = require('../config/config');

class Scanimage {
  static command(request) {
    log.debug(request);
    const params = request.params;
    const cmdBuilder = new CmdBuilder(Config.scanimage);
    cmdBuilder.arg('-d', params.deviceId)
      .arg('--mode', params.mode)
      .arg('--resolution', params.resolution)
      .arg('-l', params.left)
      .arg('-t', params.top)
      .arg('-x', params.width)
      .arg('-y', params.height)
      .arg('--format', params.format);
  
    if ('depth' in params) {
      cmdBuilder.arg('--depth', params.depth);
    }
    if ('brightness' in params) {
      cmdBuilder.arg('--brightness', params.brightness);
    }
    if ('contrast' in params) {
      cmdBuilder.arg('--contrast', params.contrast);
    }
    if (params.mode === 'Lineart' && params.dynamicLineart === false) {
      cmdBuilder.arg('--disable-dynamic-lineart=yes');
    }
  
    return cmdBuilder.build();
  }

}

module.exports = Scanimage;
