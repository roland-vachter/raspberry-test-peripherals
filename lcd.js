var Lcd = require('lcd'),
	lcd = new Lcd({
		rs: 12,
		e: 16,
		data: [5, 6, 13, 19],
		cols: 16,
		rows: 2
	});

lcd.on('ready', function() {
	setInterval(function() {
		lcd.setCursor(0, 0);
		lcd.print(new Date().toISOString().substring(11, 19), function(err) {
			if (err) {
				throw err;
			}
		});
	}, 1000);
});

// If ctrl+c is hit, free resources and exit. 
process.on('SIGINT', function() {
	lcd.close();
	process.exit();
});