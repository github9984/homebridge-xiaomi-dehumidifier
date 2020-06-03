'use strict';
// https://github.com/aschzero/homebridge-airmega/blob/master/lib/services/PurifierService.ts
// http://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-ma4:1
// https://github.com/Colorado4Wheeler/HomeKit-Bridge/wiki/HomeKit-Model-Reference

var Service, Characteristic;
var MIoTDevice = require('./MIoTDehumidifier');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-xiaomi-dehumidifier", "MiDehumidifier", Dehumidifier);
}

function Dehumidifier(log, config) {
    var that = this;
    this.log = log;
    this.services = [];
    this.did = config['did'];
    this.enableLED = config['enableLED'];
    this.enableBuzzer = config['enableBuzzer'];
    this.polling_interval = config['polling_interval'];
    this.max_humidity = config['max_humidity'];
    this.min_humidity = config['min_humidity'];
    this.device = new MIoTDevice(config['did'], config['token'], config['ip']);



    this.device.onChange('power', value => {
        that.updateActive();
        that.updateStatusActive();
        that.updateCurrentHumidifierDehumidifierState();
    });

    this.device.onChange('mode', value => {
        that.updateTargetHumidifierDehumidifierState();
        that.updateDryClothesMode();
    });

    this.device.onChange('temp', value => {
        that.updateTemperature();
    });

    this.device.onChange('humidity', value => {
        that.updateHumidity();
    });

    this.device.onChange('target_humidity', value => {
        that.updateRelativeHumidityDehumidifierThreshold();
    });

    this.device.onChange('child_lock', value => {
        that.updateLockPhysicalControls();
    });

    this.device.onChange('water_tank', value => {
        that.updateWaterTank();
    });

    if (this.enableLED) {
        this.device.onChange('led', value => {
            that.updateLED();
        });
    }

    if (this.enableBuzzer) {
        this.device.onChange('buzzer', value => {
            that.updateBuzzer();
        });
    }

    setInterval(function () {
        try {
            that.log('Polling properties every ' + that.polling_interval + ' milliseconds');
            that.device.pollProperties();
        } catch (e) {
            that.log(e);
        }
    }, that.polling_interval);
}

Dehumidifier.prototype.getServices = function () {
    // Accessory Information Service
    this.informationService = new Service.AccessoryInformation();

    this.informationService
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, 'Xiaomi')
        .setCharacteristic(Characteristic.Model, 'WDH330EFW1')
        .setCharacteristic(Characteristic.SerialNumber, this.did)
        .setCharacteristic(Characteristic.FirmwareRevision, '1.0.0')

    // Service
    this.service = new Service.HumidifierDehumidifier(this.name);

    this.service
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getHumidity.bind(this));

    this.service
        .getCharacteristic(Characteristic.Active)
        .on('get', this.getActive.bind(this))
        .on('set', this.setActive.bind(this));

    this.service
        .getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
        .on('get', this.getCurrentHumidifierDehumidifierState.bind(this));

    this.service
        .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
        .on('get', this.getTargetHumidifierDehumidifierState.bind(this))
        .on('set', this.setTargetHumidifierDehumidifierState.bind(this))
        .setProps({
            validValues: [0, 2]
        });

    this.service
        .getCharacteristic(Characteristic.RelativeHumidityDehumidifierThreshold)
        .on('get', this.getRelativeHumidityDehumidifierThreshold.bind(this))
        .on('set', this.setRelativeHumidityDehumidifierThreshold.bind(this))
        .setProps({
            minValue: 0,
            maxValue: 100,
            minStep: 10,
        })

    this.service
        .getCharacteristic(Characteristic.LockPhysicalControls)
        .on('get', this.getLockPhysicalControls.bind(this))
        .on('set', this.setLockPhysicalControls.bind(this));

    this.service
        .getCharacteristic(Characteristic.SwingMode)
        .on('get', this.getDryClothesMode.bind(this))
        .on('set', this.setDryClothesMode.bind(this))

    // LED
    if (this.enableLED) {
        this.lightService = new Service.Lightbulb('LED');
        this.lightService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getLED.bind(this))
            .on('set', this.setLED.bind(this));
        this.services.push(this.lightService);
    }

    // Buzzer
    if (this.enableBuzzer) {
        this.buzzerService = new Service.Switch('Buzzer');
        this.buzzerService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getBuzzer.bind(this))
            .on('set', this.setBuzzer.bind(this));
        this.services.push(this.buzzerService);
    }

    // Water Tank Sensor
    this.waterTankService = new Service.OccupancySensor('Water Tank');

    this.waterTankService
        .getCharacteristic(Characteristic.StatusActive)
        .on('get', this.getStatusActive.bind(this));
    this.waterTankService
        .getCharacteristic(Characteristic.OccupancyDetected)
        .on('get', this.getWaterTank.bind(this));


    // Temperature Sensor
    this.temperatureSensorService = new Service.TemperatureSensor('Temperature');

    this.temperatureSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on('get', this.getStatusActive.bind(this));
    this.temperatureSensorService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this));

    // Humidity Sensor
    this.humiditySensorService = new Service.HumiditySensor('Humidity');

    this.humiditySensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on('get', this.getStatusActive.bind(this));
    this.humiditySensorService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getHumidity.bind(this));

    // Publish Services
    this.services.push(this.informationService);
    this.services.push(this.service);
    this.services.push(this.temperatureSensorService);
    this.services.push(this.humiditySensorService);
    this.services.push(this.waterTankService);



    return this.services;
}

