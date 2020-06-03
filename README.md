[![npm version](https://badge.fury.io/js/homebridge-xiaomi-dehumidifier.svg)](https://badge.fury.io/js/homebridge-xiaomi-dehumidifier)

# homebridge-xiaomi-dehumidifier

 
 

![homebridge-xiaomi-dehumidifier](https://cf.shopee.co.th/file/9b42218eab81d360e2696abb9005ef23)

*** Please note: This only tested for the New Widetech Dehumidifier 30L.

### Features

* Switch on / off.

* Switch continuous / target humidity / dry mode.

* Change target humidity level.

* Switch LED light on / off.

* Switch buzzer sound on / off.

* Display temperature.

* Display humidity.

* Display water tank status.

### Installation

1. Install required packages.

	

``` 
	npm install -g homebridge-xiaomi-dehumidifier
	```

2. Make sure your Homebridge server is same network with your device, then run following command to discover the token.

	

``` 
	miio discover --sync
	```

3. You may need to wait few minutes until you get the response similar to below:

	

``` 
	Device ID: 49466088
	Model info: Unknown
	Address: 192.168.1.8
	Token: 6f7a65786550386c700a6b526666744d via auto-token
	Support: Unknown
	```

4. Record down the `Address` and `Token` values as we need it in our configuration file later.

5. If you are getting `??????????????` for your token value, please reset your device and connect your Homebridge server directly to the access point advertised by the device.

6. Then run the command again.

	

``` 
	miio discover --sync
	```

7. Add following accessory to the `config.json` .

	

``` 
		"accessories": [
		 {
			"accessory": "MiDehumidifier",
			"name": "Living Room Dehumidifier",
			"did": "xxxxxxxxxx",
			"ip": "192.168.1.x",
			"token": "xxxxxxxxxxxxxxxxxxxxx",
			"enableLED": false,
			"enableBuzzer": false,
			"max_humidity": 70,
			"min_humidity": 30,
			"polling_interval": 60000
		 }
		]
```

**Notes:** Set value for `enableLED` , `enableBuzzer` to **true** or **false** to show or hide these sensors in Home app.

8. Restart Homebridge, and your device will be added to Home app.

# License

MIT License
