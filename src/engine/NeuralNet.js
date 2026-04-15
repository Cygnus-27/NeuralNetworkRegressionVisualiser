// A simple JS implementation of a Neural Network for regression (1D -> 1D)

// Sigmoid activation
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const sigmoidDerivative = (x) => {
  const s = sigmoid(x);
  return s * (1 - s);
};

// ReLU activation
export const relu = (x) => Math.max(0, x);
export const reluDerivative = (x) => (x > 0 ? 1 : 0);

// Linear activation (for output layer in regression)
export const linear = (x) => x;
export const linearDerivative = (x) => 1;

// Tanh activation (centered and stable)
export const tanh = (x) => Math.tanh(x);
export const tanhDerivative = (x) => 1 - Math.pow(Math.tanh(x), 2);

export class MLP {
  constructor(layerSizes) {
    this.layerSizes = layerSizes; // e.g., [1, 4, 4, 1] means 1 input, 2 hidden layers with 4 neurons each, 1 output
    this.numLayers = layerSizes.length;
    this.weights = [];
    this.biases = [];

    // Xavier initialization: Uniform(-limit, limit) where limit = sqrt(6 / (fan_in + fan_out))
    for (let i = 0; i < this.numLayers - 1; i++) {
        const rows = layerSizes[i];
        const cols = layerSizes[i + 1];
        
        const limit = Math.sqrt(6 / (rows + cols));
        const layerWeights = [];
        const layerBiases = [];
        
        for (let j = 0; j < rows; j++) {
            const rowWeights = [];
            for (let k = 0; k < cols; k++) {
                rowWeights.push(Math.random() * 2 * limit - limit);
            }
            layerWeights.push(rowWeights);
        }
        
        for (let k = 0; k < cols; k++) {
            layerBiases.push(0); // Biases initialized to 0 is common with Xavier
        }
        
        this.weights.push(layerWeights);
        this.biases.push(layerBiases);
    }
  }

  // Returns activations for each layer, and pre-activations (z)
  forward(input) {
    let activations = [[input]]; // Inputs are 1D, so [[input]]
    let zs = [];
    
    let a = [input];
    for (let i = 0; i < this.numLayers - 1; i++) {
        let z = [];
        let newA = [];
        const layerCols = this.layerSizes[i + 1];
        
        for(let col = 0; col < layerCols; col++) {
            let sum = 0;
            for(let row = 0; row < this.layerSizes[i]; row++) {
                sum += a[row] * this.weights[i][row][col];
            }
            sum += this.biases[i][col];
            z.push(sum);
            
            // Activation fn: Tanh for hidden layers, Linear for output layer
            if (i === this.numLayers - 2) {
                newA.push(linear(sum));
            } else {
                newA.push(tanh(sum)); 
            }
        }
        zs.push(z);
        activations.push(newA);
        a = newA;
    }
    
    return { activations, zs, output: a };
  }

  // Perform one step of gradient descent and return detailed trace metadata
  backward(input, targetY, learningRate) {
    const { activations, zs, output } = this.forward(input);
    const predY = output[0];
    const error = predY - targetY;
    
    let deltas = [];
    
    // Output layer delta
    let deltaOut = [];
    for(let i=0; i<this.layerSizes[this.numLayers-1]; i++) {
        deltaOut.push(error * linearDerivative(zs[zs.length-1][i]));
    }
    deltas.push(deltaOut);
    
    // Backpropagate the error
    for (let i = this.numLayers - 3; i >= 0; i--) {
        let deltaLayer = [];
        const nextLayerCols = this.layerSizes[i + 2];
        const nextDelta = deltas[deltas.length - 1];
        
        for(let currNode = 0; currNode < this.layerSizes[i + 1]; currNode++) {
            let sum = 0;
            for(let nextNode = 0; nextNode < nextLayerCols; nextNode++) {
                sum += this.weights[i + 1][currNode][nextNode] * nextDelta[nextNode];
            }
            sum *= tanhDerivative(zs[i][currNode]);
            deltaLayer.push(sum);
        }
        deltas.push(deltaLayer);
    }
    
    deltas.reverse();
    
    const weightTrace = [];

    // Update weights and biases
    for(let i=0; i<this.numLayers - 1; i++) {
        for(let col=0; col<this.layerSizes[i+1]; col++) {
            this.biases[i][col] -= learningRate * deltas[i][col];
            
            for(let row=0; row<this.layerSizes[i]; row++) {
                const oldWeight = this.weights[i][row][col];
                const grad = activations[i][row] * deltas[i][col];
                this.weights[i][row][col] -= learningRate * grad;
                
                weightTrace.push({
                   layer: i,
                   from: row,
                   to: col,
                   oldWeight,
                   newWeight: this.weights[i][row][col],
                   grad
                });
            }
        }
    }
    
    return { 
      input, 
      targetY, 
      predY, 
      error: error * error, 
      loss: Math.abs(error),
      activations,
      zs,
      deltas,
      weightTrace
    };
  }

  // Process a single point from dataset and return trace
  step(point, learningRate) {
    const { x, y } = point;
    return this.backward(x, y, learningRate);
  }

  trainEpoch(dataset, learningRate) {
    let totalError = 0;
    for(let point of dataset) {
        const res = this.step(point, learningRate);
        totalError += res.error;
    }
    return totalError / dataset.length; 
  }
}