Dehumidifier.prototype.getActive = function (callback) {
    this.log('getActive');

    try {
        if (this.device.get('power') == true) {
            return callback(null, Characteristic.Active.ACTIVE);
        } else {
            return callback(null, Characteristic.Active.INACTIVE);
        }
    } catch (e) {
        this.log('getActive Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.setActive = function (targetState, callback, context) {
    this.log('setActive ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == Characteristic.Active.ACTIVE) {
            this.device.set('power', true);
        } else {
            this.device.set('power', false);
        }

        callback();
    } catch (e) {
        this.log('setActive Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateActive = function () {

    try {
        var value = this.device.get('power');
        var targetValue = value ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;

        this.service
            .getCharacteristic(Characteristic.Active)
            .setValue(targetValue, undefined, 'fromOutsideHomekit');

        this.log('updateActive to ' + value);
    } catch (e) {
        this.log('updateActive Failed: ' + e);
    }
}

Dehumidifier.prototype.getCurrentHumidifierDehumidifierState = function (callback) {
    this.log('getCurrentHumidifierDehumidifierState');

    try {
        if (this.device.get('power') == true) {
            return callback(null, Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING);
        } else {
            return callback(null, Characteristic.CurrentHumidifierDehumidifierState.INACTIVE);
        }
    } catch (e) {
        this.log('getCurrentHumidifierDehumidifierState Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateCurrentHumidifierDehumidifierState = function () {

    try {
        var value = this.device.get('power');

        var targetValue = value ? Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING : Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;

        this.service.setCharacteristic(Characteristic.CurrentHumidifierDehumidifierState, targetValue);

        this.log('updateCurrentHumidifierDehumidifierState to ' + value);

    } catch (e) {
        this.log('updateCurrentHumidifierDehumidifierState Failed: ' + e);
    }

}

Dehumidifier.prototype.getTargetHumidifierDehumidifierState = function (callback) {
    this.log('getTargetHumidifierDehumidifierState');

    try {

        // 1 (Auto), 2 (Continue), 3 (Dry Clothes)
        var value = this.device.get('mode');

        if (value == 1) { // target_humidity
            callback(null, Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER);
        } else if (value == 2) { // continuous
            callback(null, Characteristic.TargetHumidifierDehumidifierState.AUTO);
        } else if (value == 3) { // dry clothes
            callback(null, Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER);
        }

    } catch (e) {
        this.log('getCurrentHumidifierDehumidifierState Failed: ' + e);
        callback(e);
    }
}


Dehumidifier.prototype.setTargetHumidifierDehumidifierState = function (targetState, callback, context) {
    this.log('setTargetHumidifierDehumidifierState ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {

        // 1 (Auto), 2 (Continue), 3 (Dry Clothes)
        var mode;

        switch (targetState) {
            case 0: // auto                     
                mode = 2
                break;
            case 2: // dehumidifying
                mode = 1
                break;
            default:
                mode = 1
        }

        this.device.set('mode', mode);

        callback();
    } catch (e) {
        this.log('setTargetHumidifierDehumidifierState Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateTargetHumidifierDehumidifierState = function () {

    try {

        // 1 (Auto), 2 (Continue), 3 (Dry Clothes)
        var value = this.device.get('mode');
        var targetValue;

        if (value == 1) { // target_humidity
            var targetValue = Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER;
        } else if (value == 2) { // continuous
            var targetValue = Characteristic.TargetHumidifierDehumidifierState.AUTO;
        } else if (value == 3) { // dry clothes
            var targetValue = Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER;
        }

        this.service
            .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
            .setValue(targetValue, undefined, 'fromOutsideHomekit');

        this.log('updateTargetHumidifierDehumidifierState to ' + value);
    } catch (e) {
        this.log('updateTargetHumidifierDehumidifierState Failed: ' + e);
    }
}


Dehumidifier.prototype.getRelativeHumidityDehumidifierThreshold = function (callback) {
    this.log('getRelativeHumidityDehumidifierThreshold');

    try {
        var value = this.device.get('target_humidity');
        callback(null, value);
    } catch (e) {
        this.log('getRelativeHumidityDehumidifierThreshold Failed: ' + e);
        callback(e);
    }
}


Dehumidifier.prototype.setRelativeHumidityDehumidifierThreshold = function (targetState, callback, context) {

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {

        if (targetState > this.max_humidity) {
            this.device.set('target_humidity', this.max_humidity);
            this.log('setRelativeHumidityDehumidifierThreshold ' + this.max_humidity + ' ' + context);
        }
        else if (targetState < this.min_humidity) {
            this.device.set('target_humidity', this.min_humidity);
            this.log('setRelativeHumidityDehumidifierThreshold ' + this.min_humidity + ' ' + context);
        }
        else {
            this.device.set('target_humidity', targetState);
            this.log('setRelativeHumidityDehumidifierThreshold ' + targetState + ' ' + context);
        }

        callback();
    } catch (e) {
        this.log('setRelativeHumidityDehumidifierThreshold Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateRelativeHumidityDehumidifierThreshold = function () {

    try {
        var value = this.device.get('target_humidity');

        this.service
            .getCharacteristic(Characteristic.RelativeHumidityDehumidifierThreshold)
            .setValue(value, undefined, 'fromOutsideHomekit');

        this.log('updateRelativeHumidityDehumidifierThreshold to ' + value);
    } catch (e) {
        this.log('updateRelativeHumidityDehumidifierThreshold Failed: ' + e);
    }
}







Dehumidifier.prototype.getLockPhysicalControls = function (callback) {
    this.log('getLockPhysicalControls');

    try {
        if (this.device.get('child_lock') == true) {
            return callback(null, Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED);
        } else {
            return callback(null, Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
        }
    } catch (e) {
        this.log('getLockPhysicalControls Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.setLockPhysicalControls = function (targetState, callback, context) {
    this.log('setLockPhysicalControls ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED) {
            this.device.set('child_lock', true);
        } else {
            this.device.set('child_lock', false);
        }

        callback();
    } catch (e) {
        this.log('setLockPhysicalControls Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateLockPhysicalControls = function () {


    try {
        var value = this.device.get('child_lock');

        var targetValue = value ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;

        this.service
            .getCharacteristic(Characteristic.LockPhysicalControls)
            .setValue(targetValue, undefined, 'fromOutsideHomekit');

        this.log('updateLockPhysicalControls to ' + value);
    } catch (e) {
        this.log('updateLockPhysicalControls Failed: ' + e);
    }
}



Dehumidifier.prototype.getDryClothesMode = function (callback) {
    this.log('getDryClothesMode');

    try {
        var value = this.device.get('mode');

        if (value == 1) {
            callback(null, Characteristic.SwingMode.SWING_DISABLED);
        } else if (value == 2) {
            callback(null, Characteristic.SwingMode.SWING_DISABLED);
        } else if (value == 3) {
            callback(null, Characteristic.SwingMode.SWING_ENABLED);
        }

    } catch (e) {
        this.log('getDryClothesMode Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.setDryClothesMode = function (targetState, callback, context) {
    this.log('setDryClothesMode ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == Characteristic.SwingMode.SWING_ENABLED) {
            this.device.set('mode', 3); // dry clothes
        } else {
            this.device.set('mode', 1); // target_humidity
        }

        callback();
    } catch (e) {
        this.log('setDryClothesMode Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateDryClothesMode = function () {


    try {
        var value = this.device.get('mode');
        var targetValue;

        if (value == 3) { // dry clothes
            targetValue = Characteristic.SwingMode.SWING_ENABLED
        }
        else {
            targetValue = Characteristic.SwingMode.SWING_DISABLED;
        }

        this.service
            .getCharacteristic(Characteristic.SwingMode)
            .setValue(targetValue, undefined, 'fromOutsideHomekit');

        this.log('updateDryClothesMode to ' + value);
    } catch (e) {
        this.log('updateDryClothesMode Failed: ' + e);
    }
}



Dehumidifier.prototype.getStatusActive = function (callback) {
    this.log('getStatusActive');

    try {
        var value = this.device.get('power');

        return callback(null, value);

    } catch (e) {
        this.log('getStatusActive Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateStatusActive = function () {

    try {
        var value = this.device.get('power');

        if (value == true) {

            this.temperatureSensorService.setCharacteristic(Characteristic.StatusActive, true);
            this.humiditySensorService.setCharacteristic(Characteristic.StatusActive, true);
            this.waterTankService.setCharacteristic(Characteristic.StatusActive, true);

        } else {

            this.temperatureSensorService.setCharacteristic(Characteristic.StatusActive, false);
            this.humiditySensorService.setCharacteristic(Characteristic.StatusActive, false);
            this.waterTankService.setCharacteristic(Characteristic.StatusActive, true);

        }

        this.log('updateStatusActive to ' + value);

    } catch (e) {
        this.log('updateStatusActive Failed: ' + e);
    }
}




Dehumidifier.prototype.getTemperature = function (callback) {
    this.log("getTemperature");

    try {
        var value = this.device.get('temp');

        return callback(null, value);
    } catch (e) {
        this.log('getTemperature Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateTemperature = function () {

    try {
        var value = this.device.get('temp')
        this.temperatureSensorService.setCharacteristic(Characteristic.CurrentTemperature, value);

        this.log('updateTemperature to ' + value);
    } catch (e) {
        this.log('updateTemperature Failed: ' + e);
    }
}
Dehumidifier.prototype.getHumidity = function (callback) {
    this.log("getHumidity");

    try {
        return callback(null, this.device.get('humidity'));
    } catch (e) {
        this.log('getHumidity Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateHumidity = function () {


    try {
        var value = this.device.get('humidity');
        this.humiditySensorService.setCharacteristic(Characteristic.CurrentRelativeHumidity, value);

        this.log('updateHumidity to ' + value);
    } catch (e) {
        this.log('updateHumidity Failed: ' + e);
    }
}

Dehumidifier.prototype.getWaterTank = function (callback) {
    this.log("getWaterTank");

    try {
        var value = this.device.get('water_tank');

        return callback(null, value);
    } catch (e) {
        this.log('getWaterTank Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateWaterTank = function () {
    try {
        var value = this.device.get('water_tank');

        this.waterTankService.setCharacteristic(Characteristic.OccupancyDetected, value);

        this.log('updateWaterTank to ' + value);
    } catch (e) {
        this.log('updateWaterTank Failed: ' + e);
    }
}


Dehumidifier.prototype.getLED = function (callback) {
    this.log('getLED');

    try {
        var value = this.device.get('led');

        return callback(null, value);

    } catch (e) {
        this.log('getLED Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.setLED = function (targetState, callback, context) {
    this.log('setLED ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == true) {
            this.device.set('led', true);
        }
        else {
            this.device.set('led', false);
        }

        callback();
    } catch (e) {
        this.log('setLED Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateLED = function () {


    try {
        var value = this.device.get('led');

        this.lightService
            .getCharacteristic(Characteristic.On)
            .setValue(value, undefined, 'fromOutsideHomekit');

        this.log('updateLED to ' + value);
    } catch (e) {
        this.log('updateLED Failed: ' + e);
    }
}


Dehumidifier.prototype.getBuzzer = function (callback) {
    this.log('getBuzzer');

    try {
        var value = this.device.get('buzzer');

        return callback(null, value);

    } catch (e) {
        this.log('getBuzzer Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.setBuzzer = function (targetState, callback, context) {
    this.log('setBuzzer ' + targetState + ' ' + context);

    if (context === 'fromOutsideHomekit') { return callback(); }

    try {
        if (targetState == true){
            this.device.set('buzzer', true);
        }
        else{
            this.device.set('buzzer', false);
        }
        

        callback();
    } catch (e) {
        this.log('setBuzzer Failed: ' + e);
        callback(e);
    }
}

Dehumidifier.prototype.updateBuzzer = function () {


    try {
        var value = this.device.get('buzzer');

         this.buzzerService
            .getCharacteristic(Characteristic.On)
            .setValue(value, undefined, 'fromOutsideHomekit');

        this.log('updateBuzzer to ' + value);
    } catch (e) {
        this.log('updateBuzzer Failed: ' + e);
    }
}
