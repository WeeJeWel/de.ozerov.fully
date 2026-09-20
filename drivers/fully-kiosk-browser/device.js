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

};
