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
