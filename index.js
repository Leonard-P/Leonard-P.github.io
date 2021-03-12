var img = "Lade-Vorschau.svg";

function preprocessInput(img)
{
    img = tf.browser.fromPixels(img);
    img = tf.image.resizeBilinear(img, [350, 350]).toFloat();
    img = img.div(tf.scalar(255.0));
    mean = [0.485, 0.456, 0.406];
    std = [0.229, 0.224, 0.225];

    let indices = [
        tf.tensor1d([0], "int32"),
        tf.tensor1d([1], "int32"),
        tf.tensor1d([2], "int32")
    ];

    let processedValues = {
        red: tf.gather(img, indices[0], 2).sub(tf.scalar(mean[0])).div(tf.scalar(std[0])).reshape([350*350]),
        green: tf.gather(img, indices[1], 2).sub(tf.scalar(mean[1])).div(tf.scalar(std[1])).reshape([350*350]),
        blue: tf.gather(img, indices[2], 2).sub(tf.scalar(mean[2])).div(tf.scalar(std[2])).reshape([350*350]),
    };

    let processedTensor = tf.stack([
        processedValues.red, processedValues.green, processedValues.blue
    ], 1, "float32").reshape([350, 350, 3]).expandDims();
    return processedTensor;
}

//Quelle: https://stackoverflow.com/questions/3730510/javascript-sort-array-and-return-an-array-of-indicies-that-indicates-the-positi
function sortWithIndices(toSort) {
  for (var i = 0; i < toSort.length; i++) {
    toSort[i] = [toSort[i], i];
  }
  toSort.sort(function(left, right) {
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
  let distance = await tf.squaredDifference(x, y).sum(axis=1).sqrt().array();
  return distance;
}

function loadAndExecuteModel(imgData){
  img = imgData;
  tf.loadLayersModel("base/model.json").then(getSimilar);
}

async function getSimilar(model){
  var pred = model.predict(preprocessInput(img), "float32");
  pred = tf.tensor(pred.dataSync());
  t0 = performance.now();
  var distances = await euclidean(tf.stack(vectors), pred.reshape([1, 128]));
  // ugly fix for grey image
  distances[889] += 100
  console.log(performance.now()-t0);
  pred.print();
  t0 = performance.now();
  indices = sortWithIndices(distances).sortIndices;
  console.log(performance.now()-t0);
  for (let i=1; i<=6; i++){
    document.getElementById('platz-'+i.toString()).src = "data/" + indices[i].toString() + ".jpg";
    document.getElementById('platz-'+i.toString()).parentElement.getElementsByClassName("card-text")[1].textContent = "Vektorabstand: " + distances[i].toFixed(3).toString();
  }
  $('#info-message').attr("style", "display: none");
}




