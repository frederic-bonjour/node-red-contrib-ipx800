module.exports = function(RED) {

  const http = require('http');

  function IPX800Dimmer(config) {
    RED.nodes.createNode(this, config);

    const IPX = RED.nodes.getNode(config.ipx);
    const URL = `http://${IPX.host}/api/xdevices.json?${IPX.apiKey ? 'key=' + IPX.apiKey + '&' : ''}`;

    this.on('input', async (msg, send, done) => {
      let val = msg.payload !== undefined ? msg.payload : config.level;
      let channel = msg.channel || config.channel;
      if (!channel) {
        this.status({ text: `undefined channel`, fill: 'red', shape: 'square' });
        done();
        return;
      }
      let qs = `Set010v=1&010vCha=${channel}&010vValue=${val}`;
      console.log('IPX800', 'URL=', qs);
      this.status({ text: `sending ${qs}...` });
      http.get(`${URL}${qs}`, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
          data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          const json = JSON.parse(data);
          this.status({
            shape: "dot",
            fill: val ? "green" : "grey",
            text: `C${channel}: ${val}%`
          });
          send({ payload: json });
          if (done) done();
        });

      }).on("error", (err) => {
        console.log("ipx800: error while setting output:", err.message);
        this.status({ fill: "red", shape: "ring", text: err.message });
        if (done) done(err);
      });

    });
  }

  RED.nodes.registerType("ipx800 dimmer", IPX800Dimmer);
};
