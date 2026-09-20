'use strict';

const { URL } = require('url');

const Homey = require('homey');

const POLL_INTERVAL = 10000; // Poll every 10 seconds

module.exports = class FullyKioskBrowserDevice extends Homey.Device {

  discoveryResult = null;

  async onInit() {
    this.registerCapabilityListener('onoff', async (value) => {
      if (value === true) {
        await this.cmd_screenOn();
      } else {
        await this.cmd_screenOff();
      }
    });

    this.pollInterval = this.homey.setInterval(() => {
      this.poll();
    }, POLL_INTERVAL);
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    // Test the new password
    await this.cmd({
      cmd: 'getDeviceInfo',
      password: newSettings.password,
    });
  }

  poll() {
    Promise.resolve().then(async () => {
      const deviceInfo = await this.cmd_getDeviceInfo();
      this.log('Device Info:', JSON.stringify(deviceInfo));

      this.setCapabilityValue('onoff', deviceInfo.screenOn === true).catch(err => this.error(`Error setting capability onoff: ${err.message}`));
    }).catch(err => this.error(`Error Polling: ${err.message}`));

  }

  onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    this.log('Discovery:', discoveryResult);
    this.discoveryResult = discoveryResult;
    this.poll();
  }

  async cmd({
    cmd = null,
    params = {},
    password = null,
  }) {
    if (!cmd) throw new Error('Command is required');

    if (password === null) {
      const settings = await this.getSettings();
      password = settings.password;
    }

    const url = new URL('http://localhost');
    url.protocol = 'http:';
    url.hostname = this.discoveryResult.address;
    url.port = this.discoveryResult.port;
    url.searchParams.set('cmd', cmd);
    url.searchParams.set('password', password);
    url.searchParams.set('type', 'json');

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    this.log(`Req ${url.toString()}`);

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

    return resJson;
  }

  async cmd_getDeviceInfo() {
    return this.cmd({ cmd: 'getDeviceInfo' });
  }

  async cmd_screenOn() {
    await this.cmd({ cmd: 'screenOn' });
  }

  async cmd_screenOff() {
    await this.cmd({ cmd: 'screenOff' });
  }

  async cmd_restartApp() {
    await this.cmd({ cmd: 'restartApp' });
  }

  async cmd_loadStartUrl() {
    await this.cmd({ cmd: 'loadStartUrl' });
  }

  async cmd_loadUrl({ url }) {
    await this.cmd({
      cmd: 'loadUrl',
      params: { url },
    });
  }

  async cmd_refreshTab() {
    await this.cmd({ cmd: 'refreshTab' });
  }

  async cmd_clearCache() {
    await this.cmd({ cmd: 'clearCache' });
  }

  async cmd_startScreensaver() {
    await this.cmd({ cmd: 'startScreensaver' });
  }

  async cmd_stopScreensaver() {
    await this.cmd({ cmd: 'stopScreensaver' });
  }

  async cmd_triggerMotion() {
    await this.cmd({ cmd: 'triggerMotion' });
  }

  async cmd_lockKiosk() {
    await this.cmd({ cmd: 'lockKiosk' });
  }

  async cmd_unlockKiosk() {
    await this.cmd({ cmd: 'unlockKiosk' });
  }

  async cmd_toForeground() {
    await this.cmd({ cmd: 'toForeground' });
  }

  async cmd_toBackground() {
    await this.cmd({ cmd: 'toBackground' });
  }

  async cmd_startApplication({ package: packageName }) {
    await this.cmd({
      cmd: 'startApplication',
      params: { package: packageName },
    });
  }

  async cmd_startIntent({ url }) {
    await this.cmd({
      cmd: 'startIntent',
      params: { url },
    });
  }

  async cmd_setOverlayMessage({ text }) {
    await this.cmd({
      cmd: 'setOverlayMessage',
      params: { text },
    });
  }

  async cmd_textToSpeech({ text }) {
    await this.cmd({
      cmd: 'textToSpeech',
      params: { text },
    });
  }

  async cmd_stopTextToSpeech() {
    await this.cmd({ cmd: 'stopTextToSpeech' });
  }

  async cmd_setAudioVolume({ level, stream }) {
    await this.cmd({
      cmd: 'setAudioVolume',
      params: { level, stream },
    });
  }

  async cmd_playSound({ url, loop, stream }) {
    await this.cmd({
      cmd: 'playSound',
      params: { url, loop, stream },
    });
  }

  async cmd_stopSound() {
    await this.cmd({ cmd: 'stopSound' });
  }

  async cmd_playVideo({ url, loop, showControls, exitOnTouch, exitOnCompletion }) {
    await this.cmd({
      cmd: 'playVideo',
      params: { url, loop, showControls, exitOnTouch, exitOnCompletion },
    });
  }

  async cmd_stopVideo() {
    await this.cmd({ cmd: 'stopVideo' });
  }

  async cmd_setBooleanSetting({ key, value }) {
    await this.cmd({
      cmd: 'setBooleanSetting',
      params: { key, value },
    });
  }

  async cmd_setStringSetting({ key, value }) {
    await this.cmd({
      cmd: 'setStringSetting',
      params: { key, value },
    });
  }

};
