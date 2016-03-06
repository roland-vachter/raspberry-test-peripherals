"use strict";

const rpio = require('rpio');

const MAXTIMINGS = 100;

exports.DHT11 = 11;
exports.DHT22 = 22;

function TempSensor (type, pin) {
	let lastRead = 0;
	let lastTemperature = null;
	let lastHumidity = null;
	let data = [];

	this.read = function () {
		let counter = 0;
		let laststate = rpio.HIGH;
		let j=0;

		let now = new Date().getTime();
		if (now - lastRead < 2000) {
			return {
				humidity: lastHumidity,
				temperature: lastTemperature
			};
		} else {
			lastRead = now + 420;
		}

		// Set GPIO pin to output
		rpio.open(pin, rpio.OUTPUT);

		rpio.write(pin, rpio.HIGH);
		rpio.msleep(500);
		rpio.write(pin, rpio.LOW);
		rpio.msleep(20);
		
		rpio.mode(pin, rpio.INPUT);

		data[0] = data[1] = data[2] = data[3] = data[4] = 0;
		
		// wait for pin to drop?
		let timeout = 100000;
		while (rpio.read(pin) === rpio.HIGH) {
			if (--timeout < 0) {
				new Error("Timeout");
			}
			rpio.usleep(1);
		}
		
		// read data!
		for (let i = 0; i < MAXTIMINGS; i++) {
			counter = 0;
			while (rpio.read(pin) === laststate) {
				counter++;
				if (counter === 1000) {
					console.log('break1');
					break;
				}
			}

			laststate = rpio.read(pin);
			if (counter === 1000) {
				console.log('break2');
				break;
			}
			
			if ((i>3) && (i%2 === 0)) {
				// shove each bit into the storage bytes
				data[j/8] <<= 1;
				if (counter > 200) {
					data[j/8] |= 1;
				}

				j++;
			}
		}

		let temperature;
		let humidity;
		
		if ((j >= 39) && (data[4] === ((data[0] + data[1] + data[2] + data[3]) & 0xff))) {
			if (type === exports.DHT11) {
				temperature = data[2];
				humidity = data[0];
			} else if (type === exports.DHT22) {
				let f, h;
				h = 1.0 * data[0] * 256 + data[1];
				h /= 10;
				
				f = 1.0 * (data[2] & 0x7F) * 256 + data[3];
				f /= 10.0;

				if (data[2] & 0x80) {
					f *= -1;
				}

				temperature = f;
				humidity = h;
			} else {
				new Error(`Unexpected sensor type: ${type}`);
			}
		} else {
			throw new Error(`Unexpected data: j=${j}:
				${data[4]} != ${data[0]} + ${data[1]} + ${data[2]} + ${data[3]}\n`);
		}

		// update last readout
		lastTemperature = temperature;
		lastHumidity = humidity;
		
		return {
			temperature: temperature,
			humidity: humidity
		};
	};
}


let sensor = new TempSensor(exports.DHT22, 3);
let data = sensor.read();

console.log(`Temperature: ${data.temperature}\nHumidity: ${data.humidity}`);
