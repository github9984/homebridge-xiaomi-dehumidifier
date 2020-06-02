var MIoTDevice = require('./MIoTDevice');

class MIoTDehumidifier extends MIoTDevice {
    constructor(did, token, ip) {
        super(did, token, ip);

        this.dictionary = {
            'power': [2, 1], // bool
            // 'fan_level': [2, 7], // Fan Level : 0 (Off), 1(Level 1), 2(Level 2), 3(Level 3)
            'mode': [2, 3], // Mode : 1(Auto/Target_Humidity), 2(Continue), 3(Dry Clothes)					
            'target_humidity': [2, 5], // Target Humidity: 30, 40, 50, 60, 70
            'humidity': [3, 1], // Relative Humidity: 0-100(Percentage)
            'temp': [3, 7], // Temperature: -30,100,1					
            'child_lock': [6, 1], // Physical Control Locked : bool
            'led': [5, 1], // bool
            'buzzer': [4, 1], // bool
            'water_tank': [7, 3]  // bool
        }
        for (var propertyName in this.dictionary) {
            this.trackProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1]);
        };


    }

    get(propertyName) {
        if (!this.dictionary.hasOwnProperty(propertyName)) {
            throw 'MIoTDevice property \'' + propertyName + '\' is not defined';
        }

        return this.getProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1]);
    }

    set(propertyName, value) {
        if (!this.dictionary.hasOwnProperty(propertyName)) {
            throw 'MIoTDevice property \'' + propertyName + '\' is not defined';
        }

        this.setProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1], value);
    }

    onChange(propertyName, callback) {
        if (!this.dictionary.hasOwnProperty(propertyName)) {
            throw 'MIoTDevice property \'' + propertyName + '\' is not defined';
        }

        this.onChangeProperty(this.dictionary[propertyName][0], this.dictionary[propertyName][1], callback);
    }


}

module.exports = MIoTDehumidifier
