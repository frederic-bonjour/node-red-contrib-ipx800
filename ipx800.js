module.exports = function(RED) {

  const http = require('http');

  function IPX800Node(config) {
    RED.nodes.createNode(this, config);
    this.host = config.host;
    this.apiKey = config.apiKey;
  }
  RED.nodes.registerType("ipx800", IPX800Node, {
    credentials: {
      apiKey: { type: 'text' }
    }
  });


  function IPX800Output(config) {
    RED.nodes.createNode(this, config);

    const IPX = RED.nodes.getNode(config.ipx);    
    const URL = `http://${IPX.host}/api/xdevices.json?${IPX.apiKey ? 'key=' + IPX.apiKey + '&' : ''}`;

    this.on('input', async (msg, send, done) => {
      let val = msg.payload;
      if (config.inverted) val = !val;
      let qs = `${val ? 'SetR' : 'ClearR'}=${config.output}`;

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
            fill: msg.payload ? "green" : "grey",
            text: msg.payload ? 'on' : 'off'
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

  RED.nodes.registerType("ipx800 output", IPX800Output);
}; 