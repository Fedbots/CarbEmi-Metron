const fetch = require('node-fetch');
const factors = require('./emissionFactors');

module.exports = async function (context, req) {
	if (req.method === 'POST') {
		const factor = req.body?.factor;
		let money = parseFloat(req.body?.money);
		let unit = req.body?.unit;

		if (!factors.includes(factor)) {
			context.res = {
				status: 400,
				body: JSON.stringify({ error: 'Invalid Emission Factor!' }),
				headers: {
					'Content-Type': 'application/json'
				}
			};
			return undefined;
		}

		if (!['USD', 'EUR', 'GBP'].includes(unit)) {
			const conversion = await fetch(
				`https://openexchangerates.org/api/latest.json?app_id=${process.env.OPENEXCHANGE_KEY}`
			).then(res => res.json());

			if (conversion.base === 'USD') {
				const rate = conversion.rates[unit];
				money = parseFloat(money / rate);
				unit = 'usd';
			} else {
				context.res = {
					status: 500,
					body: JSON.stringify({ error: 'Something went wrong!' }),
					headers: {
						'Content-Type': 'application/json'
					}
				};
				return undefined;
			}
		} else {
			unit = unit.toLowerCase();
		}

		const data = await fetch('https://beta3.api.climatiq.io/estimate', {
			method: 'POST',
			body: JSON.stringify({
				emission_factor: factor,
				// Reasonable defaults - 100 USD.
				parameters: { money: money || 100, money_unit: unit || 'usd' }
			}),
			headers: {
				Authorization: `Bearer ${process.env.CLIMATIQ_KEY}`,
				'Content-Type': 'application/json'
			}
		}).then(res => res.json());

		context.res = {
			status: 200,
			body: data,
			headers: {
				'Content-Type': 'application/json'
			}
		};
		return undefined;
	} else {
		context.log(req.method);
		context.res = {
			status: 405,
			headers: { Allow: 'POST' },
			body: 'Unsupported request method.'
		};
		return undefined;
	}
};
