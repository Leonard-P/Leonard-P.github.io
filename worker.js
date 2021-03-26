importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js",
  "vectors.js"
);

//Quelle: https://stackoverflow.com/questions/3730510/javascript-sort-array-and-return-an-array-of-indicies-that-indicates-the-positi
function sortWithIndices(toSort) {
  for (var i = 0; i < toSort.length; i++) {
    toSort[i] = [toSort[i], i];
  }
  toSort.sort(function (left, right) {
    return left[0] < right[0] ? -1 : 1;
  });
  toSort.sortIndices = [];
  for (var j = 0; j < toSort.length; j++) {
    toSort.sortIndices.push(toSort[j][1]);
    toSort[j] = toSort[j][0];
  }
  return toSort;
}

async function euclidean(x, y) {
  let distance = await tf
    .squaredDifference(x, y)
    .sum((axis = 1))
    .sqrt()
    .array();
  return distance;
}

async function loadAndExecuteModel(imgData) {
  let t0 = performance.now();
  const model = await tf.loadLayersModel("base/model.json");
  let t1 = performance.now();
  console.log("Loaded model in " + (t1 - t0).toString() + " ms");
  var pred = model.predict(imgData, "float32");
  let t2 = performance.now();
  console.log("Prediction took " + (t2 - t1).toString() + " ms");
  pred = tf.tensor(pred.dataSync());
  var distances = await euclidean(tf.stack(vectors), pred.reshape([1, 128]));
  let t3 = performance.now();
  console.log("Compared to vectors in " + (t3 - t2).toString() + " ms");
  self.postMessage(sortWithIndices(distances));
  self.close();
}

self.addEventListener(
  "message",
  async function (e) {
    loadAndExecuteModel(tf.tensor(e.data));
  },
  false
);
