'use strict';

const { URL } = require('url');

const Homey = require('homey');

module.exports = class FullyKioskBrowserDriver extends Homey.Driver {

  async onInit() {
    this.homey.flow.getActionCard('cmd_loadStartUrl').registerRunListener(async ({ device }) => {
      await device.cmd_loadStartUrl();
    });

    this.homey.flow.getActionCard('cmd_loadUrl').registerRunListener(async ({ device, url }) => {
      await device.cmd_loadUrl({ url });
    });

    this.homey.flow.getActionCard('cmd_refreshTab').registerRunListener(async ({ device }) => {
      await device.cmd_refreshTab();
    });

    this.homey.flow.getActionCard('cmd_clearCache').registerRunListener(async ({ device }) => {
      await device.cmd_clearCache();
    });

    this.homey.flow.getActionCard('cmd_startScreensaver').registerRunListener(async ({ device }) => {
      await device.cmd_startScreensaver();
    });

    this.homey.flow.getActionCard('cmd_stopScreensaver').registerRunListener(async ({ device }) => {
      await device.cmd_stopScreensaver();
    });

    this.homey.flow.getActionCard('cmd_triggerMotion').registerRunListener(async ({ device }) => {
      await device.cmd_triggerMotion();
    });

    this.homey.flow.getActionCard('cmd_lockKiosk').registerRunListener(async ({ device }) => {
      await device.cmd_lockKiosk();
    });

    this.homey.flow.getActionCard('cmd_unlockKiosk').registerRunListener(async ({ device }) => {
      await device.cmd_unlockKiosk();
    });

    this.homey.flow.getActionCard('cmd_toForeground').registerRunListener(async ({ device }) => {
      await device.cmd_toForeground();
    });

    this.homey.flow.getActionCard('cmd_toBackground').registerRunListener(async ({ device }) => {
      await device.cmd_toBackground();
    });

    this.homey.flow.getActionCard('cmd_restartApp').registerRunListener(async ({ device }) => {
      await device.cmd_restartApp();
    });

    this.homey.flow.getActionCard('cmd_startApplication').registerRunListener(async ({ device, package: packageName }) => {
      await device.cmd_startApplication({ package: packageName });
    });

    this.homey.flow.getActionCard('cmd_startIntent').registerRunListener(async ({ device, url }) => {
      await device.cmd_startIntent({ url });
    });

    this.homey.flow.getActionCard('cmd_setOverlayMessage').registerRunListener(async ({ device, text }) => {
      await device.cmd_setOverlayMessage({ text });
    });

    this.homey.flow.getActionCard('cmd_textToSpeech').registerRunListener(async ({ device, text }) => {
      await device.cmd_textToSpeech({ text });
    });

    this.homey.flow.getActionCard('cmd_stopTextToSpeech').registerRunListener(async ({ device }) => {
      await device.cmd_stopTextToSpeech();
    });

    this.homey.flow.getActionCard('cmd_setAudioVolume').registerRunListener(async ({ device, level, stream }) => {
      await device.cmd_setAudioVolume({ level, stream });
    });

    this.homey.flow.getActionCard('cmd_playSound').registerRunListener(async ({ device, url, loop, stream }) => {
      await device.cmd_playSound({ url, loop, stream });
    });

    this.homey.flow.getActionCard('cmd_stopSound').registerRunListener(async ({ device }) => {
      await device.cmd_stopSound();
    });

    this.homey.flow.getActionCard('cmd_playVideo').registerRunListener(async ({ device, url, loop, showControls, exitOnTouch, exitOnCompletion }) => {
      await device.cmd_playVideo({ url, loop, showControls, exitOnTouch, exitOnCompletion });
    });

    this.homey.flow.getActionCard('cmd_stopVideo').registerRunListener(async ({ device }) => {
      await device.cmd_stopVideo();
    });

    this.homey.flow.getActionCard('cmd_setBooleanSetting').registerRunListener(async ({ device, key, value }) => {
      await device.cmd_setBooleanSetting({ key, value });
    });

    this.homey.flow.getActionCard('cmd_setStringSetting').registerRunListener(async ({ device, key, value }) => {
      await device.cmd_setStringSetting({ key, value });
    });
  }

  async onPair(session) {
    session.setHandler('list_devices', async () => {
      const discoveryStrategy = this.getDiscoveryStrategy();
      const discoveryResults = discoveryStrategy.getDiscoveryResults();

      const devices = Object.values(discoveryResults).map(discoveryResult => {
        return {
          name: `${discoveryResult.name} at ${discoveryResult.address}`,
          data: {
            id: discoveryResult.id,
          },
        };
      });

      return devices;
    });

    session.setHandler('verify_password', async ({ device, password }) => {
      const discoveryStrategy = this.getDiscoveryStrategy();
      const discoveryResults = discoveryStrategy.getDiscoveryResults();
      const discoveryResult = discoveryResults[device.data.id];
      if (!discoveryResult) {
        throw new Error('Discovery Strategy Not Found');
      }

      const url = new URL('http://localhost');
      url.protocol = 'http:';
      url.hostname = discoveryResult.address;
      url.port = discoveryResult.port;
      url.searchParams.set('cmd', 'getDeviceInfo');
      url.searchParams.set('password', password);
      url.searchParams.set('type', 'json');

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }

      const resJson = await res.json();
      this.log('Res JSON', JSON.stringify(resJson));

      if (resJson?.status === 'Error') {
        if (resJson?.statustext === 'Please login') {
          throw new Error('Invalid Password');
        }

        throw new Error(resJson?.statustext || 'Unknown Error');
      }

      return {
        deviceName: resJson.deviceName,
      };
    });
  }

};
