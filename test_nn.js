const { MLP } = require('./src/engine/NeuralNet');
const { DataScaler } = require('./src/engine/DataScaler');

const data = Array.from({length: 60}).map((_, i) => ({ x: i, y: 150 + Math.sin(i / 5) * 40 + i*1.5 }));
const scaler = new DataScaler();
scaler.fit(data);
const scaledData = scaler.scale(data);

const nn = new MLP([1, 8, 8, 1]);
for(let i=0; i < 400; i++) {
  nn.trainEpoch(scaledData, 0.05);
}

const maxX = Math.max(...data.map(d => d.x));
const step = 1;

console.log("Last 5 real prices:", data.slice(-5).map(d => d.y));

let newForecast = [];
for(let i = 1; i <= 5; i++) {
  const futureX = maxX + (i * step);
  const scaledFutureX = scaler.scaleX(futureX);
  const scaledPredY = nn.forward(scaledFutureX).output[0];
  const futureY = scaler.inverseScaleY(scaledPredY);
  newForecast.push(futureY);
}

console.log("Forecast 5 prices:", newForecast);

// What happens if we use [1, 4, 1] and maybe LR 0.1?
const nn2 = new MLP([1, 4, 1]);
for(let i=0; i < 400; i++) {
  nn2.trainEpoch(scaledData, 0.1);
}
let newForecast2 = [];
for(let i = 1; i <= 5; i++) {
  const futureX = maxX + (i * step);
  const scaledFutureX = scaler.scaleX(futureX);
  const scaledPredY = nn2.forward(scaledFutureX).output[0];
  const futureY = scaler.inverseScaleY(scaledPredY);
  newForecast2.push(futureY);
}
console.log("Forecast 5 prices (Shallow):", newForecast2);
